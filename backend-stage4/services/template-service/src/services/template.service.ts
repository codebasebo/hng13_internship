import Handlebars from 'handlebars';
import { Template } from '../models';
import { RedisClient } from '../../../../shared/utils/redis';
import { Logger } from '../../../../shared/utils/logger';
import { AppError } from '../../../../shared/middleware/error-handler';
import { NotificationType } from '../../../../shared/enums/notification.enum';

export interface CreateTemplateRequest {
  code: string;
  name: string;
  type: NotificationType;
  subject?: string;
  content: string;
  language?: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  subject?: string;
  content?: string;
  language?: string;
  is_active?: boolean;
}

export class TemplateService {
  private redis: RedisClient;
  private logger: Logger;

  constructor(redis: RedisClient) {
    this.redis = redis;
    this.logger = new Logger('template-service');
  }

  async createTemplate(data: CreateTemplateRequest): Promise<any> {
    try {
      // Check if template code already exists
      const existing = await Template.findOne({ where: { code: data.code } });
      if (existing) {
        throw new AppError('Template with this code already exists', 400);
      }

      // Validate template content
      try {
        Handlebars.compile(data.content);
        if (data.subject) {
          Handlebars.compile(data.subject);
        }
      } catch (error) {
        throw new AppError('Invalid template syntax', 400);
      }

      const template = await Template.create({
        code: data.code,
        name: data.name,
        type: data.type,
        subject: data.subject,
        content: data.content,
        language: data.language || 'en',
        version: 1,
        is_active: true
      });

      // Cache the template
      await this.cacheTemplate(template);

      this.logger.info(`Template created: ${template.code}`);
      return template.toJSON();
    } catch (error) {
      this.logger.error('Failed to create template', error as Error);
      throw error;
    }
  }

  async getTemplateByCode(code: string, language: string = 'en'): Promise<any> {
    try {
      // Try cache first
      const cacheKey = `template:${code}:${language}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Get from database
      const template = await Template.findOne({
        where: { code, language, is_active: true }
      });

      if (!template) {
        throw new AppError('Template not found', 404);
      }

      // Cache it
      await this.cacheTemplate(template);

      return template.toJSON();
    } catch (error) {
      this.logger.error(`Failed to get template ${code}`, error as Error);
      throw error;
    }
  }

  async getTemplateById(id: string): Promise<any> {
    try {
      const template = await Template.findByPk(id);
      if (!template) {
        throw new AppError('Template not found', 404);
      }
      return template.toJSON();
    } catch (error) {
      this.logger.error(`Failed to get template ${id}`, error as Error);
      throw error;
    }
  }

  async updateTemplate(id: string, data: UpdateTemplateRequest): Promise<any> {
    try {
      const template = await Template.findByPk(id);
      if (!template) {
        throw new AppError('Template not found', 404);
      }

      // Validate template content if being updated
      if (data.content) {
        try {
          Handlebars.compile(data.content);
        } catch (error) {
          throw new AppError('Invalid template content syntax', 400);
        }
      }

      if (data.subject) {
        try {
          Handlebars.compile(data.subject);
        } catch (error) {
          throw new AppError('Invalid template subject syntax', 400);
        }
      }

      // Create new version if content changes
      if (data.content && data.content !== template.content) {
        // Deactivate old version
        template.is_active = false;
        await template.save();

        // Create new version
        const newVersion = await Template.create({
          code: template.code,
          name: data.name || template.name,
          type: template.type,
          subject: data.subject || template.subject,
          content: data.content,
          language: data.language || template.language,
          version: template.version + 1,
          is_active: true
        });

        // Update cache
        await this.cacheTemplate(newVersion);

        this.logger.info(`Template version created: ${newVersion.code} v${newVersion.version}`);
        return newVersion.toJSON();
      } else {
        // Update current version
        await template.update(data);

        // Update cache
        await this.cacheTemplate(template);

        this.logger.info(`Template updated: ${template.code}`);
        return template.toJSON();
      }
    } catch (error) {
      this.logger.error(`Failed to update template ${id}`, error as Error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      const template = await Template.findByPk(id);
      if (!template) {
        throw new AppError('Template not found', 404);
      }

      // Soft delete by deactivating
      template.is_active = false;
      await template.save();

      // Remove from cache
      const cacheKey = `template:${template.code}:${template.language}`;
      await this.redis.delete(cacheKey);

      this.logger.info(`Template deactivated: ${template.code}`);
    } catch (error) {
      this.logger.error(`Failed to delete template ${id}`, error as Error);
      throw error;
    }
  }

  async renderTemplate(code: string, variables: any, language: string = 'en'): Promise<{ subject?: string; content: string }> {
    try {
      const template = await this.getTemplateByCode(code, language);

      const contentTemplate = Handlebars.compile(template.content);
      const renderedContent = contentTemplate(variables);

      let renderedSubject: string | undefined;
      if (template.subject) {
        const subjectTemplate = Handlebars.compile(template.subject);
        renderedSubject = subjectTemplate(variables);
      }

      return {
        subject: renderedSubject,
        content: renderedContent
      };
    } catch (error) {
      this.logger.error(`Failed to render template ${code}`, error as Error);
      throw error;
    }
  }

  async listTemplates(
    page: number = 1,
    limit: number = 10,
    type?: NotificationType,
    language?: string
  ): Promise<{ templates: any[]; total: number }> {
    try {
      const where: any = { is_active: true };
      if (type) where.type = type;
      if (language) where.language = language;

      const offset = (page - 1) * limit;
      const { count, rows } = await Template.findAndCountAll({
        where,
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      return {
        templates: rows.map(t => t.toJSON()),
        total: count
      };
    } catch (error) {
      this.logger.error('Failed to list templates', error as Error);
      throw error;
    }
  }

  async getTemplateVersions(code: string): Promise<any[]> {
    try {
      const versions = await Template.findAll({
        where: { code },
        order: [['version', 'DESC']]
      });

      return versions.map(v => v.toJSON());
    } catch (error) {
      this.logger.error(`Failed to get versions for template ${code}`, error as Error);
      throw error;
    }
  }

  private async cacheTemplate(template: any): Promise<void> {
    const cacheKey = `template:${template.code}:${template.language}`;
    await this.redis.set(cacheKey, template.toJSON(), 3600); // 1 hour TTL
  }
}
