import axios from 'axios';
import { RabbitMQClient } from '../../../../shared/utils/rabbitmq';
import { RedisClient } from '../../../../shared/utils/redis';
import { Logger } from '../../../../shared/utils/logger';
import { EmailProvider } from '../providers/email.provider';
import { NotificationStatus } from '../../../../shared/enums/notification.enum';

export class EmailConsumer {
  private logger: Logger;
  private emailProvider: EmailProvider;
  private redis: RedisClient;
  private rabbitMQ: RabbitMQClient;

  constructor(rabbitMQ: RabbitMQClient, redis: RedisClient, emailProvider: EmailProvider) {
    this.logger = new Logger('email-consumer');
    this.rabbitMQ = rabbitMQ;
    this.redis = redis;
    this.emailProvider = emailProvider;
  }

  async start(): Promise<void> {
    this.logger.info('Starting email consumer');

    await this.rabbitMQ.consume(
      'email.queue',
      async (message, correlationId) => {
        await this.processEmailNotification(message, correlationId);
      },
      { prefetch: 5 }
    );
  }

  private async processEmailNotification(message: any, correlationId: string): Promise<void> {
    try {
      this.logger.info('Processing email notification', correlationId, { userId: message.user_id });

      // Update status to pending
      await this.updateNotificationStatus(message.request_id, NotificationStatus.PENDING, correlationId);

      // Get user details
      const user = await this.getUserDetails(message.user_id, correlationId);
      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      // Check user preferences
      if (!user.preferences?.email) {
        this.logger.info('User has disabled email notifications', correlationId, { userId: user.id });
        await this.updateNotificationStatus(
          message.request_id,
          NotificationStatus.DELIVERED,
          correlationId,
          'User has disabled email notifications'
        );
        return;
      }

      // Get rendered template
      const rendered = await this.getRenderedTemplate(
        message.template_code,
        message.variables,
        correlationId
      );

      // Send email
      const sent = await this.emailProvider.sendEmail(
        {
          to: user.email,
          subject: rendered.subject || 'Notification',
          html: rendered.content
        },
        correlationId
      );

      if (sent) {
        await this.updateNotificationStatus(message.request_id, NotificationStatus.DELIVERED, correlationId);
        this.logger.info('Email notification delivered', correlationId, { userId: message.user_id });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      this.logger.error('Failed to process email notification', error as Error, correlationId);
      await this.updateNotificationStatus(
        message.request_id,
        NotificationStatus.FAILED,
        correlationId,
        (error as Error).message
      );
      throw error;
    }
  }

  private async getUserDetails(userId: string, correlationId: string): Promise<any> {
    try {
      const cacheKey = `user:${userId}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) return cached;

      const response = await axios.get(
        `${process.env.USER_SERVICE_URL}/api/v1/users/${userId}`,
        {
          headers: { 'X-Correlation-ID': correlationId },
          timeout: 5000
        }
      );

      const user = response.data.data;
      await this.redis.set(cacheKey, user, 300); // Cache for 5 minutes
      return user;
    } catch (error) {
      this.logger.error('Failed to get user details', error as Error, correlationId);
      throw error;
    }
  }

  private async getRenderedTemplate(
    templateCode: string,
    variables: any,
    correlationId: string
  ): Promise<{ subject?: string; content: string }> {
    try {
      const response = await axios.post(
        `${process.env.TEMPLATE_SERVICE_URL}/api/v1/templates/render/${templateCode}`,
        { variables },
        {
          headers: { 'X-Correlation-ID': correlationId },
          timeout: 5000
        }
      );

      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to get rendered template', error as Error, correlationId);
      throw error;
    }
  }

  private async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    correlationId: string,
    error?: string
  ): Promise<void> {
    try {
      const statusUpdate = {
        notification_id: notificationId,
        status,
        timestamp: new Date(),
        error
      };

      await this.redis.set(`notification:status:${notificationId}`, statusUpdate, 86400); // 24 hours
      this.logger.info(`Notification status updated to ${status}`, correlationId, { notificationId });
    } catch (err) {
      this.logger.error('Failed to update notification status', err as Error, correlationId);
    }
  }
}
