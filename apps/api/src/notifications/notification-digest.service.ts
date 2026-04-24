import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { type AppEnv } from '../config/env.schema';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationDigestService {
  private readonly log = new Logger(NotificationDigestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
    private readonly email: EmailService,
  ) {}

  /**
   * Daily 09:00 server time: email users who have at least one unread in-app notification.
   */
  @Cron('0 9 * * *')
  async runDigest(): Promise<void> {
    if (this.config.get('NODE_ENV', { infer: true }) === 'test') {
      return;
    }
    if (this.config.get('DISABLE_EMAIL_DIGEST', { infer: true })) {
      return;
    }
    const unread = await this.prisma.notification.findMany({
      where: { readAt: null },
      select: { userId: true },
    });
    if (unread.length === 0) {
      return;
    }
    const counts = new Map<string, number>();
    for (const n of unread) {
      counts.set(n.userId, (counts.get(n.userId) ?? 0) + 1);
    }
    let sent = 0;
    for (const [userId, count] of counts) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (!user?.email) {
        continue;
      }
      const r = await this.email.sendUnreadDigest({
        to: user.email,
        name: user.name,
        count,
      });
      if (r.ok) {
        sent += 1;
      }
    }
    this.log.log(
      `Notification digest: ${sent} email(s) for ${counts.size} user(s).`,
    );
  }
}
