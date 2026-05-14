import { Module } from '@nestjs/common';
import { ProcessingService } from './processing.service';
import { ProcessingQueueService } from './processing-queue.service';

@Module({
  providers: [ProcessingService, ProcessingQueueService],
  exports: [ProcessingService, ProcessingQueueService],
})
export class ProcessingModule {}
