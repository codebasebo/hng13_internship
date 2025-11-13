import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { RabbitMQClient } from '../../../shared/utils/rabbitmq';
import { RedisClient } from '../../../shared/utils/redis';
import { Logger } from '../../../shared/utils/logger';
import { EmailProvider } from './providers/email.provider';
import { EmailConsumer } from './consumers/email.consumer';
import { ResponseBuilder } from '../../../shared/types/response.types';

dotenv.config();

const app = express();
const logger = new Logger('email-service');
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json(
    ResponseBuilder.success(
      {
        status: 'healthy',
        service: 'email-service',
        timestamp: new Date().toISOString()
      },
      'Service is healthy'
    )
  );
});

const startServer = async () => {
  try {
    // Initialize RabbitMQ
    const rabbitMQ = new RabbitMQClient(
      process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
      'email-service'
    );
    await rabbitMQ.connect();

    // Setup queues
    await rabbitMQ.setupQueue({
      exchange: 'notifications.direct',
      exchangeType: 'direct',
      queues: [
        { name: 'email.queue', routingKey: 'email' }
      ]
    });

    // Initialize Redis
    const redis = new RedisClient(
      process.env.REDIS_URL || 'redis://localhost:6379',
      'email-service'
    );

    // Initialize email provider
    const emailProvider = new EmailProvider();
    await emailProvider.verifyConnection();

    // Start consumer
    const emailConsumer = new EmailConsumer(rabbitMQ, redis, emailProvider);
    await emailConsumer.start();

    app.listen(PORT, () => {
      logger.info(`Email service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
