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
    });
    console.log('URL Cloudinary:', result.secure_url);
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
    const clipCount = Math.ceil(totalDuration / clipDuration);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const urls: string[] = [];

    for (let i = 0; i < clipCount; i++) {
      const startOffset = i * clipDuration;
      const endOffset = Math.min((i + 1) * clipDuration, totalDuration);
      const url = `https://res.cloudinary.com/${cloudName}/video/upload/so_${startOffset},eo_${endOffset}/${publicId}.mp4`;
      urls.push(url);
    }

    this.logger.log(
      `Generated ${urls.length} clip URLs for publicId=${publicId}`,
    );
    return urls;
  }

  async downloadClipFromUrl(
    url: string,
    localPath: string,
  ): Promise<string> {
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

  async deleteCloudinaryAsset(publicId: string): Promise<void> {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video',
    });
    this.logger.log(
      `Deleted Cloudinary asset: publicId=${publicId}, result=${result.result}`,
    );
  }
}
