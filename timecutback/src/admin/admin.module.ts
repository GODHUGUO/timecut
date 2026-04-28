import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAuthGuard, Reflector],
})
export class AdminModule {}
