// src/video/video.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { ProcessingService } from '../processing/processing.service';
import {
  ProcessingQueueService,
  QueueStatus,
  QueueType,
  Priority,
} from '../processing/processing-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import * as fs from 'fs';
import * as path from 'path';

type UserPreferencesPayload = {
  subtitleTranslationEnabled: boolean;
  targetSubtitleLanguage: string;
  captionStyle: string;
};

const ALLOWED_CAPTION_STYLES = [
  'bold',
  'minimal',
  'highlight',
  'outline',
  'shadow',
] as const;
type CaptionStyle = (typeof ALLOWED_CAPTION_STYLES)[number];

const PLAN_CONFIG = {
  free: {
    name: 'Gratuit',
    price: '0€',
    monthlyMinutes: 20,
    canUseAiSubtitles: false,
    canTranslateSubtitles: false,
  },
  starter: {
    name: 'Starter',
    price: '4,99€',
    monthlyMinutes: 60,
    canUseAiSubtitles: true,
    canTranslateSubtitles: true,
  },
  pro: {
    name: 'Pro',
    price: '12,99€',
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
  carryOverMinutes: number;
  canUseAiSubtitles: boolean;
  canTranslateSubtitles: boolean;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  daysUntilExpiration: number;
  isExpiringSoon: boolean;
};

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly processingService: ProcessingService,
    private readonly processingQueue: ProcessingQueueService,
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  getQueueStatus(type: QueueType, priority: Priority = 'normal'): QueueStatus {
    return this.processingQueue.getStatus(type, priority);
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

    // Abonnement expiré : repasser en plan free et reset des minutes.
    // L'utilisateur devra re-payer pour réactiver son plan payant.
    // Les minutes reportées sont perdues si l'abonnement n'est pas renouvelé à temps.
    this.logger.log(
      `Subscription expired for userId=${subscription.userId} (was ${subscription.currentPlan}). Downgrading to free.`,
    );
    return this.prisma.userSubscription.update({
      where: { id: subscription.id },
      data: {
        currentPlan: 'free',
        monthlyMinutesUsed: 0,
        carryOverMinutes: 0,
        billingPeriodStart: new Date(),
      },
    });
  }

  private buildSubscriptionSummary(subscription: {
    currentPlan: string;
    monthlyMinutesUsed: number;
    carryOverMinutes?: number;
    billingPeriodStart: Date;
  }): SubscriptionSummary {
    const currentPlan = this.getPlanKey(subscription.currentPlan);
    const plan = PLAN_CONFIG[currentPlan];
    const carryOverMinutes = Math.max(subscription.carryOverMinutes ?? 0, 0);
    const minutesUsed = Math.max(subscription.monthlyMinutesUsed, 0);
    // Le total disponible inclut les minutes du plan + celles reportées du cycle précédent
    const totalAvailable = plan.monthlyMinutes + carryOverMinutes;
    const minutesRemaining = Math.max(totalAvailable - minutesUsed, 0);

    // Le quota est désormais débité à la seconde près (minutes fractionnaires).
    // On arrondit à 1 décimale pour un affichage propre côté client.
    const round1 = (n: number) => Math.round(n * 10) / 10;
    const billingPeriodEnd = this.getNextBillingPeriodStart(
      subscription.billingPeriodStart,
    );

    // Jours restants avant expiration (0 si déjà expiré)
    const msUntilExpiration = billingPeriodEnd.getTime() - Date.now();
    const daysUntilExpiration = Math.max(
      Math.ceil(msUntilExpiration / (1000 * 60 * 60 * 24)),
      0,
    );
    // Le plan paid expire dans moins de 3 jours
    const isExpiringSoon = currentPlan !== 'free' && daysUntilExpiration <= 3;

    return {
      currentPlan,
      minutesIncluded: plan.monthlyMinutes,
      minutesUsed: round1(minutesUsed),
      minutesRemaining: round1(minutesRemaining),
      carryOverMinutes: round1(carryOverMinutes),
      canUseAiSubtitles: plan.canUseAiSubtitles,
      canTranslateSubtitles: plan.canTranslateSubtitles,
      billingPeriodStart: subscription.billingPeriodStart,
      billingPeriodEnd,
      daysUntilExpiration,
      isExpiringSoon,
    };
  }

  signUpload(userId: string): {
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
  } {
    return this.storageService.generateUploadSignature(userId);
  }

  async processVideo(
    publicId: string,
    cloudDuration: number,
    filename: string,
    clipDuration: number,
    userId: string,
    subtitleMode?: string,
  ): Promise<{
    clips: string[];
    subtitleMode: string;
    subtitlesBurned: boolean;
    subtitleTranslationEnabled: boolean;
    targetSubtitleLanguage: string;
    subtitles: { text: string; srtPath: string };
  }> {
    this.logger.log(`=== PROCESS VIDEO ===`);
    this.logger.log(`publicId: ${publicId}`);
    this.logger.log(`cloudDuration: ${cloudDuration}`);
    this.logger.log(`subtitleMode: "${subtitleMode}"`);
    this.logger.log(`clipDuration: ${clipDuration}`);
    this.logger.log(`userId: ${userId}`);
    this.logger.log(`====================`);

    if (
      !Number.isFinite(clipDuration) ||
      clipDuration <= 0 ||
      clipDuration > 3600
    ) {
      throw new BadRequestException(
        'La duree de clip doit etre un nombre positif (max 3600s).',
      );
    }

    if (
      !Number.isFinite(cloudDuration) ||
      cloudDuration <= 0 ||
      cloudDuration > 7200
    ) {
      throw new BadRequestException('Duree de video invalide.');
    }

    const expectedPrefix = `timecut/${userId}/`;
    if (!publicId.startsWith(expectedPrefix)) {
      throw new BadRequestException('publicId invalide ou non autorise.');
    }

    if (!filename || typeof filename !== 'string' || filename.length > 255) {
      throw new BadRequestException('Nom de fichier invalide.');
    }

    const totalDuration = cloudDuration;
    if (totalDuration > 0 && clipDuration > totalDuration) {
      throw new BadRequestException(
        `La duree du clip (${clipDuration}s) ne peut pas depasser la duree totale de la video (${Math.floor(totalDuration)}s).`,
      );
    }

    const subscription = await this.getUserSubscriptionSummary(userId);
    const normalizedSubtitleMode = subtitleMode === 'ai' ? 'ai' : 'none';
    const shouldGenerateSubtitles = normalizedSubtitleMode === 'ai';

    if (shouldGenerateSubtitles && !subscription.canUseAiSubtitles) {
      throw new BadRequestException(
        'Les sous-titres IA sont reserves aux abonnements Starter et Pro.',
      );
    }

    // Consommation à la seconde près : on débite la durée réelle convertie en
    // minutes fractionnaires (ex : 20s -> 0,333 min) au lieu d'arrondir à la
    // minute entière supérieure.
    const minutesToConsume = totalDuration / 60;
    if (minutesToConsume > subscription.minutesRemaining) {
      throw new BadRequestException(
        `Quota insuffisant : il vous reste ${subscription.minutesRemaining} min sur ${subscription.minutesIncluded} min ce mois-ci.`,
      );
    }

    const video = await this.prisma.video.create({
      data: { filename, userId },
    });

    const preferences = await this.getOrCreateUserPreferences(userId);
    this.logger.log(
      `Subtitle preferences: translate=${preferences.subtitleTranslationEnabled}, targetLanguage=${preferences.targetSubtitleLanguage}, captionStyle=${preferences.captionStyle}`,
    );

    const effectiveDuration = totalDuration;
    const queueType: QueueType = shouldGenerateSubtitles ? 'heavy' : 'light';
    // Les utilisateurs payants (starter/pro) passent devant les utilisateurs gratuits
    const priority: Priority =
      subscription.currentPlan === 'free' ? 'normal' : 'high';
    this.logger.log(
      `[QUEUE] Enqueuing ${queueType}/${priority} job for user ${userId} (plan: ${subscription.currentPlan})`,
    );

    const queueResult = await this.processingQueue.enqueue(
      queueType,
      async () => {
        let finalUrls: string[];
        let subtitles = { text: '', srtPath: '' };

        if (!shouldGenerateSubtitles) {
          // ─── FLUX SANS SOUS-TITRES : découpage local ffmpeg + upload Cloudinary ───
          this.logger.log(
            '>>> FLUX SANS SOUS-TITRES: Découpage local avec ffmpeg',
          );
          const tempDir = path.join('./uploads', `video_tmp_${Date.now()}`);
          fs.mkdirSync(tempDir, { recursive: true });
          const localVideoPath = path.join(tempDir, 'source.mp4');

          try {
            const sourceUrl = this.storageService.getFullVideoUrl(publicId);
            this.logger.log(`Downloading source video: ${sourceUrl}`);
            await this.storageService.downloadClipFromUrl(
              sourceUrl,
              localVideoPath,
            );

            this.logger.log(
              `Cutting video into clips with ffmpeg segment muxer`,
            );
            const localClipPaths = await this.processingService.cutClipsLocally(
              localVideoPath,
              effectiveDuration,
              clipDuration,
              tempDir,
            );
            this.logger.log(`Cut ${localClipPaths.length} clips locally`);

            finalUrls = await Promise.all(
              localClipPaths.map(async (clipPath, idx) => {
                const url = await this.storageService.upload({
                  fieldname: 'file',
                  originalname: `clip_${idx}.mp4`,
                  encoding: '7bit',
                  mimetype: 'video/mp4',
                  size: 0,
                  path: clipPath,
                  filename: `clip_${idx}.mp4`,
                });
                this.logger.log(`Clip ${idx} uploaded: ${url}`);
                return url;
              }),
            );
          } finally {
            this.safeDeleteDir(tempDir);
          }

          this.logger.log(`Nombre de clips: ${finalUrls.length}`);
          this.logger.log(`Premier URL: ${finalUrls[0]}`);
        } else {
          // ─── FLUX AVEC SOUS-TITRES ───
          this.logger.log(
            '>>> FLUX AVEC SOUS-TITRES: Traitement de chaque clip',
          );

          const sourceUrl = this.storageService.getFullVideoUrl(publicId);
          const tempBaseDir = path.join(
            './uploads',
            `video_sub_tmp_${Date.now()}`,
          );
          fs.mkdirSync(tempBaseDir, { recursive: true });
          const localVideoPath = path.join(tempBaseDir, 'source.mp4');

          this.logger.log(
            `Downloading source video for subtitles: ${sourceUrl}`,
          );
          await this.storageService.downloadClipFromUrl(
            sourceUrl,
            localVideoPath,
          );

          this.logger.log(`Cutting video into clips with ffmpeg segment muxer`);
          const localClipPaths = await this.processingService.cutClipsLocally(
            localVideoPath,
            effectiveDuration,
            clipDuration,
            tempBaseDir,
          );
          this.logger.log(`Cut ${localClipPaths.length} clips locally`);

          const CONCURRENT_CLIPS = 7;

          // Sémaphore : max CONCURRENT_CLIPS clips en traitement simultané
          let active = 0;
          const queue: (() => void)[] = [];
          const acquire = () =>
            new Promise<void>((resolve) => {
              if (active < CONCURRENT_CLIPS) {
                active++;
                resolve();
              } else
                queue.push(() => {
                  active++;
                  resolve();
                });
            });
          const release = () => {
            active--;
            if (queue.length > 0) queue.shift()!();
          };

          const processedClips: {
            url: string;
            text: string;
            srtContent: string;
            clipDuration: number;
          }[] = await Promise.all(
            localClipPaths.map(async (clipPath, idx) => {
              await acquire();
              try {
                return await this.processLocalClipWithSubtitles(
                  clipPath,
                  idx,
                  preferences,
                );
              } finally {
                release();
              }
            }),
          );

          this.safeDeleteDir(tempBaseDir);

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
          `Subtitles burned into returned clips: ${shouldGenerateSubtitles}`,
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

        // ÉTAPE 5 : Supprimer la vidéo source de Cloudinary (fire & forget)
        this.storageService.deleteCloudinaryAsset(publicId).catch((err) => {
          this.logger.warn(`Failed to delete source video ${publicId}: ${err}`);
        });

        return { finalUrls, subtitles };
      },
      priority,
    );

    return {
      clips: queueResult.finalUrls,
      subtitleMode: normalizedSubtitleMode,
      subtitlesBurned: shouldGenerateSubtitles,
      subtitleTranslationEnabled: preferences.subtitleTranslationEnabled,
      targetSubtitleLanguage: preferences.targetSubtitleLanguage,
      subtitles: queueResult.subtitles,
    };
  }

  /**
   * Traite un clip local (déjà découpé par ffmpeg) avec sous-titres :
   * transcrit → incrust → upload → nettoyage
   */
  private async processLocalClipWithSubtitles(
    localClipPath: string,
    clipIndex: number,
    preferences: UserPreferencesPayload,
  ): Promise<{
    url: string;
    text: string;
    srtContent: string;
    clipDuration: number;
  }> {
    let subClipPath: string | null = null;
    let srtFilePath: string | null = null;
    let srtContent = '';

    try {
      const actualClipDuration =
        await this.processingService.getMediaDuration(localClipPath);

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

      if (srtFilePath && fs.existsSync(srtFilePath)) {
        srtContent = fs.readFileSync(srtFilePath, 'utf-8');
      } else {
        this.logger.warn(`SRT file does not exist at: ${srtFilePath}`);
      }

      subClipPath = await this.processingService.burnSrtIntoClip(
        localClipPath,
        subtitleResult.srtPath,
        preferences.captionStyle,
      );
      this.logger.log(`Clip ${clipIndex} subtitles burned`);

      const finalUrl = await this.storageService.upload({
        fieldname: 'file',
        originalname: `clip_${clipIndex}.mp4`,
        encoding: '7bit',
        mimetype: 'video/mp4',
        size: 0,
        path: subClipPath,
        filename: `clip_${clipIndex}.mp4`,
      });
      this.logger.log(`Clip ${clipIndex} done`);

      return {
        url: finalUrl,
        text: subtitleResult.text,
        srtContent,
        clipDuration: actualClipDuration,
      };
    } finally {
      if (subClipPath) this.safeDeleteFile(subClipPath);
      if (srtFilePath) this.safeDeleteFile(srtFilePath);
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

    if (
      payload.captionStyle !== undefined &&
      !ALLOWED_CAPTION_STYLES.includes(payload.captionStyle as CaptionStyle)
    ) {
      throw new BadRequestException(
        `Style de sous-titre invalide. Valeurs acceptées : ${ALLOWED_CAPTION_STYLES.join(', ')}.`,
      );
    }

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
