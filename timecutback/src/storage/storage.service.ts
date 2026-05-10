import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
// import { FileFilterCallback } from 'multer';

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
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async upload(file: MulterFile): Promise<string> {
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: 'video',
      // Conserver les sous-titres incrustés en évitant le ré-encodage agressif
      quality: 'auto:good',
      fetch_format: 'mp4',
    });
    console.log('URL Cloudinary:', result.secure_url);
    console.log('Video duration:', result.duration, 'seconds');
    console.log('Video format:', result.format);
    return result.secure_url;
  }

  async uploadRaw(filePath: string): Promise<string> {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw',
    });
    console.log('Raw URL Cloudinary:', result.secure_url);
    return result.secure_url;
  }

  async uploadFullVideo(
    file: MulterFile,
  ): Promise<{ publicId: string; secureUrl: string; duration: number }> {
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: 'video',
    });
    this.logger.log(
      `Full video uploaded: publicId=${result.public_id}, duration=${result.duration}s`,
    );
    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      duration: result.duration,
    };
  }

  generateClipUrls(
    publicId: string,
    clipDuration: number,
    totalDuration: number,
  ): string[] {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const urls: string[] = [];
    const minTrailingClipSeconds = 1;

    if (!Number.isFinite(clipDuration) || clipDuration <= 0) {
      return urls;
    }

    let startOffset = 0;

    while (startOffset < totalDuration) {
      const remainingDuration = totalDuration - startOffset;

      if (urls.length > 0 && remainingDuration < minTrailingClipSeconds) {
        const previousStartOffset = Math.max(startOffset - clipDuration, 0);
        urls[urls.length - 1] = this.buildClipUrl(
          cloudName,
          publicId,
          previousStartOffset,
          totalDuration - previousStartOffset,
        );
        break;
      }

      const duration = Math.min(clipDuration, remainingDuration);
      const url = this.buildClipUrl(cloudName, publicId, startOffset, duration);
      urls.push(url);
      startOffset += clipDuration;
    }

    this.logger.log(
      `Generated ${urls.length} clip URLs for publicId=${publicId}`,
    );
    return urls;
  }

  private buildClipUrl(
    cloudName: string | undefined,
    publicId: string,
    startOffset: number,
    duration: number,
  ): string {
    const start = this.formatCloudinarySeconds(startOffset);
    const clipLength = this.formatCloudinarySeconds(duration);
    return `https://res.cloudinary.com/${cloudName}/video/upload/so_${start},du_${clipLength}/${publicId}.mp4`;
  }

  private formatCloudinarySeconds(value: number): string {
    return Number(value.toFixed(3)).toString();
  }

  async downloadClipFromUrl(url: string, localPath: string): Promise<string> {
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise<string>((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(localPath);

      const request = protocol.get(url, (response) => {
        // Handle redirects
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          file.close();
          this.downloadClipFromUrl(response.headers.location, localPath)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (response.statusCode && response.statusCode !== 200) {
          file.close();
          fs.unlink(localPath, () => {});
          reject(
            new Error(
              `Download failed with status code ${response.statusCode}`,
            ),
          );
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close(() => {
            this.logger.log(`Clip downloaded to ${localPath}`);
            resolve(localPath);
          });
        });
      });

      request.on('error', (err) => {
        file.close();
        fs.unlink(localPath, () => {});
        reject(new Error(`Download error: ${err.message}`));
      });

      request.setTimeout(120_000, () => {
        request.destroy();
        file.close();
        fs.unlink(localPath, () => {});
        reject(new Error('Download timed out after 120s'));
      });
    });
  }

  generateUploadSignature(userId: string): {
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
  } {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = `timecut/${userId}`;
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET!,
    );
    return {
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      folder,
    };
  }

  async deleteCloudinaryAsset(publicId: string): Promise<void> {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video',
    });
    this.logger.log(
      `Deleted Cloudinary asset: publicId=${publicId}, result=${result.result}`,
    );
  }
}
