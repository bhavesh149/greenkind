import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DrawStatus,
  SubscriptionStatus,
  UserRole,
  WinnerVerificationStatus,
} from '@prisma/client';

import { type AppEnv } from '../config/env.schema';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  async getSummary() {
    const cur = this.config
      .get('STRIPE_DONATION_CURRENCY', { infer: true })
      .toUpperCase();
    const [
      userCount,
      activeSubscribers,
      charityCount,
      donationAgg,
      publishedDraws,
      draftDraws,
      pendingVerifications,
      recentSignups,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          role: UserRole.SUBSCRIBER,
          subscription: { status: SubscriptionStatus.ACTIVE },
        },
      }),
      this.prisma.charity.count({ where: { active: true } }),
      this.prisma.donation.aggregate({ _sum: { amountCents: true } }),
      this.prisma.draw.count({ where: { status: DrawStatus.PUBLISHED } }),
      this.prisma.draw.count({ where: { status: DrawStatus.DRAFT } }),
      this.prisma.winner.count({
        where: { verificationStatus: WinnerVerificationStatus.PENDING },
      }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);
    return {
      users: { total: userCount },
      subscribers: { active: activeSubscribers },
      charities: { active: charityCount },
      donations: {
        totalCents: donationAgg._sum.amountCents ?? 0,
        currency: cur,
      },
      draws: { published: publishedDraws, draft: draftDraws },
      winners: { pendingVerification: pendingVerifications },
      recentSignups,
    };
  }

  async listUsers(page = 1, limit = 20, q?: string) {
    const skip = (page - 1) * limit;
    const where = q?.trim()
      ? {
          OR: [
            { email: { contains: q.trim(), mode: 'insensitive' as const } },
            { name: { contains: q.trim(), mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          subscription: {
            select: {
              plan: true,
              status: true,
              currentPeriodEnd: true,
            },
          },
        },
      }),
    ]);
    return { total, page, limit, items };
  }

  async listAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          actor: { select: { id: true, email: true, name: true } },
        },
      }),
    ]);
    return { total, page, limit, items };
  }
}
