import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDatabase } from './models';
import { createUserRoutes } from './routes/user.routes';
import { UserService } from './services/user.service';
import { RedisClient } from '../../../shared/utils/redis';
import { Logger } from '../../../shared/utils/logger';
import { errorHandler } from '../../../shared/middleware/error-handler';
import { correlationId } from '../../../shared/middleware/correlation-id';
import { ResponseBuilder } from '../../../shared/types/response.types';

dotenv.config();

const app = express();
const logger = new Logger('user-service');
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(correlationId);

// Health check
app.get('/health', (req, res) => {
  res.json(
    ResponseBuilder.success(
      {
        status: 'healthy',
        service: 'user-service',
        timestamp: new Date().toISOString()
      },
      'Service is healthy'
    )
  );
});

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize Redis
    const redis = new RedisClient(
      process.env.REDIS_URL || 'redis://localhost:6379',
      'user-service'
    );

    // Initialize services
    const userService = new UserService(redis);

    // Routes
    app.use('/api/v1/users', createUserRoutes(userService));

    // Error handler
    app.use(errorHandler);

    // 404 handler
    app.use((req, res) => {
      res.status(404).json(
        ResponseBuilder.error('Not Found', 'The requested resource was not found')
      );
    });

    app.listen(PORT, () => {
      logger.info(`User service is running on port ${PORT}`);
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
