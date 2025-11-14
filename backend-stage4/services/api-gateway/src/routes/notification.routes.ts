import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { RabbitMQClient } from '../../../../shared/utils/rabbitmq';
import { RedisClient } from '../../../../shared/utils/redis';
import { Logger } from '../../../../shared/utils/logger';
import { ResponseBuilder } from '../../../../shared/types/response.types';
import { authenticate, AuthRequest } from '../../../../shared/middleware/auth';
import { NotificationType, NotificationPriority } from '../../../../shared/enums/notification.enum';

export const createNotificationRoutes = (
  rabbitMQ: RabbitMQClient | null,
  redis: RedisClient | null
): Router => {
  const router = Router();
  const logger = new Logger('notification-routes');

  const validate = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(
        ResponseBuilder.error('Validation failed', errors.array().map(e => e.msg).join(', '))
      );
      return;
    }
    next();
  };

  // Send notification
  router.post(
    '/',
    // authenticate,
    [
      body('notification_type').isIn(Object.values(NotificationType)).withMessage('Valid notification type is required'),
      body('user_id').isUUID().withMessage('Valid user ID is required'),
      body('template_code').notEmpty().withMessage('Template code is required'),
      body('variables').isObject().withMessage('Variables must be an object'),
      body('priority').optional().isInt({ min: 1, max: 4 }).withMessage('Priority must be between 1 and 4'),
      body('metadata').optional().isObject().withMessage('Metadata must be an object')
    ],
    validate,
    async (req: AuthRequest, res: Response) => {
      const correlationId = (req as any).correlationId;

      try {
        // Check infrastructure
        if (!rabbitMQ || !redis) {
          return res.status(503).json(
            ResponseBuilder.error('Service Unavailable', 'RabbitMQ or Redis is not connected')
          );
        }

        // Check for idempotency
        const requestId = req.body.request_id || uuidv4();
        const idempotencyKey = `idempotency:${requestId}`;
        const existing = await redis.get(idempotencyKey);

        if (existing) {
          logger.info('Duplicate request detected', correlationId, { requestId });
          return res.json(
            ResponseBuilder.success(existing, 'Notification already processed')
          );
        }

        const notificationRequest = {
          notification_type: req.body.notification_type,
          user_id: req.body.user_id,
          template_code: req.body.template_code,
          variables: req.body.variables,
          request_id: requestId,
          priority: req.body.priority || NotificationPriority.MEDIUM,
          metadata: req.body.metadata || {}
        };

        // Route to appropriate queue based on notification type
        const routingKey = notificationRequest.notification_type;
        
        await rabbitMQ.publish(
          'notifications.direct',
          routingKey,
          notificationRequest,
          correlationId
        );

        // Store idempotency record
        await redis.set(idempotencyKey, { requestId, status: 'queued' }, 3600);

        logger.info(
          `Notification queued: ${notificationRequest.notification_type}`,
          correlationId,
          { userId: notificationRequest.user_id, requestId }
        );

        res.status(202).json(
          ResponseBuilder.success(
            {
              request_id: requestId,
              status: 'queued',
              message: 'Notification has been queued for processing'
            },
            'Notification queued successfully'
          )
        );
        return;
      } catch (error: any) {
        logger.error('Failed to queue notification', error, correlationId);
        res.status(500).json(
          ResponseBuilder.error('Internal Server Error', 'Failed to queue notification')
        );
        return;
      }
    }
  );

  // Get notification status
  router.get(
    '/status/:request_id',
    // authenticate,
    [param('request_id').notEmpty().withMessage('Request ID is required')],
    validate,
    async (req: AuthRequest, res: Response) => {
      const correlationId = (req as any).correlationId;

      try {
        if (!redis) {
          return res.status(503).json(
            ResponseBuilder.error('Service Unavailable', 'Redis is not connected')
          );
        }

        const requestId = req.params.request_id;
        const statusKey = `notification:status:${requestId}`;
        const status = await redis.get(statusKey);

        if (!status) {
          return res.status(404).json(
            ResponseBuilder.error('Not Found', 'Notification status not found')
          );
        }

        res.json(
          ResponseBuilder.success(status, 'Notification status retrieved successfully')
        );
        return;
      } catch (error: any) {
        logger.error('Failed to get notification status', error, correlationId);
        res.status(500).json(
          ResponseBuilder.error('Internal Server Error', 'Failed to retrieve notification status')
        );
        return;
      }
    }
  );

  // Update notification status (for services to update status)
  router.post(
    '/status',
    [
      body('notification_id').notEmpty().withMessage('Notification ID is required'),
      body('status').isIn(['delivered', 'pending', 'failed']).withMessage('Valid status is required'),
      body('timestamp').optional().isISO8601().withMessage('Valid timestamp is required'),
      body('error').optional().isString().withMessage('Error must be a string')
    ],
    validate,
    async (req: Request, res: Response) => {
      const correlationId = (req as any).correlationId;

      try {
        if (!redis) {
          return res.status(503).json(
            ResponseBuilder.error('Service Unavailable', 'Redis is not connected')
          );
        }

        const statusUpdate = {
          notification_id: req.body.notification_id,
          status: req.body.status,
          timestamp: req.body.timestamp || new Date(),
          error: req.body.error
        };

        const statusKey = `notification:status:${statusUpdate.notification_id}`;
        await redis.set(statusKey, statusUpdate, 86400); // 24 hours

        logger.info(
          `Notification status updated to ${statusUpdate.status}`,
          correlationId,
          { notificationId: statusUpdate.notification_id }
        );

        res.json(
          ResponseBuilder.success(statusUpdate, 'Status updated successfully')
        );
        return;
      } catch (error: any) {
        logger.error('Failed to update notification status', error, correlationId);
        res.status(500).json(
          ResponseBuilder.error('Internal Server Error', 'Failed to update status')
        );
        return;
      }
    }
  );

  return router;
};
