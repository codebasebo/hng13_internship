import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { RedisClient } from '../../../../shared/utils/redis';
import { Logger } from '../../../../shared/utils/logger';
import { AppError } from '../../../../shared/middleware/error-handler';
import { CreateUserRequest, UpdateUserRequest } from '../../../../shared/types/notification.types';

export class UserService {
  private redis: RedisClient;
  private logger: Logger;

  constructor(redis: RedisClient) {
    this.redis = redis;
    this.logger = new Logger('user-service');
  }

  async createUser(data: CreateUserRequest): Promise<any> {
    try {
      // Check if user exists
      const existingUser = await User.findOne({ where: { email: data.email } });
      if (existingUser) {
        throw new AppError('User with this email already exists', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user
      const user = await User.create({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        push_token: data.push_token,
        email_preference: data.preferences.email,
        push_preference: data.preferences.push
      });

      // Cache user preferences
      await this.cacheUserPreferences(user.id, {
        email: user.email_preference,
        push: user.push_preference
      });

      return this.sanitizeUser(user);
    } catch (error) {
      this.logger.error('Failed to create user', error as Error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<any> {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      return this.sanitizeUser(user);
    } catch (error) {
      this.logger.error(`Failed to get user ${id}`, error as Error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<any> {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new AppError('User not found', 404);
      }
      return this.sanitizeUser(user);
    } catch (error) {
      this.logger.error(`Failed to get user by email ${email}`, error as Error);
      throw error;
    }
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<any> {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      await user.update({
        name: data.name || user.name,
        email: data.email || user.email,
        push_token: data.push_token !== undefined ? data.push_token : user.push_token,
        email_preference: data.preferences?.email !== undefined ? data.preferences.email : user.email_preference,
        push_preference: data.preferences?.push !== undefined ? data.preferences.push : user.push_preference
      });

      // Update cache
      await this.cacheUserPreferences(user.id, {
        email: user.email_preference,
        push: user.push_preference
      });

      return this.sanitizeUser(user);
    } catch (error) {
      this.logger.error(`Failed to update user ${id}`, error as Error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      await user.destroy();
      await this.redis.delete(`user:preferences:${id}`);
      
      this.logger.info(`User ${id} deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete user ${id}`, error as Error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new AppError('Invalid credentials', 401);
      }

      const token = (jwt as any).sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRY || '24h' }
      );

      return {
        user: this.sanitizeUser(user),
        token
      };
    } catch (error) {
      this.logger.error('Login failed', error as Error);
      throw error;
    }
  }

  async getUserPreferences(userId: string): Promise<any> {
    try {
      // Try cache first
      const cached = await this.redis.get(`user:preferences:${userId}`);
      if (cached) {
        return cached;
      }

      // Get from database
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const preferences = {
        email: user.email_preference,
        push: user.push_preference
      };

      // Cache it
      await this.cacheUserPreferences(userId, preferences);

      return preferences;
    } catch (error) {
      this.logger.error(`Failed to get preferences for user ${userId}`, error as Error);
      throw error;
    }
  }

  private async cacheUserPreferences(userId: string, preferences: any): Promise<void> {
    await this.redis.set(`user:preferences:${userId}`, preferences, 3600); // 1 hour TTL
  }

  private sanitizeUser(user: any): any {
    const { password, ...sanitized } = user.toJSON();
    return {
      ...sanitized,
      preferences: {
        email: sanitized.email_preference,
        push: sanitized.push_preference
      }
    };
  }

  async listUsers(page: number = 1, limit: number = 10): Promise<{ users: any[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      const { count, rows } = await User.findAndCountAll({
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      return {
        users: rows.map(user => this.sanitizeUser(user)),
        total: count
      };
    } catch (error) {
      this.logger.error('Failed to list users', error as Error);
      throw error;
    }
  }
}
