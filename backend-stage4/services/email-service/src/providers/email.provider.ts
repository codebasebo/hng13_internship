import nodemailer, { Transporter } from 'nodemailer';
import { Logger } from '../../../../shared/utils/logger';
import { CircuitBreaker } from '../../../../shared/utils/circuit-breaker';
import { RetryManager } from '../../../../shared/utils/retry';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailProvider {
  private transporter: Transporter;
  private logger: Logger;
  private circuitBreaker: CircuitBreaker;
  private retryManager: RetryManager;

  constructor() {
    this.logger = new Logger('email-provider');
    this.circuitBreaker = new CircuitBreaker('smtp', {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
      resetTimeout: 60000
    });
    this.retryManager = new RetryManager('email-service');

    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(options: EmailOptions, correlationId?: string): Promise<boolean> {
    return this.retryManager.executeWithRetry(
      async () => {
        return this.circuitBreaker.execute(
          async () => {
            const info = await this.transporter.sendMail({
              from: options.from || process.env.SMTP_FROM,
              to: options.to,
              subject: options.subject,
              html: options.html
            });

            this.logger.info(
              `Email sent successfully: ${info.messageId}`,
              correlationId,
              { to: options.to }
            );

            return true;
          },
          async () => {
            this.logger.warn('Email sending failed, using fallback', correlationId);
            return false;
          }
        );
      },
      'email sending',
      correlationId
    );
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.info('SMTP connection verified');
      return true;
    } catch (error) {
      this.logger.error('SMTP connection verification failed', error as Error);
      return false;
    }
  }
}
