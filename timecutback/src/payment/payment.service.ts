import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHmac, timingSafeEqual } from 'crypto';

const LEEKPAY_API_URL = 'https://leekpay.fr/api/v1';

const PLAN_PRICES = {
  starter: { amount: 3.99, currency: 'EUR', name: 'Starter' },
  pro: { amount: 11.99, currency: 'EUR', name: 'Pro' },
} as const;

type PlanKey = keyof typeof PLAN_PRICES;

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  private get secretKey(): string {
    const key = process.env.LEEKPAY_SECRET_KEY;
    if (!key) throw new Error('LEEKPAY_SECRET_KEY non configurée');
    return key;
  }

  private get publicKey(): string {
    const key = process.env.LEEKPAY_PUBLIC_KEY;
    if (!key) throw new Error('LEEKPAY_PUBLIC_KEY non configurée');
    return key;
  }

  async createCheckout(userId: string, plan: string, customerEmail?: string) {
    const planKey = this.validatePlan(plan);
    const planConfig = PLAN_PRICES[planKey];

    // Créer un checkout via l'API LeekPay
    const response = await fetch(`${LEEKPAY_API_URL}/checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: planConfig.amount,
        currency: planConfig.currency,
        description: `Abonnement TimeCut ${planConfig.name}`,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing?payment=success`,
        customer_email: customerEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Erreur LeekPay: ${error}`);
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new BadRequestException('Réponse invalide de LeekPay');
    }

    const checkout = data.data;

    // Sauvegarder le paiement en base
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        plan: planKey,
        amount: planConfig.amount,
        currency: planConfig.currency,
        status: 'pending',
        paymentId: checkout.payment_id,
        checkoutUrl: checkout.payment_url,
        customerEmail: customerEmail || null,
        description: `Abonnement TimeCut ${planConfig.name}`,
      },
    });

    return {
      paymentUrl: checkout.payment_url,
      paymentId: checkout.payment_id,
      status: checkout.status,
      payment,
    };
  }

  async verifyPaymentStatus(paymentId: string) {
    const response = await fetch(`${LEEKPAY_API_URL}/checkout/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Erreur vérification LeekPay: ${error}`);
    }

    return response.json();
  }

  async handleWebhook(payload: string, signature: string) {
    if (!this.verifySignature(payload, signature)) {
      throw new UnauthorizedException('Signature webhook invalide');
    }

    const event = JSON.parse(payload);
    if (event.event !== 'payment.success') {
      return { received: true, processed: false };
    }

    const transaction = event.transaction;
    if (!transaction) {
      return { received: true, processed: false };
    }

    // Mettre à jour le statut du paiement
    const payment = await this.prisma.payment.updateMany({
      where: { paymentId: String(transaction.id) },
      data: {
        status: 'completed',
      },
    });

    if (payment.count === 0) {
      // Paiement non trouvé, on essaie de le retrouver par montant + email
      return { received: true, processed: false, reason: 'payment_not_found' };
    }

    // Récupérer le paiement mis à jour pour mettre à jour l'abonnement
    const updatedPayment = await this.prisma.payment.findFirst({
      where: { paymentId: String(transaction.id) },
    });

    if (updatedPayment) {
      await this.activateSubscription(updatedPayment.userId, updatedPayment.plan);
    }

    return { received: true, processed: true };
  }

  private verifySignature(payload: string, signature: string): boolean {
    try {
      const expected = createHmac('sha256', this.publicKey).update(payload).digest('hex');
      const expectedBuf = Buffer.from(expected, 'hex');
      const signatureBuf = Buffer.from(signature, 'hex');

      if (expectedBuf.length !== signatureBuf.length) {
        return false;
      }

      return timingSafeEqual(expectedBuf, signatureBuf);
    } catch {
      return false;
    }
  }

  private async activateSubscription(userId: string, plan: string) {
    await this.prisma.userSubscription.upsert({
      where: { userId },
      create: {
        userId,
        currentPlan: plan,
        monthlyMinutesUsed: 0,
        billingPeriodStart: new Date(),
      },
      update: {
        currentPlan: plan,
        monthlyMinutesUsed: 0,
        billingPeriodStart: new Date(),
      },
    });
  }

  private validatePlan(plan: string): PlanKey {
    if (plan !== 'starter' && plan !== 'pro') {
      throw new BadRequestException('Plan invalide. Choisissez starter ou pro.');
    }
    return plan;
  }
}
