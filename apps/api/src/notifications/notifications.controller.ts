import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../auth/jwt-payload';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List current user’s notifications' })
  async list(
    @CurrentUser() u: JwtUserPayload,
    @Query() q: ListNotificationsQueryDto,
  ) {
    return this.notifications.listForUser(u.sub, q.page, q.limit);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async readAll(@CurrentUser() u: JwtUserPayload) {
    return this.notifications.markAllRead(u.sub);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async read(@CurrentUser() u: JwtUserPayload, @Param('id') id: string) {
    return this.notifications.markRead(u.sub, id);
  }
}
