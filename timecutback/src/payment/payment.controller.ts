import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  UseGuards,
  RawBody,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Get,
  Query,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

const EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/;

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('checkout')
  @UseGuards(FirebaseAuthGuard)
  async createCheckout(
    @Req() req: any,
    @Body('plan') plan: string,
    @Body('customerEmail') customerEmail?: string,
  ) {
    const userId = req.user?.uid ?? req.user?.id ?? req.headers['x-user-id'];
    if (!userId) {
      return { error: 'Utilisateur non authentifié' };
    }

    if (customerEmail !== undefined && customerEmail !== null && customerEmail !== '') {
      if (typeof customerEmail !== 'string' || !EMAIL_REGEX.test(customerEmail)) {
        throw new BadRequestException('Adresse email invalide.');
      }
    }

    return this.paymentService.createCheckout(userId, plan, customerEmail);
  }

  @Get('history')
  @UseGuards(FirebaseAuthGuard)
  async getUserPayments(@Req() req: any) {
    const userId = req.user?.uid ?? req.user?.id ?? req.headers['x-user-id'];
    if (!userId) {
      return { error: 'Utilisateur non authentifié' };
    }
    return this.paymentService.getUserPayments(userId);
  }

  @Get('confirm')
  @UseGuards(FirebaseAuthGuard)
  async confirmPayment(
    @Req() req: any,
    @Query('payment_id') paymentId: string,
  ) {
    console.log('>>> [PaymentController] /payment/confirm APPELÉ');
    console.log('>>> [PaymentController] payment_id query:', paymentId);
    console.log('>>> [PaymentController] req.user uid:', req.user?.uid);

    const userId = req.user?.uid ?? req.user?.id ?? req.headers['x-user-id'];
    if (!userId) {
      console.warn('>>> [PaymentController] /payment/confirm refus: pas de userId');
      return { error: 'Utilisateur non authentifié' };
    }

    // Si pas de payment_id explicite, confirme le dernier pending de l'utilisateur
    if (!paymentId) {
      console.log('>>> [PaymentController] Pas de payment_id, on prend le dernier pending');
      return this.paymentService.confirmLatestPending(userId);
    }
    return this.paymentService.confirmPayment(userId, paymentId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @RawBody() rawBody: Buffer,
    @Headers('x-leekpay-signature') signature: string,
    @Req() req: any,
  ) {
    console.log('====== WEBHOOK LEEKPAY REÇU ======');
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Signature:', signature);
    const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
    console.log('Body:', bodyStr);
    console.log('===================================');
    return this.paymentService.handleWebhook(bodyStr, signature ?? '');
  }
}
