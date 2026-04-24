import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../common/decorators/roles.decorator';
import { AdminAnalyticsService } from './admin-analytics.service';
import { ListAuditQueryDto } from './dto/list-audit-query.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@ApiTags('admin')
@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly analytics: AdminAnalyticsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'High-level counts for the admin home / reports' })
  async stats() {
    return this.analytics.getSummary();
  }

  @Get('users')
  @ApiOperation({ summary: 'Search users' })
  async users(@Query() q: ListUsersQueryDto) {
    return this.analytics.listUsers(q.page, q.limit, q.q);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Recent audit log entries' })
  async audit(@Query() q: ListAuditQueryDto) {
    return this.analytics.listAuditLogs(q.page, q.limit);
  }
}
