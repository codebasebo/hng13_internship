import axios from 'axios';
import { Logger } from '../../../../shared/utils/logger';
import { CircuitBreaker } from '../../../../shared/utils/circuit-breaker';
import { RetryManager } from '../../../../shared/utils/retry';

export interface PushNotificationOptions {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class PushProvider {
  private logger: Logger;
  private circuitBreaker: CircuitBreaker;
  private retryManager: RetryManager;
  private fcmServerKey: string;

  constructor() {
    this.logger = new Logger('push-provider');
    this.circuitBreaker = new CircuitBreaker('fcm', {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
      resetTimeout: 60000
    });
    this.retryManager = new RetryManager('push-service');
    this.fcmServerKey = process.env.FCM_SERVER_KEY || '';
  }

  async sendPushNotification(options: PushNotificationOptions, correlationId?: string): Promise<boolean> {
    return this.retryManager.executeWithRetry(
      async () => {
        return this.circuitBreaker.execute(
          async () => {
            const response = await axios.post(
              'https://fcm.googleapis.com/fcm/send',
              {
                to: options.token,
                notification: {
                  title: options.title,
                  body: options.body
                },
                data: options.data || {}
              },
              {
                headers: {
                  'Authorization': `key=${this.fcmServerKey}`,
                  'Content-Type': 'application/json'
                },
                timeout: 10000
              }
            );

            this.logger.info(
              `Push notification sent successfully`,
              correlationId,
              { token: options.token.substring(0, 10) + '...' }
            );

            return response.data.success === 1;
          },
          async () => {
            this.logger.warn('Push notification failed, using fallback', correlationId);
            return false;
          }
        );
      },
      'push notification sending',
      correlationId
    );
  }
}
