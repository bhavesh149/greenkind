import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminAnalyticsService } from './admin-analytics.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminAnalyticsService],
})
export class AdminModule {}
