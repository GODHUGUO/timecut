// src/video/video.controller.ts
import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  path: string;
  filename: string;
};

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get()
  getVideo() {
    return 'video works';
  }

  @Get('projects')
  @UseGuards(FirebaseAuthGuard)
  async getLatestProjects(@Req() req: any) {
    const userId = this.videoService.getUserIdFromRequest(req);
    return this.videoService.getLatestProjectsByUser(userId);
  }

  @Get('preferences')
  @UseGuards(FirebaseAuthGuard)
  async getPreferences(@Req() req: any) {
    const userId = this.videoService.getUserIdFromRequest(req);
    return this.videoService.getOrCreateUserPreferences(userId);
  }

  @Get('subscription')
  @UseGuards(FirebaseAuthGuard)
  async getSubscription(@Req() req: any) {
    const userId = this.videoService.getUserIdFromRequest(req);
    return this.videoService.getUserSubscriptionSummary(userId);
  }

  @Post('subscription')
  @UseGuards(FirebaseAuthGuard)
  async updateSubscription(
    @Req() req: any,
    @Body('plan') plan: string,
  ) {
    const userId = this.videoService.getUserIdFromRequest(req);
    return this.videoService.updateUserSubscriptionPlan(userId, plan);
  }

  @Post('preferences')
  @UseGuards(FirebaseAuthGuard)
  async savePreferences(
    @Req() req: any,
    @Body('subtitleTranslationEnabled') subtitleTranslationEnabled: boolean | string,
    @Body('targetSubtitleLanguage') targetSubtitleLanguage: string,
    @Body('captionStyle') captionStyle: string,
  ) {
    const userId = this.videoService.getUserIdFromRequest(req);
    return this.videoService.updateUserPreferences(userId, {
      subtitleTranslationEnabled:
        subtitleTranslationEnabled === true ||
        subtitleTranslationEnabled === 'true',
      targetSubtitleLanguage,
      captionStyle,
    });
  }

  @Post('upload')
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @Req() req: any,
    @UploadedFile() file: MulterFile,
    @Body('clipDuration') clipDuration: string,
    @Body('subtitleMode') subtitleMode: string,
  ) {
    const userId = this.videoService.getUserIdFromRequest(req);
    return this.videoService.handleUpload(
      file,
      Number(clipDuration),
      userId,
      subtitleMode,
    );
  }
}
