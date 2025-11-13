import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { RabbitMQClient } from '../../../shared/utils/rabbitmq';
import { RedisClient } from '../../../shared/utils/redis';
import { Logger } from '../../../shared/utils/logger';
import { PushProvider } from './providers/push.provider';
import { PushConsumer } from './consumers/push.consumer';
import { ResponseBuilder } from '../../../shared/types/response.types';

dotenv.config();

const app = express();
const logger = new Logger('push-service');
const PORT = process.env.PORT || 3004;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json(
    ResponseBuilder.success(
      { status: 'healthy', service: 'push-service', timestamp: new Date().toISOString() },
      'Service is healthy'
    )
  );
});

const startServer = async () => {
  try {
    const rabbitMQ = new RabbitMQClient(
      process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
      'push-service'
    );
    await rabbitMQ.connect();

    await rabbitMQ.setupQueue({
      exchange: 'notifications.direct',
      exchangeType: 'direct',
      queues: [{ name: 'push.queue', routingKey: 'push' }]
    });

    const redis = new RedisClient(
      process.env.REDIS_URL || 'redis://localhost:6379',
      'push-service'
    );

    const pushProvider = new PushProvider();
    const pushConsumer = new PushConsumer(rabbitMQ, redis, pushProvider);
    await pushConsumer.start();

    app.listen(PORT, () => {
      logger.info(`Push service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
