import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type Score } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const MAX_ROLLING = 5;

@Injectable()
export class ScoresService {
  constructor(private readonly prisma: PrismaService) {}

  parseDateOnly(yyyyMmDd: string): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyyMmDd.trim());
    if (!m) {
      throw new BadRequestException('scoreDate must be YYYY-MM-DD');
    }
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    return new Date(Date.UTC(y, mo, d));
  }

  async listForUser(userId: string): Promise<Score[]> {
    return this.prisma.score.findMany({
      where: { userId },
      orderBy: { scoreDate: 'desc' },
      take: MAX_ROLLING,
    });
  }

  /**
   * Upsert by (userId, scoreDate). If this would be a 6th distinct date, drop the oldest row first.
   */
  async upsert(
    userId: string,
    scoreDate: string,
    scoreValue: number,
  ): Promise<Score> {
    const day = this.parseDateOnly(scoreDate);
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.score.findUnique({
        where: { userId_scoreDate: { userId, scoreDate: day } },
      });
      if (existing) {
        return tx.score.update({
          where: { id: existing.id },
          data: { scoreValue },
        });
      }
      const count = await tx.score.count({ where: { userId } });
      if (count >= MAX_ROLLING) {
        const oldest = await tx.score.findFirst({
          where: { userId },
          orderBy: { scoreDate: 'asc' },
        });
        if (oldest) {
          await tx.score.delete({ where: { id: oldest.id } });
        }
      }
      return tx.score.create({
        data: {
          userId,
          scoreDate: day,
          scoreValue,
        },
      });
    });
  }

  async deleteForUser(userId: string, scoreId: string): Promise<void> {
    const row = await this.prisma.score.findFirst({
      where: { id: scoreId, userId },
    });
    if (!row) {
      throw new NotFoundException('Score not found');
    }
    await this.prisma.score.delete({ where: { id: scoreId } });
  }
}
