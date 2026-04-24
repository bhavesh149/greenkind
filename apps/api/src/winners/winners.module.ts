import { Module } from '@nestjs/common';

import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminWinnersController } from './admin-winners.controller';
import { WinnersController } from './winners.controller';
import { WinnersService } from './winners.service';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [WinnersController, AdminWinnersController],
  providers: [WinnersService],
  exports: [WinnersService],
})
export class WinnersModule {}
