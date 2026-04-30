import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

ffmpeg.setFfmpegPath(ffmpegPath as string);
ffmpeg.setFfprobePath(ffprobeStatic.path);

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
        .on('end', () => {
          console.log('Audio genere:', audioPath);
          resolve(audioPath);
        })
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
      const srtContent = this.buildSrt(transcription.segments, transcription.text);
      const srtPath = path.join(this.outputDir, `subtitles_${Date.now()}.srt`);

      const finalSegments =
        translatedSegments.length > 0
          ? translatedSegments
          : transcription.segments;
      const finalText = finalSegments.map((segment) => segment.text).join(' ').trim();
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
    options?: { translate?: boolean; targetLanguage?: string; translationModel?: string },
  ): Promise<{ text: string; srtContent: string; srtPath: string; segments: TranscriptSegment[] }> {
    const audioPath = await this.extractAudio(clipPath);

    try {
      // Transcribe directly — no chunking needed for short clips
      const transcription = await this.getClient().audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: process.env.TCHAVI_TRANSCRIPTION_MODEL ?? 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      const rawText = (transcription as { text?: string }).text?.trim() ?? '';
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

      const text = segments.length > 0
        ? segments.map((s) => s.text).join(' ').trim()
        : rawText;
      const srtContent = this.buildSrt(segments, text);
      const srtPath = path.join(this.outputDir, `clip_${clipIndex}_subtitles_${Date.now()}.srt`);
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
        const transcription = await this.getClient().audio.transcriptions.create({
          file: fs.createReadStream(chunkPath),
          model: process.env.TCHAVI_TRANSCRIPTION_MODEL ?? 'whisper-1',
          response_format: 'verbose_json',
          timestamp_granularities: ['segment'],
        });

        const chunkText = (transcription as { text?: string }).text?.trim() ?? '';
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
      const response = await this.getClient().chat.completions.create({
        model: process.env.TCHAVI_TRANSLATION_MODEL ?? 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You translate subtitle segments. Return only a JSON array of translated strings in the same order and same length.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              targetLanguage,
              segments: segments.map((segment) => segment.text),
            }),
          },
        ],
        temperature: 0.2,
      });

      const rawContent = response.choices[0]?.message?.content?.trim() ?? '';
      if (!rawContent) {
        return [];
      }

      const parsed = JSON.parse(rawContent) as string[];
      if (!Array.isArray(parsed) || parsed.length !== segments.length) {
        return [];
      }

      return segments.map((segment, index) => ({
        ...segment,
        text: String(parsed[index] ?? segment.text).trim() || segment.text,
      }));
    } catch {
      return [];
    }
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

  private buildSrt(segments: TranscriptSegment[], fallbackText: string): string {
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
