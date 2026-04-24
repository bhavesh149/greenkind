import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminCharitiesController } from './admin-charities.controller';
import { CharitiesController } from './charities.controller';
import { CharitiesService } from './charities.service';
import { CharitySelectionService } from './charity-selection.service';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    CharitiesController,
    AdminCharitiesController,
    DonationsController,
  ],
  providers: [CharitiesService, CharitySelectionService, DonationsService],
  exports: [DonationsService],
})
export class CharitiesModule {}
