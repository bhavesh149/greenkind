import { Module } from '@nestjs/common';

import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminDrawsController } from './admin-draws.controller';
import { DrawsController } from './draws.controller';
import { DrawsService } from './draws.service';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [DrawsController, AdminDrawsController],
  providers: [DrawsService],
  exports: [DrawsService],
})
export class DrawsModule {}
