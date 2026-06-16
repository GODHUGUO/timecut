// src/video/video.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { QueueType, Priority } from '../processing/processing-queue.service';

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
  async updateSubscription(@Req() req: any, @Body('plan') plan: string) {
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

  @Get('sign-upload')
  @UseGuards(FirebaseAuthGuard)
  async signUpload(@Req() req: any) {
    const userId = this.videoService.getUserIdFromRequest(req);
    return this.videoService.signUpload(userId);
  }

  @Get('queue-status')
  @UseGuards(FirebaseAuthGuard)
  async getQueueStatus(
    @Req() req: any,
    @Query('type') type: string,
  ) {
    const queueType: QueueType = type === 'heavy' ? 'heavy' : 'light';
    const userId = this.videoService.getUserIdFromRequest(req);
    const subscription = await this.videoService.getUserSubscriptionSummary(userId);
    const priority: Priority =
      subscription.currentPlan === 'free' ? 'normal' : 'high';
    return {
      ...this.videoService.getQueueStatus(queueType, priority),
      userPriority: priority,
      userPlan: subscription.currentPlan,
    };
  }

  @Post('process')
  @UseGuards(FirebaseAuthGuard)
  async processVideo(
    @Req() req: any,
    @Body('publicId') publicId: string,
    @Body('duration') duration: number,
    @Body('filename') filename: string,
    @Body('clipDuration') clipDuration: number,
    @Body('subtitleMode') subtitleMode: string,
    @Body('format') format: string,
  ) {
    const userId = this.videoService.getUserIdFromRequest(req);
    return this.videoService.processVideo(
      publicId,
      Number(duration),
      filename,
      Number(clipDuration),
      userId,
      subtitleMode,
      format,
    );
  }

  @Post('reformat')
  @UseGuards(FirebaseAuthGuard)
  async reformatVideo(
    @Req() req: any,
    @Body('publicId') publicId: string,
    @Body('duration') duration: number,
    @Body('filename') filename: string,
    @Body('format') format: string,
  ) {
    const userId = this.videoService.getUserIdFromRequest(req);
    return this.videoService.reformatUserVideo(
      publicId,
      Number(duration),
      filename,
      format,
      userId,
    );
  }
}
