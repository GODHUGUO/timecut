import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

ffmpeg.setFfmpegPath(ffmpegPath as string);
ffmpeg.setFfprobePath((ffprobeStatic as { path: string }).path);

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

export type SubtitleResult = {
  text: string;
  srtPath: string;
  segments: TranscriptSegment[];
};

type ChunkedTranscript = {
  text: string;
  segments: TranscriptSegment[];
};

type SubtitleGenerationOptions = {
  translationEnabled?: boolean;
  targetLanguage?: string;
};

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly outputDir = './uploads';
  private readonly transcriptionChunkSeconds = Number(
    process.env.TCHAVI_AUDIO_CHUNK_SECONDS ?? 480,
  );
  private client: OpenAI | null = null;

  async extractAudio(videoPath: string): Promise<string> {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const audioPath = path.join(this.outputDir, `audio_${Date.now()}.mp3`);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioChannels(1)
        .audioFrequency(16000)
        .audioBitrate('32k')
        .format('mp3')
        .save(audioPath)
        .on('end', () => resolve(audioPath))
        .on('error', (err: Error) => {
          console.error('Erreur extraction audio:', err);
          reject(err);
        });
    });
  }

  async generateSubtitlesFromVideo(
    videoPath: string,
    options?: SubtitleGenerationOptions,
  ): Promise<SubtitleResult> {
    const audioPath = await this.extractAudio(videoPath);
    let audioChunkPaths: string[] = [];

    try {
      audioChunkPaths = await this.splitAudioIntoChunks(audioPath);
      const transcription = await this.transcribeChunks(audioChunkPaths);
      const translatedSegments = await this.translateSegmentsIfNeeded(
        transcription.segments,
        options,
      );
      const srtContent = this.buildSrt(
        transcription.segments,
        transcription.text,
      );
      const srtPath = path.join(this.outputDir, `subtitles_${Date.now()}.srt`);

      const finalSegments =
        translatedSegments.length > 0
          ? translatedSegments
          : transcription.segments;
      const finalText = finalSegments
        .map((segment) => segment.text)
        .join(' ')
        .trim();
      const finalSrtContent = this.buildSrt(finalSegments, finalText);

      fs.writeFileSync(srtPath, finalSrtContent || srtContent, 'utf8');

      return {
        text: finalText || transcription.text,
        srtPath,
        segments: finalSegments,
      };
    } catch (error) {
      const apiError = error as {
        message?: string;
        status?: number;
        error?: unknown;
        response?: { data?: unknown };
      };
      const providerDetails = JSON.stringify(
        apiError.response?.data ?? apiError.error ?? null,
      );

      throw new InternalServerErrorException(
        `Erreur lors de la transcription Tchavi: ${apiError.status ?? 'unknown'} ${apiError.message ?? 'unknown error'}${providerDetails !== 'null' ? ` | details: ${providerDetails}` : ''}`,
      );
    } finally {
      this.safeDelete(audioPath);
      audioChunkPaths.forEach((chunkPath) => this.safeDelete(chunkPath));
    }
  }

  async generateSubtitlesFromClip(
    clipPath: string,
    clipIndex: number,
    options?: {
      translate?: boolean;
      targetLanguage?: string;
      translationModel?: string;
    },
  ): Promise<{
    text: string;
    srtContent: string;
    srtPath: string;
    segments: TranscriptSegment[];
  }> {
    const audioPath = await this.extractAudio(clipPath);
    const clipDuration = await this.getMediaDuration(clipPath);

    try {
      // Transcribe directly — no chunking needed for short clips
      const transcription = await this.getClient().audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: process.env.TCHAVI_TRANSCRIPTION_MODEL ?? 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      const rawText = (transcription as { text?: string }).text?.trim() ?? '';
      const transcriptionSegments = (
        transcription as { segments?: TranscriptSegment[] }
      ).segments;
      let segments = this.normalizeSegments(transcription);

      // Optionally translate
      if (options?.translate && options?.targetLanguage) {
        const translated = await this.translateSegmentsIfNeeded(segments, {
          translationEnabled: true,
          targetLanguage: options.targetLanguage,
        });
        if (translated.length > 0) {
          segments = translated;
        }
      }
      segments = this.prepareSubtitleSegments(segments, clipDuration);

      const text =
        segments.length > 0
          ? segments
              .map((s) => s.text)
              .join(' ')
              .trim()
          : rawText;
      const srtContent = this.buildSrt(segments, text);
      const srtPath = path.join(
        this.outputDir,
        `clip_${clipIndex}_subtitles_${Date.now()}.srt`,
      );
      fs.writeFileSync(srtPath, srtContent, 'utf8');

      return { text, srtContent, srtPath, segments };
    } catch (error) {
      const apiError = error as {
        message?: string;
        status?: number;
        error?: unknown;
        response?: { data?: unknown };
      };
      const providerDetails = JSON.stringify(
        apiError.response?.data ?? apiError.error ?? null,
      );

      throw new InternalServerErrorException(
        `Erreur transcription clip ${clipIndex}: ${apiError.status ?? 'unknown'} ${apiError.message ?? 'unknown error'}${providerDetails !== 'null' ? ` | details: ${providerDetails}` : ''}`,
      );
    } finally {
      this.safeDelete(audioPath);
    }
  }

  private async splitAudioIntoChunks(audioPath: string): Promise<string[]> {
    const duration = await this.getMediaDuration(audioPath);

    if (duration <= this.transcriptionChunkSeconds) {
      return [audioPath];
    }

    const chunkPrefix = `audio_chunk_${Date.now()}`;
    const chunkPattern = path.join(this.outputDir, `${chunkPrefix}_%03d.mp3`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(audioPath)
        .outputOptions([
          '-f segment',
          '-segment_time',
          String(this.transcriptionChunkSeconds),
          '-reset_timestamps 1',
          '-c copy',
        ])
        .output(chunkPattern)
        .on('end', () => resolve())
        .on('error', (error: Error) => reject(error))
        .run();
    });

    return fs
      .readdirSync(this.outputDir)
      .filter(
        (fileName) =>
          fileName.startsWith(chunkPrefix) && fileName.endsWith('.mp3'),
      )
      .map((fileName) => path.join(this.outputDir, fileName))
      .sort();
  }

  private async transcribeChunks(
    audioChunkPaths: string[],
  ): Promise<ChunkedTranscript> {
    // Paralléliser toutes les transcriptions
    const results = await Promise.all(
      audioChunkPaths.map(async (chunkPath) => {
        const transcription =
          await this.getClient().audio.transcriptions.create({
            file: fs.createReadStream(chunkPath),
            model: process.env.TCHAVI_TRANSCRIPTION_MODEL ?? 'whisper-1',
            response_format: 'verbose_json',
            timestamp_granularities: ['segment'],
          });

        const chunkText =
          (transcription as { text?: string }).text?.trim() ?? '';
        const chunkSegments = this.normalizeSegments(transcription);

        return { chunkText, chunkSegments };
      }),
    );

    // Recalculer les offsets à partir de la durée des segments
    const mergedSegments: TranscriptSegment[] = [];
    const textParts: string[] = [];
    let chunkOffsetSeconds = 0;

    for (const { chunkText, chunkSegments } of results) {
      const offsetSegments = chunkSegments.map((segment) => ({
        start: segment.start + chunkOffsetSeconds,
        end: segment.end + chunkOffsetSeconds,
        text: segment.text,
      }));

      if (chunkText) textParts.push(chunkText);
      mergedSegments.push(...offsetSegments);

      // Calculer l'offset via le dernier segment au lieu de ffprobe
      if (chunkSegments.length > 0) {
        chunkOffsetSeconds += chunkSegments[chunkSegments.length - 1].end;
      }
    }

    return {
      text: textParts.join(' ').trim(),
      segments: mergedSegments,
    };
  }

  private async getMediaDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(
        filePath,
        (error: Error | null, metadata: { format?: { duration?: number } }) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(metadata.format?.duration ?? 0);
        },
      );
    });
  }

  private async translateSegmentsIfNeeded(
    segments: TranscriptSegment[],
    options?: SubtitleGenerationOptions,
  ): Promise<TranscriptSegment[]> {
    const translationEnabled = options?.translationEnabled ?? false;
    const targetLanguage = options?.targetLanguage?.trim();

    if (!translationEnabled || !targetLanguage || segments.length === 0) {
      return [];
    }

    try {
      const resolvedTargetLanguage = this.resolveTargetLanguage(targetLanguage);
      const response = await this.getClient().chat.completions.create({
        model: process.env.TCHAVI_TRANSLATION_MODEL ?? 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You translate subtitle segments. Preserve the same order. Return JSON only in this exact shape: {"translations":["..."]}. Do not use markdown.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              targetLanguage: resolvedTargetLanguage,
              segments: segments.map((segment) => segment.text),
            }),
          },
        ],
        temperature: 0.2,
      });

      const rawContent = response.choices[0]?.message?.content?.trim() ?? '';
      if (!rawContent) {
        this.logger.warn('Translation skipped: empty model response.');
        return [];
      }

      const translations = this.parseTranslationResponse(rawContent);
      if (translations.length === 0) {
        this.logger.warn(
          `Translation skipped: could not parse model response: ${rawContent.slice(0, 200)}`,
        );
        return [];
      }

      if (translations.length !== segments.length) {
        this.logger.warn(
          `Translation response length mismatch: expected=${segments.length}, received=${translations.length}. Missing items will keep original text.`,
        );
      }

      this.logger.log(
        `Translated ${Math.min(translations.length, segments.length)}/${segments.length} subtitle segment(s) to ${resolvedTargetLanguage}.`,
      );

      return segments.map((segment, index) => ({
        ...segment,
        text:
          String(translations[index] ?? segment.text).trim() || segment.text,
      }));
    } catch (error) {
      const translationError = error as { message?: string };
      this.logger.warn(
        `Translation skipped: ${translationError.message ?? 'unknown error'}`,
      );
      return [];
    }
  }

  private resolveTargetLanguage(language: string): string {
    const languages: Record<string, string> = {
      ar: 'Arabic',
      de: 'German',
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      pt: 'Portuguese',
    };

    return languages[language.toLowerCase()] ?? language;
  }

  private parseTranslationResponse(rawContent: string): string[] {
    try {
      const parsed = JSON.parse(this.extractJsonPayload(rawContent)) as unknown;

      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item ?? '').trim()).filter(Boolean);
      }

      if (parsed && typeof parsed === 'object') {
        const candidate = parsed as {
          translations?: unknown;
          translatedSegments?: unknown;
          segments?: unknown;
        };
        const translations =
          candidate.translations ??
          candidate.translatedSegments ??
          candidate.segments;

        if (Array.isArray(translations)) {
          return translations
            .map((item) => String(item ?? '').trim())
            .filter(Boolean);
        }
      }
    } catch {
      return [];
    }

    return [];
  }

  private extractJsonPayload(rawContent: string): string {
    const trimmed = rawContent.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);

    if (fenced?.[1]) {
      return fenced[1].trim();
    }

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return trimmed;
    }

    const objectStart = trimmed.indexOf('{');
    const objectEnd = trimmed.lastIndexOf('}');
    if (objectStart !== -1 && objectEnd > objectStart) {
      return trimmed.slice(objectStart, objectEnd + 1);
    }

    const arrayStart = trimmed.indexOf('[');
    const arrayEnd = trimmed.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd > arrayStart) {
      return trimmed.slice(arrayStart, arrayEnd + 1);
    }

    return trimmed;
  }

  private getClient(): OpenAI {
    if (this.client) {
      return this.client;
    }

    if (!process.env.TCHAVI_API_KEY) {
      throw new InternalServerErrorException(
        'TCHAVI_API_KEY manquant dans le fichier .env.',
      );
    }

    this.client = new OpenAI({
      apiKey: process.env.TCHAVI_API_KEY,
      baseURL: process.env.TCHAVI_BASE_URL ?? 'https://tchavi.com/api/v1',
    });

    return this.client;
  }

  private normalizeSegments(transcription: unknown): TranscriptSegment[] {
    const candidate = transcription as {
      segments?: Array<{
        start?: number;
        end?: number;
        text?: string;
      }>;
    };

    return (candidate.segments ?? [])
      .filter(
        (segment) =>
          typeof segment.start === 'number' &&
          typeof segment.end === 'number' &&
          typeof segment.text === 'string' &&
          segment.text.trim().length > 0,
      )
      .map((segment) => ({
        start: segment.start as number,
        end: segment.end as number,
        text: (segment.text as string).trim(),
      }));
  }

  private normalizeSubtitleTimings(
    segments: TranscriptSegment[],
    mediaDuration: number,
  ): TranscriptSegment[] {
    const configuredMinDuration = Number(
      process.env.TCHAVI_MIN_SUBTITLE_SECONDS ?? 1.5,
    );
    const minDurationSeconds =
      Number.isFinite(configuredMinDuration) && configuredMinDuration > 0
        ? configuredMinDuration
        : 1.5;
    const safeMediaDuration =
      Number.isFinite(mediaDuration) && mediaDuration > 0
        ? mediaDuration
        : undefined;

    return segments.map((segment) => {
      const start = Math.max(segment.start, 0);
      const originalEnd = Math.max(segment.end, start);
      let end = Math.max(originalEnd, start + minDurationSeconds);

      if (safeMediaDuration) {
        end = Math.min(end, safeMediaDuration);
      }

      if (end <= start) {
        const fallbackEnd = safeMediaDuration ?? start + minDurationSeconds;
        return {
          ...segment,
          start: Math.max(0, fallbackEnd - minDurationSeconds),
          end: fallbackEnd,
        };
      }

      return {
        ...segment,
        start,
        end,
      };
    });
  }

  private prepareSubtitleSegments(
    segments: TranscriptSegment[],
    mediaDuration: number,
  ): TranscriptSegment[] {
    const normalizedSegments = this.normalizeSubtitleTimings(
      segments,
      mediaDuration,
    );
    const splitSegments = this.splitLongSubtitleSegments(normalizedSegments);

    return splitSegments.map((segment) => ({
      ...segment,
      text: this.wrapSubtitleText(segment.text),
    }));
  }

  private splitLongSubtitleSegments(
    segments: TranscriptSegment[],
  ): TranscriptSegment[] {
    const maxWords = this.getPositiveEnvNumber('TCHAVI_MAX_SUBTITLE_WORDS', 7);
    const maxChars = this.getPositiveEnvNumber('TCHAVI_MAX_SUBTITLE_CHARS', 42);
    const result: TranscriptSegment[] = [];

    for (const segment of segments) {
      const chunks = this.splitTextIntoChunks(segment.text, maxWords, maxChars);

      if (chunks.length <= 1) {
        result.push(segment);
        continue;
      }

      const duration = Math.max(segment.end - segment.start, 0.1);
      const chunkDuration = duration / chunks.length;

      chunks.forEach((chunk, index) => {
        const start = segment.start + chunkDuration * index;
        const end =
          index === chunks.length - 1
            ? segment.end
            : segment.start + chunkDuration * (index + 1);

        result.push({
          start,
          end,
          text: chunk,
        });
      });
    }

    return result;
  }

  private splitTextIntoChunks(
    text: string,
    maxWords: number,
    maxChars: number,
  ): string[] {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const chunks: string[] = [];
    let currentWords: string[] = [];

    for (const word of words) {
      const candidate = [...currentWords, word].join(' ');

      if (
        currentWords.length > 0 &&
        (currentWords.length >= maxWords || candidate.length > maxChars)
      ) {
        chunks.push(currentWords.join(' '));
        currentWords = [word];
      } else {
        currentWords.push(word);
      }
    }

    if (currentWords.length > 0) {
      chunks.push(currentWords.join(' '));
    }

    return chunks.length > 0 ? chunks : [text.trim()];
  }

  private wrapSubtitleText(text: string): string {
    const maxLineChars = this.getPositiveEnvNumber(
      'TCHAVI_SUBTITLE_LINE_CHARS',
      24,
    );
    const words = text.trim().split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;

      if (currentLine && candidate.length > maxLineChars) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.join('\n');
  }

  private getPositiveEnvNumber(name: string, fallback: number): number {
    const value = Number(process.env[name] ?? fallback);

    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private buildSrt(
    segments: TranscriptSegment[],
    fallbackText: string,
  ): string {
    if (segments.length === 0) {
      const text = fallbackText.trim() || 'Sous-titres non disponibles.';
      return `1\n00:00:00,000 --> 00:00:10,000\n${text}\n`;
    }

    return segments
      .map(
        (segment, index) =>
          `${index + 1}\n${this.formatSrtTime(segment.start)} --> ${this.formatSrtTime(segment.end)}\n${segment.text}\n`,
      )
      .join('\n');
  }

  private formatSrtTime(totalSeconds: number): string {
    const safeSeconds = Math.max(totalSeconds, 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = Math.floor(safeSeconds % 60);
    const milliseconds = Math.floor((safeSeconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
  }

  private safeDelete(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
