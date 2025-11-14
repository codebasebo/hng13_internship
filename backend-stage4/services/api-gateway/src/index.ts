import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { RabbitMQClient } from '../../../shared/utils/rabbitmq';
import { RedisClient } from '../../../shared/utils/redis';
import { Logger } from '../../../shared/utils/logger';
import { errorHandler } from '../../../shared/middleware/error-handler';
import { correlationId } from '../../../shared/middleware/correlation-id';
import { ResponseBuilder } from '../../../shared/types/response.types';
import { createNotificationRoutes } from './routes/notification.routes';

dotenv.config();

const app = express();
const logger = new Logger('api-gateway');
const PORT = process.env.PORT || 3000;

// Trust proxy - Required for Railway/Heroku/etc (behind reverse proxy)
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: ResponseBuilder.error('Too Many Requests', 'Too many requests from this IP, please try again later'),
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(correlationId);
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json(
    ResponseBuilder.success(
      {
        status: 'healthy',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      },
      'Service is healthy'
    )
  );
});

// API info
app.get('/', (req, res) => {
  res.json(
    ResponseBuilder.success(
      {
        name: 'Distributed Notification System API',
        version: '1.0.1',
        build: 'railway-2024-11-14',
        documentation: '/api-docs',
        trustProxy: app.get('trust proxy')
      },
      'Welcome to the Notification System API'
    )
  );
});

const startServer = async () => {
  let rabbitMQ: RabbitMQClient | null = null;
  let redis: RedisClient | null = null;

  try {
    // Initialize RabbitMQ
    rabbitMQ = new RabbitMQClient(
      process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
      'api-gateway'
    );
    await rabbitMQ.connect();

    // Setup queues
    await rabbitMQ.setupQueue({
      exchange: 'notifications.direct',
      exchangeType: 'direct',
      queues: [
        { name: 'email.queue', routingKey: 'email' },
        { name: 'push.queue', routingKey: 'push' },
        { name: 'sms.queue', routingKey: 'sms' }
      ]
    });
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ', error as Error);
    rabbitMQ = null;
  }

  try {
    // Initialize Redis
    redis = new RedisClient(
      process.env.REDIS_URL || 'redis://localhost:6379',
      'api-gateway'
    );
    // Note: RedisClient auto-connects on instantiation
  } catch (error) {
    logger.error('Failed to connect to Redis', error as Error);
    redis = null;
  }

  // Routes - pass null if not connected
  app.use('/api/notifications', createNotificationRoutes(rabbitMQ, redis));

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json(
      ResponseBuilder.error('Not Found', 'The requested resource was not found')
    );
  });

  // Error handler
  app.use(errorHandler);

  app.listen(PORT, () => {
    logger.info(`API Gateway is running on port ${PORT}`);
    logger.info(`Health check available at http://localhost:${PORT}/health`);
  });
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
