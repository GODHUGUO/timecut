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

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @RawBody() rawBody: string,
    @Headers('x-leekpay-signature') signature: string,
  ) {
    return this.paymentService.handleWebhook(rawBody, signature);
  }
}
