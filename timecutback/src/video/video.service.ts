// src/video/video.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { ProcessingService } from '../processing/processing.service';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import * as fs from 'fs';
import * as path from 'path';

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
  private readonly logger = new Logger(VideoService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly processingService: ProcessingService,
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

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
    const subscription = await this.prisma.userSubscription.upsert({
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

  private refreshSubscriptionCycle(subscription: {
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

    return this.prisma.userSubscription.update({
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
    this.logger.log(`=== UPLOAD DEBUG ===`);
    this.logger.log(`subtitleMode received: "${subtitleMode}"`);
    this.logger.log(`subtitleMode type: ${typeof subtitleMode}`);
    this.logger.log(`clipDuration: ${clipDuration}`);
    this.logger.log(`userId: ${userId}`);
    this.logger.log(`===================`);

    if (!Number.isFinite(clipDuration) || clipDuration <= 0) {
      throw new BadRequestException(
        'La duree de clip doit etre un nombre positif.',
      );
    }

    const totalDuration = await this.processingService.getMediaDuration(
      file.path,
    );
    if (totalDuration > 0 && clipDuration > totalDuration) {
      throw new BadRequestException(
        `La duree du clip (${clipDuration}s) ne peut pas depasser la duree totale de la video (${Math.floor(totalDuration)}s).`,
      );
    }

    const subscription = await this.getUserSubscriptionSummary(userId);
    const shouldGenerateSubtitles = subtitleMode !== 'none';
    this.logger.log(
      `shouldGenerateSubtitles: ${shouldGenerateSubtitles} (subtitleMode !== 'none')`,
    );

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

    try {
      // ÉTAPE 1 : Upload vidéo complète vers Cloudinary
      this.logger.log(
        `Uploading full video to Cloudinary: ${file.originalname}`,
      );
      const { publicId, duration: cloudDuration } =
        await this.storageService.uploadFullVideo(file);
      const effectiveDuration = cloudDuration || totalDuration;

      // ÉTAPE 2 : Générer les URLs de clips via transformations Cloudinary
      const clipUrls = this.storageService.generateClipUrls(
        publicId,
        clipDuration,
        effectiveDuration,
      );
      this.logger.log(`Generated ${clipUrls.length} clip URLs`);

      let finalUrls: string[];
      let subtitles = { text: '', srtPath: '' };

      if (!shouldGenerateSubtitles) {
        // ─── FLUX SANS SOUS-TITRES ───
        this.logger.log(
          '>>> FLUX SANS SOUS-TITRES: Utilisant les URLs Cloudinary directes',
        );
        finalUrls = clipUrls;
        this.logger.log(`Nombre de clips: ${finalUrls.length}`);
        this.logger.log(`Premier URL: ${finalUrls[0]}`);
      } else {
        // ─── FLUX AVEC SOUS-TITRES ───
        this.logger.log('>>> FLUX AVEC SOUS-TITRES: Traitement de chaque clip');
        const CONCURRENT_CLIPS = 3;
        const processedClips: {
          url: string;
          text: string;
          srtContent: string;
          clipDuration: number;
        }[] = [];

        for (let i = 0; i < clipUrls.length; i += CONCURRENT_CLIPS) {
          const batch = clipUrls.slice(i, i + CONCURRENT_CLIPS);
          const batchResults = await Promise.all(
            batch.map((clipUrl, batchIdx) =>
              this.processClipWithSubtitles(
                clipUrl,
                i + batchIdx,
                preferences,
                file,
              ),
            ),
          );
          processedClips.push(...batchResults);
        }

        finalUrls = processedClips.map((c) => c.url);

        // Construire un SRT global fusionné avec timestamps décalés
        const mergedSrt = this.mergeSrtContents(processedClips);
        let srtUrl = '';

        if (mergedSrt) {
          const tmpSrtPath = path.join(
            './uploads',
            `global_srt_${Date.now()}.srt`,
          );
          try {
            fs.writeFileSync(tmpSrtPath, mergedSrt, 'utf-8');
            srtUrl = await this.storageService.uploadRaw(tmpSrtPath);
          } finally {
            this.safeDeleteFile(tmpSrtPath);
          }
        }

        subtitles = {
          text: processedClips
            .map((c) => c.text)
            .join(' ')
            .trim(),
          srtPath: srtUrl,
        };
      }

      // ÉTAPE 3 : Créer les enregistrements Clip en DB
      await this.prisma.clip.createMany({
        data: finalUrls.map((url) => ({
          url,
          duration: clipDuration,
          videoId: video.id,
        })),
      });

      this.logger.log(`>>> RETURNING ${finalUrls.length} clip URLs`);
      this.logger.log(`First URL: ${finalUrls[0]}`);
      this.logger.log(
        `Has subtitles in URL path: ${finalUrls[0].includes('_sub') || finalUrls[0].includes('subtitle')}`,
      );

      // ÉTAPE 4 : Mettre à jour la subscription (minutesUsed)
      await this.prisma.userSubscription.update({
        where: { userId },
        data: {
          monthlyMinutesUsed: {
            increment: minutesToConsume,
          },
        },
      });

      return {
        clips: finalUrls,
        subtitles,
      };
    } finally {
      // Toujours supprimer le fichier local original (même en cas d'erreur)
      this.safeDeleteFile(file.path);
    }
  }

  /**
   * Traite un clip individuel avec sous-titres :
   * télécharge → transcrit → incrust → re-upload → nettoyage
   */
  private async processClipWithSubtitles(
    clipUrl: string,
    clipIndex: number,
    preferences: UserPreferencesPayload,
    file: MulterFile,
  ): Promise<{
    url: string;
    text: string;
    srtContent: string;
    clipDuration: number;
  }> {
    const tempDir = path.join(
      './uploads',
      `clip_tmp_${Date.now()}_${clipIndex}`,
    );
    fs.mkdirSync(tempDir, { recursive: true });

    const localClipPath = path.join(tempDir, `clip_${clipIndex}.mp4`);
    let subClipPath: string | null = null;
    let srtFilePath: string | null = null;
    let srtContent = '';

    try {
      // a. Télécharger le clip depuis Cloudinary
      this.logger.log(`Downloading clip ${clipIndex} from Cloudinary`);
      await this.storageService.downloadClipFromUrl(clipUrl, localClipPath);

      // Mesurer la durée réelle du clip
      const actualClipDuration =
        await this.processingService.getMediaDuration(localClipPath);

      // b. Transcrire via AI
      this.logger.log(`Transcribing clip ${clipIndex}`);
      const subtitleResult = await this.aiService.generateSubtitlesFromClip(
        localClipPath,
        clipIndex,
        {
          translate: preferences.subtitleTranslationEnabled,
          targetLanguage: preferences.targetSubtitleLanguage,
        },
      );
      srtFilePath = subtitleResult.srtPath;

      // Lire le contenu SRT AVANT le nettoyage
      if (srtFilePath && fs.existsSync(srtFilePath)) {
        srtContent = fs.readFileSync(srtFilePath, 'utf-8');
        this.logger.log(
          `\n========== SRT FILE CONTENT (Clip ${clipIndex}) ==========`,
        );
        this.logger.log(`File: ${srtFilePath}`);
        this.logger.log(`Size: ${srtContent.length} characters`);
        this.logger.log(`Content:\n${srtContent}`);
        this.logger.log(
          `==========================================================\n`,
        );
      } else {
        this.logger.warn(`SRT file does not exist at: ${srtFilePath}`);
      }

      // c. Incruster sous-titres
      this.logger.log(`Burning subtitles into clip ${clipIndex}`);
      this.logger.log(`SRT file path: ${subtitleResult.srtPath}`);
      subClipPath = await this.processingService.burnSrtIntoClip(
        localClipPath,
        subtitleResult.srtPath,
        preferences.captionStyle,
      );
      this.logger.log(`Subtitle burned successfully, output: ${subClipPath}`);

      // d. Re-upload le clip avec sous-titres vers Cloudinary
      this.logger.log(`Re-uploading clip ${clipIndex} with subtitles`);

      // Vérifier la taille du fichier avec sous-titres
      if (subClipPath && fs.existsSync(subClipPath)) {
        const stats = fs.statSync(subClipPath);
        this.logger.log(
          `SubClip file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        );
      }

      const finalUrl = await this.storageService.upload({
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size,
        path: subClipPath,
        filename: file.filename,
      });
      this.logger.log(`Clip ${clipIndex} uploaded with URL: ${finalUrl}`);

      this.logger.log(
        `\n========== TRANSCRIPTION RESULT (Clip ${clipIndex}) ==========`,
      );
      this.logger.log(`Transcribed text: ${subtitleResult.text}`);
      this.logger.log(
        `=============================================================\n`,
      );

      return {
        url: finalUrl,
        text: subtitleResult.text,
        srtContent,
        clipDuration: actualClipDuration,
      };
    } finally {
      // e. Nettoyage des fichiers temporaires
      this.safeDeleteFile(localClipPath);
      if (subClipPath) this.safeDeleteFile(subClipPath);
      if (srtFilePath) this.safeDeleteFile(srtFilePath);
      // Supprimer le dossier temporaire
      this.safeDeleteDir(tempDir);
    }
  }

  /**
   * Fusionne les contenus SRT de plusieurs clips en un SRT global
   * avec timestamps décalés selon la position de chaque clip.
   */
  private mergeSrtContents(
    clips: { srtContent: string; clipDuration: number }[],
  ): string {
    let globalIndex = 1;
    let cumulativeOffset = 0;
    const blocks: string[] = [];

    for (const clip of clips) {
      if (!clip.srtContent.trim()) {
        cumulativeOffset += clip.clipDuration;
        continue;
      }

      const entries = clip.srtContent.trim().split(/\n\n+/);
      for (const entry of entries) {
        const lines = entry.split('\n');
        if (lines.length < 2) continue;

        // Trouver la ligne de timestamp (format: 00:00:01,000 --> 00:00:03,500)
        const tsLineIdx = lines.findIndex((l) => l.includes(' --> '));
        if (tsLineIdx === -1) continue;

        const tsParts = lines[tsLineIdx].split(' --> ');
        if (tsParts.length !== 2) continue;

        const start = this.parseSrtTime(tsParts[0].trim()) + cumulativeOffset;
        const end = this.parseSrtTime(tsParts[1].trim()) + cumulativeOffset;
        const textLines = lines.slice(tsLineIdx + 1).join('\n');

        blocks.push(
          `${globalIndex}\n${this.formatSrtTime(start)} --> ${this.formatSrtTime(end)}\n${textLines}`,
        );
        globalIndex++;
      }

      cumulativeOffset += clip.clipDuration;
    }

    return blocks.join('\n\n');
  }

  /** Parse un timestamp SRT (HH:MM:SS,mmm) en secondes */
  private parseSrtTime(time: string): number {
    const match = time.match(/(\d{2}):(\d{2}):(\d{2})[,[,.]](\d{3})/);
    if (!match) return 0;
    return (
      parseInt(match[1]) * 3600 +
      parseInt(match[2]) * 60 +
      parseInt(match[3]) +
      parseInt(match[4]) / 1000
    );
  }

  /** Formate des secondes en timestamp SRT (HH:MM:SS,mmm) */
  private formatSrtTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return (
      String(h).padStart(2, '0') +
      ':' +
      String(m).padStart(2, '0') +
      ':' +
      String(s).padStart(2, '0') +
      ',' +
      String(ms).padStart(3, '0')
    );
  }

  private safeDeleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      /* ignore */
    }
  }

  private safeDeleteDir(dirPath: string): void {
    try {
      if (fs.existsSync(dirPath))
        fs.rmSync(dirPath, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }

  async getVideoWithClips(videoId: number) {
    return this.prisma.video.findUnique({
      where: { id: videoId },
      include: { clips: true },
    });
  }

  getUserIdFromRequest(req: {
    user?: { id?: string; userId?: string; sub?: string };
    headers?: Record<string, string | undefined>;
  }): string {
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

  async getUserSubscriptionSummary(
    userId: string,
  ): Promise<SubscriptionSummary> {
    const subscription = await this.getOrCreateUserSubscriptionRecord(userId);
    return this.buildSubscriptionSummary(subscription);
  }

  async updateUserSubscriptionPlan(
    userId: string,
    requestedPlan: string,
  ): Promise<SubscriptionSummary> {
    const current = await this.getOrCreateUserSubscriptionRecord(userId);
    const nextPlan = this.getPlanKey(requestedPlan);

    const updated = await this.prisma.userSubscription.update({
      where: { id: current.id },
      data: {
        currentPlan: nextPlan,
      },
    });

    return this.buildSubscriptionSummary(updated);
  }

  async getOrCreateUserPreferences(
    userId: string,
  ): Promise<UserPreferencesPayload> {
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
      subtitleTranslationEnabled: subscription.canTranslateSubtitles
        ? (payload.subtitleTranslationEnabled ??
          current.subtitleTranslationEnabled)
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
