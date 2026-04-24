import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import { type AppEnv } from '../config/env.schema';

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

@Injectable()
export class EmailService {
  private readonly log = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService<AppEnv, true>) {
    const key = this.config.get('RESEND_API_KEY', { infer: true });
    this.from = this.config.get('RESEND_FROM', { infer: true });
    this.appUrl = this.config.get('FRONTEND_ORIGIN', { infer: true });
    this.resend = key ? new Resend(key) : null;
    if (!this.resend) {
      this.log.warn(
        'Resend is disabled (set RESEND_API_KEY and RESEND_FROM to send email).',
      );
    }
  }

  private async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<{ ok: boolean; skipped?: string }> {
    if (!this.resend) {
      return { ok: false, skipped: 'no_client' };
    }
    if (!this.from) {
      return { ok: false, skipped: 'no_from' };
    }
    const { data, error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });
    if (error) {
      this.log.warn(`Resend error: ${error.message}`);
      return { ok: false, skipped: error.message };
    }
    void data;
    return { ok: true };
  }

  sendWelcome(params: {
    to: string;
    name: string;
  }): Promise<{ ok: boolean; skipped?: string }> {
    const html = `
      <p>Hi ${esc(params.name)},</p>
      <p>Welcome to <strong>GreenKind</strong> — your account is ready. Subscribe when you are, then
      track your last five scores, back a cause you care about, and join the monthly draw.</p>
      <p><a href="${esc(this.appUrl)}/app">Open your app</a></p>
      <p style="color:#666;font-size:12px">You received this because you created a GreenKind account.</p>
    `;
    return this.send(params.to, 'Welcome to GreenKind', html);
  }

  sendSubscriptionThankYou(params: {
    to: string;
    name: string;
  }): Promise<{ ok: boolean; skipped?: string }> {
    const html = `
      <p>Hi ${esc(params.name)},</p>
      <p>Thanks — your <strong>GreenKind subscription</strong> is active. You can manage billing anytime in the app.</p>
      <p><a href="${esc(this.appUrl)}/app/billing">Billing &amp; portal</a></p>
    `;
    return this.send(params.to, 'Subscription confirmed — GreenKind', html);
  }

  sendYouWon(params: {
    to: string;
    name: string;
    monthLabel: string;
    tier: number;
    amountLabel: string;
  }): Promise<{ ok: boolean; skipped?: string }> {
    const html = `
      <p>Hi ${esc(params.name)},</p>
      <p>You matched <strong>${params.tier} numbers</strong> in the <strong>${esc(params.monthLabel)}</strong> draw.
      Payout: <strong>${esc(params.amountLabel)}</strong> (in your account currency, subject to verification).</p>
      <p><a href="${esc(this.appUrl)}/app/winnings">Upload proof in Winnings</a></p>
    `;
    return this.send(params.to, 'You won a GreenKind draw prize', html);
  }

  sendVerificationOutcome(params: {
    to: string;
    name: string;
    approved: boolean;
    adminNotes?: string | null;
  }): Promise<{ ok: boolean; skipped?: string }> {
    const line = params.approved
      ? 'Your win verification was <strong>approved</strong>. We will mark payout once processed.'
      : 'Your win verification was <strong>not approved</strong>. You may upload a new proof from Winnings if allowed.';
    const note =
      params.adminNotes && !params.approved
        ? `<p>Admin note: ${esc(params.adminNotes)}</p>`
        : '';
    const html = `
      <p>Hi ${esc(params.name)},</p>
      <p>${line}</p>
      ${note}
      <p><a href="${esc(this.appUrl)}/app/winnings">Open Winnings</a></p>
    `;
    return this.send(
      params.to,
      params.approved
        ? 'Verification approved — GreenKind'
        : 'Verification update — GreenKind',
      html,
    );
  }

  sendUnreadDigest(params: {
    to: string;
    name: string;
    count: number;
  }): Promise<{ ok: boolean; skipped?: string }> {
    const html = `
      <p>Hi ${esc(params.name)},</p>
      <p>You have <strong>${params.count}</strong> unread notification${params.count === 1 ? '' : 's'} in GreenKind.</p>
      <p><a href="${esc(this.appUrl)}/app/notifications">View notifications</a></p>
    `;
    return this.send(params.to, 'Your GreenKind digest', html);
  }
}
