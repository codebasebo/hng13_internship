import Redis from 'ioredis';
import { Logger } from './logger';

export class RedisClient {
  private client: Redis;
  private logger: Logger;

  constructor(url: string, serviceName: string) {
    this.logger = new Logger(`${serviceName}-redis`);
    this.client = new Redis(url, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        this.logger.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
      },
      maxRetriesPerRequest: 3
    });

    this.client.on('connect', () => {
      this.logger.info('Connected to Redis');
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis error', err);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Failed to get key: ${key}`, error as Error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to set key: ${key}`, error as Error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete key: ${key}`, error as Error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check key existence: ${key}`, error as Error);
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Failed to increment key: ${key}`, error as Error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      this.logger.error(`Failed to set expiry for key: ${key}`, error as Error);
      return false;
    }
  }

  async getClient(): Promise<Redis> {
    return this.client;
  }

  async close(): Promise<void> {
    await this.client.quit();
    this.logger.info('Redis connection closed');
  }
}
