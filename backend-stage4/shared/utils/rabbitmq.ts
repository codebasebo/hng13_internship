import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { Logger } from './logger';

export interface QueueConfig {
  exchange: string;
  exchangeType: string;
  queues: {
    name: string;
    routingKey: string;
    deadLetterExchange?: string;
    messageTtl?: number;
  }[];
}

export class RabbitMQClient {
  private connection: any = null;
  private channel: any = null;
  private logger: Logger;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(url: string, serviceName: string) {
    this.url = url;
    this.logger = new Logger(`${serviceName}-rabbitmq`);
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      this.connection.on('error', (err: any) => {
        this.logger.error('RabbitMQ connection error', err);
        this.reconnect();
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.reconnect();
      });

      this.logger.info('Connected to RabbitMQ');
      this.reconnectAttempts = 0;
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error as Error);
      throw error;
    }
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.logger.info(`Reconnecting to RabbitMQ in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.logger.error('Reconnection failed', error as Error);
      }
    }, delay);
  }

  async setupQueue(config: QueueConfig): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    // Create exchange
    await this.channel.assertExchange(config.exchange, config.exchangeType, {
      durable: true
    });

    // Create dead letter exchange
    await this.channel.assertExchange('notifications.dlx', 'direct', {
      durable: true
    });

    // Create dead letter queue
    await this.channel.assertQueue('failed.queue', {
      durable: true
    });

    await this.channel.bindQueue('failed.queue', 'notifications.dlx', 'failed');

    // Create queues
    for (const queue of config.queues) {
      const queueOptions: any = {
        durable: true,
        deadLetterExchange: 'notifications.dlx',
        deadLetterRoutingKey: 'failed'
      };

      if (queue.messageTtl) {
        queueOptions.messageTtl = queue.messageTtl;
      }

      await this.channel.assertQueue(queue.name, queueOptions);
      await this.channel.bindQueue(queue.name, config.exchange, queue.routingKey);
      
      this.logger.info(`Queue '${queue.name}' created and bound to exchange '${config.exchange}'`);
    }
  }

  async publish(
    exchange: string,
    routingKey: string,
    message: any,
    correlationId?: string
  ): Promise<boolean> {
    if (!this.channel) throw new Error('Channel not initialized');

    try {
      const content = Buffer.from(JSON.stringify(message));
      const result = this.channel.publish(exchange, routingKey, content, {
        persistent: true,
        contentType: 'application/json',
        correlationId: correlationId || Logger.generateCorrelationId(),
        timestamp: Date.now()
      });

      this.logger.info(`Message published to ${exchange}/${routingKey}`, correlationId);
      return result;
    } catch (error) {
      this.logger.error('Failed to publish message', error as Error, correlationId);
      throw error;
    }
  }

  async consume(
    queueName: string,
    handler: (message: any, correlationId: string) => Promise<void>,
    options: { prefetch?: number } = {}
  ): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    await this.channel.prefetch(options.prefetch || 1);

    await this.channel.consume(queueName, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      const correlationId = msg.properties.correlationId || Logger.generateCorrelationId();

      try {
        const content = JSON.parse(msg.content.toString());
        this.logger.info(`Processing message from ${queueName}`, correlationId);

        await handler(content, correlationId);

        this.channel!.ack(msg);
        this.logger.info(`Message acknowledged from ${queueName}`, correlationId);
      } catch (error) {
        this.logger.error(`Failed to process message from ${queueName}`, error as Error, correlationId);
        
        // Check retry count
        const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
        const maxRetries = 3;

        if (retryCount < maxRetries) {
          // Requeue with retry count
          this.channel!.nack(msg, false, false);
          await this.publish(
            'notifications.direct',
            queueName.replace('.queue', ''),
            JSON.parse(msg.content.toString()),
            correlationId
          );
        } else {
          // Send to DLQ
          this.channel!.nack(msg, false, false);
          this.logger.error(`Message sent to DLQ after ${maxRetries} retries`, undefined, correlationId);
        }
      }
    });

    this.logger.info(`Consuming messages from ${queueName}`);
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.info('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error as Error);
    }
  }
}
