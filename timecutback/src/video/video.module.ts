import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ProcessingService } from '../processing/processing.service';
import { AIService } from '../ai/ai.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
@Module({
  imports: [
    PrismaModule,
    StorageModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${file.originalname}`;
          cb(null, uniqueName);
        },
      }),
    }),
  ],
  controllers: [VideoController],
  providers: [VideoService, ProcessingService, AIService, FirebaseAuthGuard],
})
export class VideoModule {}
