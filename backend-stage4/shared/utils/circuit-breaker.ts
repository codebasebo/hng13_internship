import { Logger } from './logger';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();
  private logger: Logger;
  private options: CircuitBreakerOptions;

  constructor(
    private name: string,
    options: Partial<CircuitBreakerOptions> = {}
  ) {
    this.logger = new Logger(`circuit-breaker-${name}`);
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 2,
      timeout: options.timeout || 60000,
      resetTimeout: options.resetTimeout || 30000
    };
  }

  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        this.logger.warn(`Circuit breaker '${this.name}' is OPEN`);
        if (fallback) {
          return fallback();
        }
        throw new Error(`Circuit breaker '${this.name}' is OPEN`);
      }
      // Try to close the circuit
      this.state = CircuitState.HALF_OPEN;
      this.logger.info(`Circuit breaker '${this.name}' is now HALF_OPEN`);
    }

    try {
      const result = await this.callWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }

  private async callWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout after ${this.options.timeout}ms`)),
          this.options.timeout
        )
      )
    ]);
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        this.logger.info(`Circuit breaker '${this.name}' is now CLOSED`);
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.resetTimeout;
      this.logger.error(
        `Circuit breaker '${this.name}' is now OPEN after ${this.failureCount} failures`
      );
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.logger.info(`Circuit breaker '${this.name}' has been reset`);
  }
}
