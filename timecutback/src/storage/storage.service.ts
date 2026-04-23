import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
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
}
