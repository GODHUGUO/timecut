import { Module } from '@nestjs/common';
import { ProcessingService } from './processing.service';

@Module({
  providers: [ProcessingService],
})
export class ProcessingModule {}
