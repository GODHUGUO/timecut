import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

type SrtSegment = {
  start: number;
  end: number;
  text: string;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpeg = require('fluent-ffmpeg') as typeof import('fluent-ffmpeg');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegStatic = require('ffmpeg-static') as string;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffprobeStatic = require('ffprobe-static') as { path: string };

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  path: string;
  filename: string;
};

@Injectable()
export class ProcessingService {
  private readonly outputDir = './uploads';

  async getMediaDuration(filePath: string): Promise<number> {
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

  async splitVideo(file: MulterFile, clipDuration: number): Promise<string[]> {
    // Utiliser un sous-dossier temporaire pour éviter le scan de tout uploads/
    const timestamp = Date.now();
    const tempDir = path.join(this.outputDir, `split_${timestamp}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const baseName = `clip_%03d.mp4`;
    const outputPattern = path.join(tempDir, baseName);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(file.path)
        .outputOptions([
          '-c copy',
          '-map 0',
          '-segment_time',
          String(clipDuration),
          '-f segment',
          '-reset_timestamps 1',
          '-avoid_negative_ts make_zero',
        ])
        .output(outputPattern)
        .on('end', () => resolve())
        .on('error', (error: Error) => reject(error))
        .run();
    });

    // Scan rapide d'un petit dossier dédié
    return fs
      .readdirSync(tempDir)
      .filter((fileName) => fileName.endsWith('.mp4'))
      .sort()
      .map((fileName) => path.join(tempDir, fileName));
  }

  /**
   * Incrust les sous-titres dans chaque clip en parallèle (max 3 simultanés).
   * Beaucoup plus rapide que de ré-encoder la vidéo entière.
   */
  async burnSubtitlesIntoClips(
    clipPaths: string[],
    srtPath: string,
    captionStyle: string = 'bold',
    clipDuration: number,
  ): Promise<string[]> {
    const segments = this.parseSrt(srtPath);
    const forceStyle = this.getCaptionForceStyle(captionStyle);
    const CONCURRENT = 3;
    const results: string[] = [];

    for (let i = 0; i < clipPaths.length; i += CONCURRENT) {
      const batch = clipPaths.slice(i, i + CONCURRENT);
      const batchResults = await Promise.all(
        batch.map((clipPath, batchIdx) => {
          const clipIndex = i + batchIdx;
          const clipStart = clipIndex * clipDuration;
          const clipEnd = clipStart + clipDuration;
          return this.burnSubtitlesIntoClip(clipPath, segments, clipStart, clipEnd, forceStyle);
        }),
      );
      results.push(...batchResults);
    }

    return results;
  }

  private async burnSubtitlesIntoClip(
    clipPath: string,
    segments: SrtSegment[],
    clipStart: number,
    clipEnd: number,
    forceStyle: string,
  ): Promise<string> {
    // Filtrer et décaler les sous-titres pour ce clip
    const clipSegments = segments
      .filter((s) => s.end > clipStart && s.start < clipEnd)
      .map((s) => ({
        start: Math.max(s.start - clipStart, 0),
        end: Math.min(s.end - clipStart, clipEnd - clipStart),
        text: s.text,
      }));

    // Pas de sous-titres pour ce clip ? Retourner tel quel
    if (clipSegments.length === 0) return clipPath;

    // Créer un SRT temporaire pour ce clip
    const clipSrtPath = clipPath.replace(/\.mp4$/, '.srt');
    const srtContent = clipSegments
      .map((s, idx) =>
        `${idx + 1}\n${this.formatSrtTime(s.start)} --> ${this.formatSrtTime(s.end)}\n${s.text}\n`,
      )
      .join('\n');
    fs.writeFileSync(clipSrtPath, srtContent, 'utf8');

    const outputPath = clipPath.replace(/\.mp4$/, '_sub.mp4');
    const subtitleFilter = `subtitles='${this.escapeSubtitlePath(clipSrtPath)}':force_style='${forceStyle}'`;

    await new Promise<void>((resolve, reject) => {
      ffmpeg(clipPath)
        .videoFilters(subtitleFilter)
        .outputOptions([
          '-c:v libx264',
          '-preset ultrafast',
          '-crf 23',
          '-threads 0',
          '-pix_fmt yuv420p',
          '-movflags +faststart',
          '-c:a copy',
        ])
        .output(outputPath)
        .on('end', () => {
          // Nettoyage du SRT temporaire
          this.safeDelete(clipSrtPath);
          resolve();
        })
        .on('error', (error: Error) => reject(error))
        .run();
    });

    return outputPath;
  }

  private parseSrt(srtPath: string): SrtSegment[] {
    const content = fs.readFileSync(srtPath, 'utf8');
    const blocks = content.trim().split(/\n\n+/);
    const segments: SrtSegment[] = [];

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;

      const timeLine = lines[1];
      const match = timeLine.match(
        /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/,
      );
      if (!match) continue;

      const start =
        +match[1] * 3600 + +match[2] * 60 + +match[3] + +match[4] / 1000;
      const end =
        +match[5] * 3600 + +match[6] * 60 + +match[7] + +match[8] / 1000;
      const text = lines.slice(2).join('\n');

      segments.push({ start, end, text });
    }

    return segments;
  }

  private formatSrtTime(totalSeconds: number): string {
    const s = Math.max(totalSeconds, 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  private safeDelete(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch { /* ignore */ }
  }

  private getCaptionForceStyle(style: string): string {
    switch (style) {
      case 'clean':
        return 'FontSize=20,Bold=0,Outline=1,OutlineColour=&H000000,PrimaryColour=&H00FFFFFF,Alignment=2';
      case 'minimal':
        return 'FontSize=16,Bold=0,Outline=1,OutlineColour=&H000000,PrimaryColour=&H00FFFFFF,Alignment=2';
      case 'bold':
      default:
        return 'FontSize=22,Bold=1,Outline=1,OutlineColour=&H000000,PrimaryColour=&H00FFFFFF,Alignment=2';
    }
  }

  private escapeSubtitlePath(filePath: string): string {
    return path
      .resolve(filePath)
      .replace(/\\/g, '/')
      .replace(':', '\\:')
      .replace(/'/g, "\\'");
  }
}
