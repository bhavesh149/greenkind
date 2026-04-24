import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../common/decorators/public.decorator';
import { parseMonthOrThrow, DrawsService } from './draws.service';
import { ListDrawsQueryDto } from './dto/list-draws-query.dto';

@ApiTags('draws')
@Controller('draws')
export class DrawsController {
  constructor(private readonly draws: DrawsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published monthly draws' })
  async listPublished(@Query() q: ListDrawsQueryDto) {
    return this.draws.listPublished(q.page, q.limit);
  }

  @Public()
  @Get('latest')
  @ApiOperation({ summary: 'Most recent published draw' })
  async latest() {
    const d = await this.draws.getLatestPublished();
    return { draw: d };
  }

  @Public()
  @Get('month/:monthKey')
  @ApiOperation({
    summary: 'Published draw for month (YYYY-MM-DD, month start ISO)',
  })
  async byMonth(@Param('monthKey') key: string) {
    const month = parseMonthOrThrow(key);
    const draw = await this.draws.getPublishedByMonth(month);
    return { draw };
  }
}
