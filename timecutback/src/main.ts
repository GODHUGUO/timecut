import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();
// console.log(process.env.CLOUDINARY_CLOUD_NAME);
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [
        'http://localhost:3001',
        'http://localhost:3000',
        'https://timecut.fr',
        'https://www.timecut.fr',
      ];
      // Autoriser toutes les URLs Vercel (preview + production)
      if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('❌ Error during bootstrap:', err);
  process.exit(1);
});
