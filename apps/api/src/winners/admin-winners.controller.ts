import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ListWinnersQueryDto } from './dto/list-winners-query.dto';
import { VerifyWinnerDto } from './dto/verify-winner.dto';
import { WinnersService } from './winners.service';

@ApiTags('admin-winners')
@Controller('admin/winners')
@Roles(UserRole.ADMIN)
export class AdminWinnersController {
  constructor(private readonly winners: WinnersService) {}

  @Get()
  @ApiOperation({ summary: 'List winner rows' })
  async list(@Query() q: ListWinnersQueryDto) {
    return this.winners.adminList(q.page, q.limit, q.verificationStatus);
  }

  @Patch(':id/verification')
  @ApiOperation({ summary: 'Approve or reject verification' })
  async verify(@Param('id') id: string, @Body() body: VerifyWinnerDto) {
    return this.winners.setVerification(id, body.status, body.adminNotes);
  }

  @Post(':id/payout/mark-paid')
  @ApiOperation({
    summary: 'Mark payout as completed (after off-platform payment)',
  })
  async markPaid(@Param('id') id: string) {
    return this.winners.markPaid(id);
  }
}
