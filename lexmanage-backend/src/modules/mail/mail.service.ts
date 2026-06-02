import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
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
    const { firmName, motifLabel, message, senderName, timestamp } = data;
    const subject = `[URGENT] ${motifLabel} — ${firmName}`;

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
      await this.resend.emails.send({
        from: `${firmName} LexManage <noreply@lexmanage.com>`,
        to: [to],
        subject,
        html,
      });
      this.logger.log(`Urgent email sent to ${to} for motif: ${motifLabel}`);
    } catch (error) {
      this.logger.error(`Failed to send urgent email to ${to}`, error);
    }
  }

}
