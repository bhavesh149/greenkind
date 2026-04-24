import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { JwtUserPayload } from '../auth/jwt-payload';
import { DrawsService } from './draws.service';
import { CreateDrawDto } from './dto/create-draw.dto';
import { ListDrawsQueryDto } from './dto/list-draws-query.dto';

@ApiTags('admin-draws')
@Controller('admin/draws')
@Roles(UserRole.ADMIN)
export class AdminDrawsController {
  constructor(private readonly draws: DrawsService) {}

  @Get()
  @ApiOperation({ summary: 'List all draws' })
  async list(@Query() q: ListDrawsQueryDto) {
    return this.draws.adminList(q.page, q.limit);
  }

  @Post()
  @ApiOperation({ summary: 'Create draft draw for a month' })
  async create(@CurrentUser() u: JwtUserPayload, @Body() body: CreateDrawDto) {
    return this.draws.createDraftForMonth(body.month, body.mode, u.sub);
  }

  @Post(':id/simulate')
  @ApiOperation({
    summary: 'Run draw simulation (does not create winners or publish)',
  })
  async simulate(@Param('id') id: string, @CurrentUser() u: JwtUserPayload) {
    return this.draws.simulate(id, u.sub);
  }

  @Post(':id/publish')
  @ApiOperation({
    summary: 'Publish: create winner rows, notifications, and rollover',
  })
  async publish(@Param('id') id: string, @CurrentUser() u: JwtUserPayload) {
    return this.draws.publish(id, u.sub);
  }
}
