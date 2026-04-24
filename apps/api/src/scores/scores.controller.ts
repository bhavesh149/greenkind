import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireActiveSubscription } from '../common/decorators/require-subscription.decorator';
import type { JwtUserPayload } from '../auth/jwt-payload';
import { UpsertScoreDto } from './dto/upsert-score.dto';
import { ScoresService } from './scores.service';

@ApiTags('scores')
@Controller('scores')
@RequireActiveSubscription()
export class ScoresController {
  constructor(private readonly scores: ScoresService) {}

  @Get()
  @ApiOperation({
    summary: 'List up to five most recent scores (rolling window)',
  })
  async list(@CurrentUser() u: JwtUserPayload) {
    const rows = await this.scores.listForUser(u.sub);
    return {
      scores: rows.map((r) => ({
        id: r.id,
        scoreDate: r.scoreDate.toISOString().slice(0, 10),
        scoreValue: r.scoreValue,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  }

  @Post()
  @ApiOperation({
    summary:
      'Create or update score for a date; enforces at most five rows per user',
  })
  async upsert(@CurrentUser() u: JwtUserPayload, @Body() dto: UpsertScoreDto) {
    const row = await this.scores.upsert(u.sub, dto.scoreDate, dto.scoreValue);
    return {
      score: {
        id: row.id,
        scoreDate: row.scoreDate.toISOString().slice(0, 10),
        scoreValue: row.scoreValue,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a score row' })
  async remove(@CurrentUser() u: JwtUserPayload, @Param('id') id: string) {
    await this.scores.deleteForUser(u.sub, id);
    return { ok: true as const };
  }
}
