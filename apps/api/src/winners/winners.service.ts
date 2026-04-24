import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PayoutStatus, WinnerVerificationStatus } from '@prisma/client';

import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

const PROOF_MAX = 2048;

@Injectable()
export class WinnersService {
  private readonly log = new Logger(WinnersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async listMine(userId: string) {
    const rows = await this.prisma.winner.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        draw: {
          select: { id: true, month: true, status: true, publishedAt: true },
        },
      },
    });
    return { winners: rows };
  }

  async setProof(userId: string, winnerId: string, proofImageKey: string) {
    if (proofImageKey.length < 8 || proofImageKey.length > PROOF_MAX) {
      throw new BadRequestException('Invalid proof reference length');
    }
    const w = await this.prisma.winner.findUnique({ where: { id: winnerId } });
    if (!w) {
      throw new NotFoundException('Winner not found');
    }
    if (w.userId !== userId) {
      throw new ForbiddenException('This win is not yours');
    }
    if (w.verificationStatus === WinnerVerificationStatus.APPROVED) {
      throw new BadRequestException('Proof already approved');
    }
    if (w.payoutStatus === PayoutStatus.PAID) {
      throw new BadRequestException('Payout already completed');
    }
    return this.prisma.winner.update({
      where: { id: winnerId },
      data: { proofImageKey },
    });
  }

  async adminList(
    page = 1,
    limit = 20,
    verificationStatus?: WinnerVerificationStatus,
  ) {
    const skip = (page - 1) * limit;
    const where = verificationStatus ? { verificationStatus } : {};
    const [total, items] = await Promise.all([
      this.prisma.winner.count({ where }),
      this.prisma.winner.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, email: true, name: true } },
          draw: { select: { id: true, month: true, status: true } },
        },
      }),
    ]);
    return { total, page, limit, items };
  }

  async setVerification(
    id: string,
    status: WinnerVerificationStatus,
    adminNotes: string | undefined,
  ) {
    if (
      status !== WinnerVerificationStatus.APPROVED &&
      status !== WinnerVerificationStatus.REJECTED
    ) {
      throw new BadRequestException('Invalid verification status');
    }
    const row = await this.prisma.winner.update({
      where: { id },
      data: {
        verificationStatus: status,
        adminNotes: adminNotes ?? null,
      },
      include: { user: { select: { email: true, name: true } } },
    });
    void this.email
      .sendVerificationOutcome({
        to: row.user.email,
        name: row.user.name,
        approved: status === WinnerVerificationStatus.APPROVED,
        adminNotes,
      })
      .catch((err: unknown) => {
        this.log.warn(
          `Verification email: ${err instanceof Error ? err.message : err}`,
        );
      });
    return row;
  }

  async markPaid(id: string) {
    const w = await this.prisma.winner.findUnique({ where: { id } });
    if (!w) {
      throw new NotFoundException('Winner not found');
    }
    if (w.verificationStatus !== WinnerVerificationStatus.APPROVED) {
      throw new BadRequestException(
        'Verification must be approved before payout',
      );
    }
    if (w.payoutStatus === PayoutStatus.PAID) {
      return w;
    }
    return this.prisma.winner.update({
      where: { id },
      data: { payoutStatus: PayoutStatus.PAID },
    });
  }
}
