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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: ResponseBuilder.error('Too Many Requests', 'Too many requests from this IP, please try again later')
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
        version: '1.0.0',
        documentation: '/api-docs'
      },
      'Welcome to the Notification System API'
    )
  );
});

const startServer = async () => {
  try {
    // Initialize RabbitMQ
    const rabbitMQ = new RabbitMQClient(
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
        { name: 'push.queue', routingKey: 'push' }
      ]
    });

    // Initialize Redis
    const redis = new RedisClient(
      process.env.REDIS_URL || 'redis://localhost:6379',
      'api-gateway'
    );

    // Routes
    app.use('/api/v1/notifications', createNotificationRoutes(rabbitMQ, redis));

    // Error handler
    app.use(errorHandler);

    // 404 handler
    app.use((req, res) => {
      res.status(404).json(
        ResponseBuilder.error('Not Found', 'The requested resource was not found')
      );
    });

    app.listen(PORT, () => {
      logger.info(`API Gateway is running on port ${PORT}`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
};

// startServer();

// Basic server start
app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
