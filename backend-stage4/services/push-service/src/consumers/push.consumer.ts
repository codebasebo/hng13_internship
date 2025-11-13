import axios from 'axios';
import { RabbitMQClient } from '../../../../shared/utils/rabbitmq';
import { RedisClient } from '../../../../shared/utils/redis';
import { Logger } from '../../../../shared/utils/logger';
import { PushProvider } from '../providers/push.provider';
import { NotificationStatus } from '../../../../shared/enums/notification.enum';

export class PushConsumer {
  private logger: Logger;
  private pushProvider: PushProvider;
  private redis: RedisClient;
  private rabbitMQ: RabbitMQClient;

  constructor(rabbitMQ: RabbitMQClient, redis: RedisClient, pushProvider: PushProvider) {
    this.logger = new Logger('push-consumer');
    this.rabbitMQ = rabbitMQ;
    this.redis = redis;
    this.pushProvider = pushProvider;
  }

  async start(): Promise<void> {
    this.logger.info('Starting push consumer');

    await this.rabbitMQ.consume(
      'push.queue',
      async (message, correlationId) => {
        await this.processPushNotification(message, correlationId);
      },
      { prefetch: 5 }
    );
  }

  private async processPushNotification(message: any, correlationId: string): Promise<void> {
    try {
      this.logger.info('Processing push notification', correlationId, { userId: message.user_id });

      await this.updateNotificationStatus(message.request_id, NotificationStatus.PENDING, correlationId);

      const user = await this.getUserDetails(message.user_id, correlationId);
      if (!user || !user.push_token) {
        throw new Error('User push token not found');
      }

      if (!user.preferences?.push) {
        this.logger.info('User has disabled push notifications', correlationId, { userId: user.id });
        await this.updateNotificationStatus(
          message.request_id,
          NotificationStatus.DELIVERED,
          correlationId,
          'User has disabled push notifications'
        );
        return;
      }

      const rendered = await this.getRenderedTemplate(
        message.template_code,
        message.variables,
        correlationId
      );

      const sent = await this.pushProvider.sendPushNotification(
        {
          token: user.push_token,
          title: rendered.subject || 'Notification',
          body: rendered.content
        },
        correlationId
      );

      if (sent) {
        await this.updateNotificationStatus(message.request_id, NotificationStatus.DELIVERED, correlationId);
        this.logger.info('Push notification delivered', correlationId, { userId: message.user_id });
      } else {
        throw new Error('Failed to send push notification');
      }
    } catch (error) {
      this.logger.error('Failed to process push notification', error as Error, correlationId);
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
      await this.redis.set(cacheKey, user, 300);
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

      await this.redis.set(`notification:status:${notificationId}`, statusUpdate, 86400);
      this.logger.info(`Notification status updated to ${status}`, correlationId, { notificationId });
    } catch (err) {
      this.logger.error('Failed to update notification status', err as Error, correlationId);
    }
  }
}
