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
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

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
