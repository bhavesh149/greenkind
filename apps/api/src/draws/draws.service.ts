import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  type Draw,
  DrawMode,
  DrawStatus,
  type Prisma,
  PayoutStatus,
  SubscriptionStatus,
  UserRole,
  WinnerVerificationStatus,
} from '@prisma/client';

import { type AppEnv } from '../config/env.schema';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  matchCountForUser,
  N_MAX,
  N_MIN,
  drawAlgorithmicNumbers,
  drawRandomNumbers,
  makeRngFromSeedString,
  splitCentsEvenly,
  tierFromMatchCount,
} from './draw-math';

function monthKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseMonthOrThrow(iso: string): Date {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(
      'Invalid month (use an ISO date, e.g. 2025-04-01)',
    );
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

type Eligible = {
  userId: string;
  scoreValues: number[];
  matchCount: number;
  tier: 0 | 3 | 4 | 5;
};

@Injectable()
export class DrawsService {
  private readonly log = new Logger(DrawsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
    private readonly email: EmailService,
  ) {}

  private async logAudit(
    actorId: string | null,
    action: string,
    entity: string,
    entityId: string,
    diff?: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action,
        entity,
        entityId,
        diff: diff ?? undefined,
      },
    });
  }

  private async getActiveSubscribers() {
    return this.prisma.user.findMany({
      where: {
        subscription: { status: SubscriptionStatus.ACTIVE },
        role: UserRole.SUBSCRIBER,
        status: 'ACTIVE',
      },
      include: {
        scores: { orderBy: { scoreDate: 'desc' }, take: 5 },
      },
    });
  }

  private async getAllUsersWithScores() {
    return this.prisma.user.findMany({
      where: {
        subscription: { status: SubscriptionStatus.ACTIVE },
        role: UserRole.SUBSCRIBER,
        status: 'ACTIVE',
      },
      include: { scores: { orderBy: { scoreDate: 'desc' }, take: 5 } },
    });
  }

  private scoreValues(s: { scoreValue: number }[]): number[] {
    return s.map((x) => x.scoreValue);
  }

  private flatScoreFrequency(users: { scores: { scoreValue: number }[] }[]) {
    const all: number[] = [];
    for (const u of users) {
      for (const s of u.scores) {
        if (s.scoreValue >= N_MIN && s.scoreValue <= N_MAX) {
          all.push(s.scoreValue);
        }
      }
    }
    return all;
  }

  /**
   * Build or update prize pool row for a calendar month, pulling rollover from the previous month.
   */
  async buildPrizePoolLedger(month: Date, actorId: string | null) {
    const m = monthKey(month);
    const prev = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1),
    );
    const prevLedger = await this.prisma.prizePoolLedger.findUnique({
      where: { month: prev },
    });
    const rolloverInCents = prevLedger?.rolloverOutCents ?? 0;
    const activeSubscribers = await this.prisma.user.count({
      where: {
        subscription: { status: SubscriptionStatus.ACTIVE },
        role: UserRole.SUBSCRIBER,
        status: 'ACTIVE',
      },
    });
    const mrr = this.config.get('PRIZE_ESTIMATED_MRR_CENTS', { infer: true });
    const revPct = this.config.get('PRIZE_POOL_REVPCT', { infer: true });
    const totalRevenueCents = Math.max(0, activeSubscribers * mrr);
    const poolCents = Math.floor(totalRevenueCents * revPct);
    const tier5Cents = Math.floor(poolCents * 0.4);
    const tier4Cents = Math.floor(poolCents * 0.35);
    const tier3Cents = poolCents - tier5Cents - tier4Cents;

    const row = await this.prisma.prizePoolLedger.upsert({
      where: { month },
      create: {
        month,
        activeSubscribers,
        totalRevenueCents,
        poolCents,
        tier5Cents,
        tier4Cents,
        tier3Cents,
        rolloverInCents,
        rolloverOutCents: 0,
      },
      update: {
        activeSubscribers,
        totalRevenueCents,
        poolCents,
        tier5Cents,
        tier4Cents,
        tier3Cents,
        rolloverInCents,
      },
    });
    await this.logAudit(actorId, 'prizePool.upsert', 'PrizePoolLedger', m, {
      poolCents,
      rolloverInCents,
    } as object);
    return row;
  }

  private computeEligible(
    users: { id: string; scores: { scoreValue: number }[] }[],
    drawn: number[],
  ): Eligible[] {
    const out: Eligible[] = [];
    for (const u of users) {
      const values = this.scoreValues(u.scores);
      const mc = matchCountForUser(values, drawn);
      const t = tierFromMatchCount(mc);
      out.push({ userId: u.id, scoreValues: values, matchCount: mc, tier: t });
    }
    return out;
  }

  async listPublished(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      this.prisma.draw.count({ where: { status: DrawStatus.PUBLISHED } }),
      this.prisma.draw.findMany({
        where: { status: DrawStatus.PUBLISHED },
        orderBy: { month: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return { total, page, limit, items };
  }

  async getPublishedByMonth(month: Date) {
    const row = await this.prisma.draw.findUnique({ where: { month } });
    if (!row || row.status !== DrawStatus.PUBLISHED) {
      throw new NotFoundException('Draw not found');
    }
    return row;
  }

  async getLatestPublished() {
    return this.prisma.draw.findFirst({
      where: { status: DrawStatus.PUBLISHED },
      orderBy: { month: 'desc' },
    });
  }

  async adminList(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      this.prisma.draw.count(),
      this.prisma.draw.findMany({
        orderBy: { month: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return { total, page, limit, items };
  }

  async getById(id: string): Promise<Draw> {
    const d = await this.prisma.draw.findUnique({ where: { id } });
    if (!d) {
      throw new NotFoundException('Draw not found');
    }
    return d;
  }

  async createDraftForMonth(monthIso: string, mode: DrawMode, adminId: string) {
    const month = parseMonthOrThrow(monthIso);
    const existing = await this.prisma.draw.findUnique({ where: { month } });
    if (existing) {
      throw new ConflictException('A draw already exists for this month');
    }
    await this.buildPrizePoolLedger(month, adminId);
    return this.prisma.draw.create({
      data: {
        month,
        mode,
        status: DrawStatus.DRAFT,
        generatedNumbers: [],
      },
    });
  }

  async simulate(id: string, adminId: string) {
    const draw = await this.getById(id);
    if (draw.status === DrawStatus.PUBLISHED) {
      throw new BadRequestException('Cannot simulate a published draw');
    }
    await this.buildPrizePoolLedger(draw.month, adminId);
    const allUsers = await this.getAllUsersWithScores();
    const seed = `draw:${id}:sim:${monthKey(draw.month)}:mode=${draw.mode}`;
    let numbers: number[];
    if (draw.mode === DrawMode.RANDOM) {
      const rng = makeRngFromSeedString(seed);
      numbers = drawRandomNumbers(rng);
    } else {
      const flat = this.flatScoreFrequency(
        allUsers as { scores: { scoreValue: number }[] }[],
      );
      numbers = drawAlgorithmicNumbers(flat, seed);
    }
    for (const n of numbers) {
      if (n < N_MIN || n > N_MAX) {
        throw new BadRequestException('Draw engine generated invalid number');
      }
    }
    const users = (await this.getActiveSubscribers()) as {
      id: string;
      scores: { scoreValue: number }[];
    }[];
    const eligible = this.computeEligible(users, numbers);
    const byTier = { 5: 0, 4: 0, 3: 0 };
    for (const e of eligible) {
      if (e.tier === 5) {
        byTier[5] += 1;
      } else if (e.tier === 4) {
        byTier[4] += 1;
      } else if (e.tier === 3) {
        byTier[3] += 1;
      }
    }
    const summary = {
      generatedNumbers: numbers,
      mode: draw.mode,
      eligibleSubscribers: users.length,
      winnersByTier: byTier,
      sample: eligible
        .filter((e) => e.tier > 0)
        .slice(0, 20)
        .map((e) => ({
          userId: e.userId,
          tier: e.tier,
          matchCount: e.matchCount,
        })),
    };
    const updated = await this.prisma.draw.update({
      where: { id: draw.id },
      data: {
        generatedNumbers: numbers,
        seed,
        status: DrawStatus.SIMULATED,
        resultSummary: JSON.parse(
          JSON.stringify(summary),
        ) as Prisma.InputJsonValue,
      },
    });
    await this.logAudit(adminId, 'draw.simulate', 'Draw', draw.id, {
      summary,
    } as object);
    return updated;
  }

  async publish(id: string, adminId: string) {
    const draw = await this.getById(id);
    if (draw.status === DrawStatus.PUBLISHED) {
      throw new BadRequestException('Draw already published');
    }
    if (draw.status !== DrawStatus.SIMULATED) {
      throw new BadRequestException(
        'Run simulate first (status must be SIMULATED)',
      );
    }
    if (!draw.generatedNumbers || draw.generatedNumbers.length !== 5) {
      throw new BadRequestException('Draw has no valid generated numbers');
    }
    const numbers = draw.generatedNumbers;
    const existingWinners = await this.prisma.winner.count({
      where: { drawId: draw.id },
    });
    if (existingWinners > 0) {
      throw new ConflictException('Draw already has winner rows; aborting');
    }
    const users = (await this.getActiveSubscribers()) as {
      id: string;
      scores: { scoreValue: number }[];
    }[];
    const eligible = this.computeEligible(users, numbers);
    const w5 = eligible.filter((e) => e.tier === 5);
    const w4 = eligible.filter((e) => e.tier === 4);
    const w3 = eligible.filter((e) => e.tier === 3);

    const ledger = await this.buildPrizePoolLedger(draw.month, null);
    const fivePool = ledger.tier5Cents + ledger.rolloverInCents;
    const fourPool = ledger.tier4Cents;
    const threePool = ledger.tier3Cents;

    const p5 = splitCentsEvenly(fivePool, w5.length);
    const p4 = splitCentsEvenly(fourPool, w4.length);
    const p3 = splitCentsEvenly(threePool, w3.length);

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < w5.length; i++) {
        await tx.winner.create({
          data: {
            drawId: draw.id,
            userId: w5[i].userId,
            tier: 5,
            matchCount: 5,
            payoutAmountCents: p5[i] ?? 0,
            verificationStatus: WinnerVerificationStatus.PENDING,
            payoutStatus: PayoutStatus.PENDING,
          },
        });
        await tx.notification.create({
          data: {
            userId: w5[i].userId,
            type: 'draw.won',
            title: 'You won the monthly draw (top tier)',
            body: 'Upload proof in Winnings to continue verification.',
          },
        });
      }
      for (let i = 0; i < w4.length; i++) {
        await tx.winner.create({
          data: {
            drawId: draw.id,
            userId: w4[i].userId,
            tier: 4,
            matchCount: 4,
            payoutAmountCents: p4[i] ?? 0,
            verificationStatus: WinnerVerificationStatus.PENDING,
            payoutStatus: PayoutStatus.PENDING,
          },
        });
        await tx.notification.create({
          data: {
            userId: w4[i].userId,
            type: 'draw.won',
            title: 'You won a 4-number tier prize',
            body: 'Upload proof in Winnings to continue verification.',
          },
        });
      }
      for (let i = 0; i < w3.length; i++) {
        await tx.winner.create({
          data: {
            drawId: draw.id,
            userId: w3[i].userId,
            tier: 3,
            matchCount: 3,
            payoutAmountCents: p3[i] ?? 0,
            verificationStatus: WinnerVerificationStatus.PENDING,
            payoutStatus: PayoutStatus.PENDING,
          },
        });
        await tx.notification.create({
          data: {
            userId: w3[i].userId,
            type: 'draw.won',
            title: 'You won a 3-number tier prize',
            body: 'Upload proof in Winnings to continue verification.',
          },
        });
      }

      const rolloverOut = w5.length === 0 ? fivePool : 0;
      await tx.prizePoolLedger.update({
        where: { month: draw.month },
        data: { rolloverOutCents: rolloverOut },
      });

      const fullSummary = {
        ...(draw.resultSummary as object | null),
        publishedAt: new Date().toISOString(),
        publishedBy: adminId,
        winnerCounts: { tier5: w5.length, tier4: w4.length, tier3: w3.length },
        rolloverOutCents: rolloverOut,
      };

      await tx.draw.update({
        where: { id: draw.id },
        data: {
          status: DrawStatus.PUBLISHED,
          publishedAt: new Date(),
          resultSummary: JSON.parse(
            JSON.stringify(fullSummary),
          ) as Prisma.InputJsonValue,
        },
      });
    });

    const published = await this.getById(draw.id);
    await this.logAudit(adminId, 'draw.publish', 'Draw', draw.id, {
      winnerCounts: w5.length + w4.length + w3.length,
    } as object);

    const monthLabel = draw.month.toISOString().slice(0, 7);
    const winRows = await this.prisma.winner.findMany({
      where: { drawId: draw.id },
      include: { user: { select: { email: true, name: true } } },
    });
    for (const w of winRows) {
      const major = (w.payoutAmountCents / 100).toFixed(2);
      void this.email
        .sendYouWon({
          to: w.user.email,
          name: w.user.name,
          monthLabel,
          tier: w.tier,
          amountLabel: major,
        })
        .catch((err: unknown) => {
          this.log.warn(
            `Winner email: ${err instanceof Error ? err.message : err}`,
          );
        });
    }

    return published;
  }
}
