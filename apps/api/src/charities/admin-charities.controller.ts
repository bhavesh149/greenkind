import {
  Body,
  Controller,
  Delete,
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
import type { JwtUserPayload } from '../auth/jwt-payload';
import { CharitiesService } from './charities.service';
import { CreateCharityDto, UpdateCharityDto } from './dto/admin-charity.dto';
import { ListCharitiesQueryDto } from './dto/list-charities-query.dto';

@ApiTags('admin-charities')
@Controller('admin/charities')
@Roles(UserRole.ADMIN)
export class AdminCharitiesController {
  constructor(private readonly charities: CharitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List charities (includes inactive)' })
  async list(@Query() query: ListCharitiesQueryDto) {
    const result = await this.charities.list({
      q: query.q,
      category: query.category,
      featured: query.featured,
      page: query.page,
      limit: query.limit,
      activeOnly: false,
    });
    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      items: result.items,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create charity' })
  async create(
    @CurrentUser() u: JwtUserPayload,
    @Body() body: CreateCharityDto,
  ) {
    return this.charities.createForAdmin({
      name: body.name,
      description: body.description,
      category: body.category,
      featured: body.featured ?? false,
      active: body.active ?? true,
      createdById: u.sub,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update charity' })
  async update(@Param('id') id: string, @Body() body: UpdateCharityDto) {
    return this.charities.updateForAdmin(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate charity' })
  async remove(@Param('id') id: string) {
    return this.charities.softDeleteForAdmin(id);
  }
}
