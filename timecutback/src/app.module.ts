import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideoModule } from './video/video.module';
import { StorageModule } from './storage/storage.module';
import { ProcessingModule } from './processing/processing.module';
import { PrismaModule } from './prisma/prisma.module';
import { AIService } from './ai/ai.service';
import { PaymentModule } from './payment/payment.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [VideoModule, StorageModule, ProcessingModule, PrismaModule, PaymentModule, AdminModule],
  controllers: [AppController],
  providers: [AppService, AIService],
})
export class AppModule {}
