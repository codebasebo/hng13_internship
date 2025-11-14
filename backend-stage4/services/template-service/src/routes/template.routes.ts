import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { TemplateService } from '../services/template.service';
import { ResponseBuilder } from '../../../../shared/types/response.types';
import { authenticate, AuthRequest } from '../../../../shared/middleware/auth';
import { NotificationType } from '../../../../shared/enums/notification.enum';

export const createTemplateRoutes = (templateService: TemplateService): Router => {
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

  // Create template
  router.post(
    '/',
    authenticate,
    [
      body('code').notEmpty().withMessage('Template code is required'),
      body('name').notEmpty().withMessage('Template name is required'),
      body('type').isIn(Object.values(NotificationType)).withMessage('Valid template type is required'),
      body('content').notEmpty().withMessage('Template content is required')
    ],
    validate,
    async (req: Request, res: Response) => {
      try {
        const template = await templateService.createTemplate(req.body);
        res.status(201).json(ResponseBuilder.success(template, 'Template created successfully'));
      } catch (error: any) {
        res.status(error.statusCode || 500).json(
          ResponseBuilder.error(error.message, error.message)
        );
      }
    }
  );

  // Get template by code
  router.get(
    '/code/:code',
    [
      param('code').notEmpty().withMessage('Template code is required'),
      query('language').optional().isString().withMessage('Language must be a string')
    ],
    validate,
    async (req: Request, res: Response) => {
      try {
        const language = (req.query.language as string) || 'en';
        const template = await templateService.getTemplateByCode(req.params.code, language);
        res.json(ResponseBuilder.success(template, 'Template retrieved successfully'));
      } catch (error: any) {
        res.status(error.statusCode || 500).json(
          ResponseBuilder.error(error.message, error.message)
        );
      }
    }
  );

  // Get template by ID
  router.get(
    '/:id',
    authenticate,
    [param('id').isUUID().withMessage('Valid template ID is required')],
    validate,
    async (req: AuthRequest, res: Response) => {
      try {
        const template = await templateService.getTemplateById(req.params.id);
        res.json(ResponseBuilder.success(template, 'Template retrieved successfully'));
      } catch (error: any) {
        res.status(error.statusCode || 500).json(
          ResponseBuilder.error(error.message, error.message)
        );
      }
    }
  );

  // Update template
  router.put(
    '/:id',
    authenticate,
    [param('id').isUUID().withMessage('Valid template ID is required')],
    validate,
    async (req: AuthRequest, res: Response) => {
      try {
        const template = await templateService.updateTemplate(req.params.id, req.body);
        res.json(ResponseBuilder.success(template, 'Template updated successfully'));
      } catch (error: any) {
        res.status(error.statusCode || 500).json(
          ResponseBuilder.error(error.message, error.message)
        );
      }
    }
  );

  // Delete template (soft delete)
  router.delete(
    '/:id',
    authenticate,
    [param('id').isUUID().withMessage('Valid template ID is required')],
    validate,
    async (req: AuthRequest, res: Response) => {
      try {
        await templateService.deleteTemplate(req.params.id);
        res.json(ResponseBuilder.success(null, 'Template deleted successfully'));
      } catch (error: any) {
        res.status(error.statusCode || 500).json(
          ResponseBuilder.error(error.message, error.message)
        );
      }
    }
  );

  // Render template with variables
  router.post(
    '/render/:code',
    [
      param('code').notEmpty().withMessage('Template code is required'),
      body('variables').isObject().withMessage('Variables must be an object'),
      query('language').optional().isString().withMessage('Language must be a string')
    ],
    validate,
    async (req: Request, res: Response) => {
      try {
        const language = (req.query.language as string) || 'en';
        const rendered = await templateService.renderTemplate(
          req.params.code,
          req.body.variables,
          language
        );
        res.json(ResponseBuilder.success(rendered, 'Template rendered successfully'));
      } catch (error: any) {
        res.status(error.statusCode || 500).json(
          ResponseBuilder.error(error.message, error.message)
        );
      }
    }
  );

  // List templates with pagination
  router.get(
    '/',
    authenticate,
    [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('type').optional().isIn(Object.values(NotificationType)).withMessage('Invalid template type'),
      query('language').optional().isString().withMessage('Language must be a string')
    ],
    validate,
    async (req: AuthRequest, res: Response) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const type = req.query.type as NotificationType;
        const language = req.query.language as string;
        
        const { templates, total } = await templateService.listTemplates(page, limit, type, language);
        res.json(ResponseBuilder.paginate(templates, total, page, limit, 'Templates retrieved successfully'));
      } catch (error: any) {
        res.status(error.statusCode || 500).json(
          ResponseBuilder.error(error.message, error.message)
        );
      }
    }
  );

  // Get template versions
  router.get(
    '/versions/:code',
    authenticate,
    [param('code').notEmpty().withMessage('Template code is required')],
    validate,
    async (req: AuthRequest, res: Response) => {
      try {
        const versions = await templateService.getTemplateVersions(req.params.code);
        res.json(ResponseBuilder.success(versions, 'Template versions retrieved successfully'));
      } catch (error: any) {
        res.status(error.statusCode || 500).json(
          ResponseBuilder.error(error.message, error.message)
        );
      }
    }
  );

  return router;
};
