import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHmac, timingSafeEqual } from 'crypto';

const LEEKPAY_API_URL = 'https://leekpay.fr/api/v1';

const PLAN_PRICES = {
  starter: { amount: 3.99, currency: 'EUR', name: 'Starter' },
  pro: { amount: 12.99, currency: 'EUR', name: 'Pro' },
} as const;

type PlanKey = keyof typeof PLAN_PRICES;

interface LeekPayCheckoutData {
  payment_id: string;
  payment_url: string;
  status: string;
}

interface LeekPayCheckoutResponse {
  success: boolean;
  data: LeekPayCheckoutData;
}

interface LeekPayTransaction {
  id: string | number;
  customer_email?: string;
  amount?: number;
}

interface LeekPayWebhookEvent {
  event: string;
  transaction: LeekPayTransaction;
}

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

    const data = (await response.json()) as LeekPayCheckoutResponse;
    if (!data.success || !data.data) {
      throw new BadRequestException('Réponse invalide de LeekPay');
    }

    const checkout: LeekPayCheckoutData = data.data;

    // Sauvegarder le paiement en base
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        plan: planKey,
        amount: Math.round(planConfig.amount * 100),
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

  async getUserPayments(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return payments.map((p) => ({
      id: p.paymentId ?? String(p.id),
      amount: p.amount / 100,
      currency: p.currency,
      status: p.status,
      plan: p.plan,
      date: p.createdAt,
      description: p.description,
    }));
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

    return response.json() as Promise<unknown>;
  }

  async handleWebhook(payload: string, signature: string) {
    if (!this.verifySignature(payload, signature)) {
      console.error('[Webhook] Signature invalide reçue');
      throw new UnauthorizedException('Signature webhook invalide');
    }

    const event = JSON.parse(payload) as LeekPayWebhookEvent;
    console.log('[Webhook] Événement reçu:', event.event);

    if (event.event !== 'payment.success') {
      return { received: true, processed: false };
    }

    const transaction: LeekPayTransaction = event.transaction;
    if (!transaction) {
      return { received: true, processed: false };
    }

    console.log(
      '[Webhook] Transaction ID:',
      transaction.id,
      '| Email:',
      transaction.customer_email,
    );

    // Chercher d'abord par paymentId exact, sinon par email + pending
    let targetPayment = await this.prisma.payment.findFirst({
      where: { paymentId: String(transaction.id), status: 'pending' },
    });

    if (!targetPayment && transaction.customer_email) {
      targetPayment = await this.prisma.payment.findFirst({
        where: { customerEmail: transaction.customer_email, status: 'pending' },
        orderBy: { createdAt: 'desc' },
      });
      console.log(
        '[Webhook] Fallback email match:',
        targetPayment?.id ?? 'non trouvé',
      );
    }

    if (!targetPayment) {
      console.error(
        '[Webhook] Aucun paiement pending trouvé pour transaction:',
        transaction.id,
      );
      return { received: true, processed: false, reason: 'payment_not_found' };
    }

    await this.prisma.payment.update({
      where: { id: targetPayment.id },
      data: { status: 'completed', paymentId: String(transaction.id) },
    });

    console.log('[Webhook] Paiement mis à jour, id DB:', targetPayment.id);

    const updatedPayment = targetPayment;

    if (updatedPayment) {
      await this.activateSubscription(
        updatedPayment.userId,
        updatedPayment.plan,
      );
      console.log(
        '[Webhook] Abonnement activé pour userId:',
        updatedPayment.userId,
        'plan:',
        updatedPayment.plan,
      );
    }

    return { received: true, processed: true };
  }

  async confirmPayment(userId: string, leekpayPaymentId: string) {
    const statusResponse = await this.verifyPaymentStatus(leekpayPaymentId);
    const status = statusResponse as { data?: { status?: string } };

    if (
      status?.data?.status !== 'completed' &&
      status?.data?.status !== 'paid'
    ) {
      return {
        success: false,
        reason: 'payment_not_completed',
        status: status?.data?.status,
      };
    }

    const payment = await this.prisma.payment.findFirst({
      where: { paymentId: leekpayPaymentId, userId },
    });

    if (!payment) {
      return { success: false, reason: 'payment_not_found' };
    }

    await this.prisma.payment.updateMany({
      where: { paymentId: leekpayPaymentId },
      data: { status: 'completed' },
    });

    await this.activateSubscription(payment.userId, payment.plan);

    return { success: true, plan: payment.plan };
  }

  private verifySignature(payload: string, signature: string): boolean {
    try {
      const expected = createHmac('sha256', this.publicKey)
        .update(payload)
        .digest('hex');
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
      throw new BadRequestException(
        'Plan invalide. Choisissez starter ou pro.',
      );
    }
    return plan;
  }
}
