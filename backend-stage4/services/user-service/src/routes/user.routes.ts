import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { UserService } from '../services/user.service';
import { ResponseBuilder } from '../../../../shared/types/response.types';
import { authenticate, AuthRequest } from '../../../../shared/middleware/auth';

export const createUserRoutes = (userService: UserService): Router => {
  const router = Router();

  // Validation middleware
  const validate = (req: Request, res: Response, next: Function): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(
        ResponseBuilder.error('Validation failed', errors.array().map(e => e.msg).join(', '))
      );
      return;
    }
    next();
  };

  // Register user
  router.post(
    '/',
    [
      body('name').notEmpty().withMessage('Name is required'),
      body('email').isEmail().withMessage('Valid email is required'),
      body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
      body('preferences.email').isBoolean().withMessage('Email preference must be boolean'),
      body('preferences.push').isBoolean().withMessage('Push preference must be boolean')
    ],
    validate,
    async (req: Request, res: Response) => {
      try {
        const user = await userService.createUser(req.body);
        res.status(201).json(ResponseBuilder.success(user, 'User created successfully'));
      } catch (error: any) {
        res.status(error.statusCode || 500).json(
          ResponseBuilder.error(error.message, error.message)
        );
      }
    }
  );

  // Login
  router.post(
    '/login',
    [
      body('email').isEmail().withMessage('Valid email is required'),
      body('password').notEmpty().withMessage('Password is required')
    ],
    validate,
    async (req: Request, res: Response) => {
      try {
        const { email, password } = req.body;
        const result = await userService.login(email, password);
        res.json(ResponseBuilder.success(result, 'Login successful'));
      } catch (error: any) {
        res.status(error.statusCode || 500).json(
          ResponseBuilder.error(error.message, error.message)
        );
      }
    }
  );

  // Get user by ID
  router.get(
    '/:id',
    [param('id').isUUID().withMessage('Valid user ID is required')],
    validate,
    authenticate,
    async (req: AuthRequest, res: Response) => {
      try {
        const user = await userService.getUserById(req.params.id);
        res.json(ResponseBuilder.success(user, 'User retrieved successfully'));
      } catch (error: any) {
        res.status(error.statusCode || 500).json(
          ResponseBuilder.error(error.message, error.message)
        );
      }
    }
  );

  // Update user
  router.put(
    '/:id',
    [param('id').isUUID().withMessage('Valid user ID is required')],
    validate,
    authenticate,
    async (req: AuthRequest, res: Response) => {
      try {
        const user = await userService.updateUser(req.params.id, req.body);
        res.json(ResponseBuilder.success(user, 'User updated successfully'));
      } catch (error: any) {
        res.status(error.statusCode || 500).json(
          ResponseBuilder.error(error.message, error.message)
        );
      }
    }
  );

  // Delete user
  router.delete(
    '/:id',
    [param('id').isUUID().withMessage('Valid user ID is required')],
    validate,
    authenticate,
    async (req: AuthRequest, res: Response) => {
      try {
        await userService.deleteUser(req.params.id);
        res.json(ResponseBuilder.success(null, 'User deleted successfully'));
      } catch (error: any) {
        res.status(error.statusCode || 500).json(
          ResponseBuilder.error(error.message, error.message)
        );
      }
    }
  );

  // Get user preferences
  router.get(
    '/:id/preferences',
    [param('id').isUUID().withMessage('Valid user ID is required')],
    validate,
    authenticate,
    async (req: AuthRequest, res: Response) => {
      try {
        const preferences = await userService.getUserPreferences(req.params.id);
        res.json(ResponseBuilder.success(preferences, 'Preferences retrieved successfully'));
      } catch (error: any) {
        res.status(error.statusCode || 500).json(
          ResponseBuilder.error(error.message, error.message)
        );
      }
    }
  );

  // List users with pagination
  router.get(
    '/',
    [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],
    validate,
    authenticate,
    async (req: AuthRequest, res: Response) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        
        const { users, total } = await userService.listUsers(page, limit);
        res.json(ResponseBuilder.paginate(users, total, page, limit, 'Users retrieved successfully'));
      } catch (error: any) {
        res.status(error.statusCode || 500).json(
          ResponseBuilder.error(error.message, error.message)
        );
      }
    }
  );

  return router;
};
