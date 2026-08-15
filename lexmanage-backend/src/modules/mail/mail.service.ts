import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly fromEmail: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    // Sender address. Must be a Resend-verified domain in production.
    // Defaults to Resend's sandbox sender (delivers only to your Resend account email).
    this.fromEmail = this.configService.get<string>('MAIL_FROM') || 'onboarding@resend.dev';
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY is not defined. Email notifications will be disabled.');
    }
  }

  async sendUrgentNotificationEmail(to: string, data: {
    firmName: string;
    motifLabel: string;
    message?: string;
    senderName: string;
    timestamp: Date;
  }) {
    if (!this.resend) {
      this.logger.warn(`Skipping email to ${to} (Resend not initialized)`);
      return;
    }
    const firmName = this.escapeHtml(data.firmName);
    const motifLabel = this.escapeHtml(data.motifLabel);
    const message = this.escapeHtml(data.message || '');
    const senderName = this.escapeHtml(data.senderName);
    const subject = `[URGENT] ${data.motifLabel} — ${data.firmName}`;

    const html = `
      <div style='font-family:Arial,sans-serif;max-width:600px'>
        <div style='background:#A32D2D;color:white;padding:16px 24px;'>
          <h2 style='margin:0'>URGENT NOTIFICATION</h2>
          <p style='margin:4px 0 0'>${firmName}</p>
        </div>
        <div style='padding:24px;'>
          <p><strong>Type:</strong> ${motifLabel}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p><strong>Sent by:</strong> ${senderName}</p>
          <hr/>
          <p style='font-size:12px;color:#666'>
            Log in to LexManage to acknowledge this notification.
          </p>
        </div>
      </div>
    `;

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${firmName} via LexManage <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
      });

      // Resend reports API-level failures (invalid domain, rate limit, etc.) via
      // the `error` field rather than throwing — so we must check it explicitly.
      if (error) {
        throw new Error(`Resend API error: ${error.name} - ${error.message}`);
      }

      this.logger.log(`Urgent email sent to ${to} for motif: ${motifLabel} (id: ${data?.id})`);
    } catch (error) {
      // Re-throw so the Bull queue marks the job failed and retries it
      // (configured with attempts: 3 + exponential backoff in NotificationsService).
      this.logger.error(`Failed to send urgent email to ${to}`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    if (!this.resend) {
      this.logger.warn(`Skipping password reset email to ${to} (Resend not initialized)`);
      return;
    }
    const safeUrl = this.escapeHtml(resetUrl);
    const { error } = await this.resend.emails.send({
      from: `LexManage <${this.fromEmail}>`,
      to: [to],
      subject: 'Réinitialisation de votre mot de passe LexManage',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px">
          <h2>Réinitialisation du mot de passe</h2>
          <p>Une demande de réinitialisation a été reçue pour votre compte.</p>
          <p><a href="${safeUrl}">Choisir un nouveau mot de passe</a></p>
          <p>Ce lien expire dans une heure. Ignorez cet email si vous n’êtes pas à l’origine de la demande.</p>
        </div>
      `,
    });
    if (error) throw new Error(`Resend API error: ${error.name} - ${error.message}`);
  }

  private escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    })[char] as string);
  }

}
