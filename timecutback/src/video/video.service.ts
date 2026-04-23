// src/video/video.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { ProcessingService } from '../processing/processing.service';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';

type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  path: string;
  filename: string;
};

type UserPreferencesPayload = {
  subtitleTranslationEnabled: boolean;
  targetSubtitleLanguage: string;
  captionStyle: string;
};

const PLAN_CONFIG = {
  free: {
    name: 'Gratuit',
    price: '0€',
    monthlyMinutes: 60, // TEST MODE
    canUseAiSubtitles: true, // TEST MODE
    canTranslateSubtitles: true, // TEST MODE
  },
  starter: {
    name: 'Starter',
    price: '3,99€',
    monthlyMinutes: 60,
    canUseAiSubtitles: true,
    canTranslateSubtitles: true,
  },
  pro: {
    name: 'Pro',
    price: '11,99€',
    monthlyMinutes: 200,
    canUseAiSubtitles: true,
    canTranslateSubtitles: true,
  },
} as const;

type PlanKey = keyof typeof PLAN_CONFIG;

type SubscriptionSummary = {
  currentPlan: PlanKey;
  minutesIncluded: number;
  minutesUsed: number;
  minutesRemaining: number;
  canUseAiSubtitles: boolean;
  canTranslateSubtitles: boolean;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
};

@Injectable()
export class VideoService {
  constructor(
    private readonly storageService: StorageService,
    private readonly processingService: ProcessingService,
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  private get subscriptionRepo() {
    return (this.prisma as any).userSubscription;
  }

  private getPlanKey(plan: string | null | undefined): PlanKey {
    if (plan === 'starter' || plan === 'pro') return plan;
    return 'free';
  }

  private getNextBillingPeriodStart(date: Date): Date {
    const next = new Date(date);
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  private async getOrCreateUserSubscriptionRecord(userId: string) {
    const subscription = await this.subscriptionRepo.upsert({
      where: { userId },
      create: {
        userId,
        currentPlan: 'free',
        monthlyMinutesUsed: 0,
        billingPeriodStart: new Date(),
      },
      update: {},
    });

    return this.refreshSubscriptionCycle(subscription);
  }

  private async refreshSubscriptionCycle(subscription: {
    id: number;
    userId: string;
    currentPlan: string;
    monthlyMinutesUsed: number;
    billingPeriodStart: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const nextPeriodStart = this.getNextBillingPeriodStart(
      subscription.billingPeriodStart,
    );

    if (new Date() < nextPeriodStart) {
      return subscription;
    }

    return this.subscriptionRepo.update({
      where: { id: subscription.id },
      data: {
        monthlyMinutesUsed: 0,
        billingPeriodStart: new Date(),
      },
    });
  }

  private buildSubscriptionSummary(subscription: {
    currentPlan: string;
    monthlyMinutesUsed: number;
    billingPeriodStart: Date;
  }): SubscriptionSummary {
    const currentPlan = this.getPlanKey(subscription.currentPlan);
    const plan = PLAN_CONFIG[currentPlan];
    const minutesUsed = Math.max(subscription.monthlyMinutesUsed, 0);
    const minutesRemaining = Math.max(plan.monthlyMinutes - minutesUsed, 0);

    return {
      currentPlan,
      minutesIncluded: plan.monthlyMinutes,
      minutesUsed,
      minutesRemaining,
      canUseAiSubtitles: plan.canUseAiSubtitles,
      canTranslateSubtitles: plan.canTranslateSubtitles,
      billingPeriodStart: subscription.billingPeriodStart,
      billingPeriodEnd: this.getNextBillingPeriodStart(
        subscription.billingPeriodStart,
      ),
    };
  }

  async handleUpload(
    file: MulterFile,
    clipDuration: number,
    userId: string,
    subtitleMode?: string,
  ): Promise<{
    clips: string[];
    subtitles: {
      text: string;
      srtPath: string;
    };
  }> {
    if (!Number.isFinite(clipDuration) || clipDuration <= 0) {
      throw new BadRequestException(
        'La duree de clip doit etre un nombre positif.',
      );
    }

    const totalDuration = await this.processingService.getMediaDuration(file.path);
    if (totalDuration > 0 && clipDuration > totalDuration) {
      throw new BadRequestException(
        `La duree du clip (${clipDuration}s) ne peut pas depasser la duree totale de la video (${Math.floor(totalDuration)}s).`,
      );
    }

    const subscription = await this.getUserSubscriptionSummary(userId);
    const shouldGenerateSubtitles = subtitleMode !== 'none';

    if (shouldGenerateSubtitles && !subscription.canUseAiSubtitles) {
      throw new BadRequestException(
        'Les sous-titres IA sont reserves aux abonnements Starter et Pro.',
      );
    }

    const minutesToConsume = Math.max(Math.ceil(totalDuration / 60), 1);
    if (minutesToConsume > subscription.minutesRemaining) {
      throw new BadRequestException(
        `Quota insuffisant : il vous reste ${subscription.minutesRemaining} min sur ${subscription.minutesIncluded} min ce mois-ci.`,
      );
    }

    const video = await this.prisma.video.create({
      data: {
        filename: file.originalname,
        userId,
      },
    });

    const preferences = await this.getOrCreateUserPreferences(userId);

    let subtitles = {
      text: '',
      srtPath: '',
    };

    // ÉTAPE 1 : Générer sous-titres ET découper la vidéo EN PARALLÈLE
    const subtitlesPromise = shouldGenerateSubtitles
      ? this.aiService.generateSubtitlesFromVideo(file.path, {
          translationEnabled: preferences.subtitleTranslationEnabled,
          targetLanguage: preferences.targetSubtitleLanguage,
        })
      : Promise.resolve(null);

    const clipPathsPromise = this.processingService.splitVideo(file, clipDuration);

    const [subtitleResult, clipPaths] = await Promise.all([
      subtitlesPromise,
      clipPathsPromise,
    ]);

    if (subtitleResult) {
      subtitles = subtitleResult;
    }

    // ÉTAPE 2 : Incruster les sous-titres dans chaque clip en parallèle (rapide)
    let finalClipPaths = clipPaths;
    if (subtitleResult) {
      finalClipPaths = await this.processingService.burnSubtitlesIntoClips(
        clipPaths,
        subtitleResult.srtPath,
        preferences.captionStyle,
        clipDuration,
      );
    }

    const urls: string[] = [];

    // ÉTAPE 3 : Upload tous les clips en parallèle (max 5 simultanément)
    const CONCURRENT_UPLOADS = 5;
    for (let i = 0; i < finalClipPaths.length; i += CONCURRENT_UPLOADS) {
      const batch = finalClipPaths.slice(i, i + CONCURRENT_UPLOADS);
      const batchUrls = await Promise.all(
        batch.map((clipPath) =>
          this.storageService.upload({ ...file, path: clipPath }),
        ),
      );
      urls.push(...batchUrls);
    }

    // Créer tous les clips en DB en une seule transaction
    await this.prisma.clip.createMany({
      data: urls.map((url) => ({
        url,
        duration: clipDuration,
        videoId: video.id,
      })),
    });

    await this.subscriptionRepo.update({
      where: { userId },
      data: {
        monthlyMinutesUsed: {
          increment: minutesToConsume,
        },
      },
    });

    return {
      clips: urls,
      subtitles: {
        text: subtitles.text,
        srtPath: subtitles.srtPath,
      },
    };
  }

  async getVideoWithClips(videoId: number) {
    return this.prisma.video.findUnique({
      where: { id: videoId },
      include: { clips: true },
    });
  }

  getUserIdFromRequest(req: any): string {
    const userId =
      req?.user?.id ??
      req?.user?.userId ??
      req?.user?.sub ??
      req?.headers?.['x-user-id'];

    if (!userId) {
      throw new UnauthorizedException(
        'Utilisateur non authentifie. userId introuvable dans la requete.',
      );
    }

    return String(userId);
  }

  async getLatestProjectsByUser(userId: string) {
    return this.prisma.video.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        clips: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async getUserSubscriptionSummary(userId: string): Promise<SubscriptionSummary> {
    const subscription = await this.getOrCreateUserSubscriptionRecord(userId);
    return this.buildSubscriptionSummary(subscription);
  }

  async updateUserSubscriptionPlan(
    userId: string,
    requestedPlan: string,
  ): Promise<SubscriptionSummary> {
    const current = await this.getOrCreateUserSubscriptionRecord(userId);
    const nextPlan = this.getPlanKey(requestedPlan);

    const updated = await this.subscriptionRepo.update({
      where: { id: current.id },
      data: {
        currentPlan: nextPlan,
      },
    });

    return this.buildSubscriptionSummary(updated);
  }

  async getOrCreateUserPreferences(userId: string): Promise<UserPreferencesPayload> {
    const subscription = await this.getUserSubscriptionSummary(userId);
    const preferences = await this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        subtitleTranslationEnabled: false,
        targetSubtitleLanguage: 'fr',
        captionStyle: 'bold',
      },
      update: {},
      select: {
        subtitleTranslationEnabled: true,
        targetSubtitleLanguage: true,
        captionStyle: true,
      },
    });

    return {
      ...preferences,
      subtitleTranslationEnabled: subscription.canTranslateSubtitles
        ? preferences.subtitleTranslationEnabled
        : false,
    };
  }

  async updateUserPreferences(
    userId: string,
    payload: Partial<UserPreferencesPayload>,
  ): Promise<UserPreferencesPayload> {
    const current = await this.getOrCreateUserPreferences(userId);
    const subscription = await this.getUserSubscriptionSummary(userId);
    const next = {
      subtitleTranslationEnabled:
        subscription.canTranslateSubtitles
          ? payload.subtitleTranslationEnabled ?? current.subtitleTranslationEnabled
          : false,
      targetSubtitleLanguage:
        payload.targetSubtitleLanguage ?? current.targetSubtitleLanguage,
      captionStyle: payload.captionStyle ?? current.captionStyle,
    };

    return this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...next,
      },
      update: next,
      select: {
        subtitleTranslationEnabled: true,
        targetSubtitleLanguage: true,
        captionStyle: true,
      },
    });
  }
}
