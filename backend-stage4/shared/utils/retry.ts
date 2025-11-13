import { Logger } from './logger';

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
}

export class RetryManager {
  private logger: Logger;
  private options: RetryOptions;

  constructor(
    serviceName: string,
    options: Partial<RetryOptions> = {}
  ) {
    this.logger = new Logger(`${serviceName}-retry`);
    this.options = {
      maxRetries: options.maxRetries || 3,
      initialDelay: options.initialDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      factor: options.factor || 2
    };
  }

  async executeWithRetry<T>(
    fn: () => Promise<T>,
    context?: string,
    correlationId?: string
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateDelay(attempt);
          this.logger.info(
            `Retry attempt ${attempt}/${this.options.maxRetries} after ${delay}ms${context ? ` for ${context}` : ''}`,
            correlationId
          );
          await this.sleep(delay);
        }

        return await fn();
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Attempt ${attempt + 1}/${this.options.maxRetries + 1} failed${context ? ` for ${context}` : ''}: ${lastError.message}`,
          correlationId
        );

        if (attempt === this.options.maxRetries) {
          this.logger.error(
            `All retry attempts exhausted${context ? ` for ${context}` : ''}`,
            lastError,
            correlationId
          );
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Retry failed');
  }

  private calculateDelay(attempt: number): number {
    const delay = this.options.initialDelay * Math.pow(this.options.factor, attempt - 1);
    return Math.min(delay, this.options.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
