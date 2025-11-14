import { Logger } from './logger';

interface MetricData {
  count: number;
  totalTime: number;
  errors: number;
  lastUpdated: Date;
}

interface Metrics {
  [key: string]: MetricData;
}

export class MetricsTracker {
  private metrics: Metrics = {};
  private logger: Logger;

  constructor(serviceName: string) {
    this.logger = new Logger(`metrics-${serviceName}`);
    
    // Log metrics every 60 seconds
    setInterval(() => this.logMetrics(), 60000);
  }

  /**
   * Record a successful operation
   */
  recordSuccess(operation: string, duration: number): void {
    this.ensureMetric(operation);
    this.metrics[operation].count++;
    this.metrics[operation].totalTime += duration;
    this.metrics[operation].lastUpdated = new Date();
  }

  /**
   * Record a failed operation
   */
  recordError(operation: string, duration: number = 0): void {
    this.ensureMetric(operation);
    this.metrics[operation].errors++;
    if (duration > 0) {
      this.metrics[operation].totalTime += duration;
    }
    this.metrics[operation].lastUpdated = new Date();
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(operation: string): MetricData | null {
    return this.metrics[operation] || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Metrics {
    return { ...this.metrics };
  }

  /**
   * Get average response time for an operation
   */
  getAverageTime(operation: string): number {
    const metric = this.metrics[operation];
    if (!metric || metric.count === 0) return 0;
    return metric.totalTime / metric.count;
  }

  /**
   * Get error rate for an operation
   */
  getErrorRate(operation: string): number {
    const metric = this.metrics[operation];
    if (!metric || metric.count === 0) return 0;
    const total = metric.count + metric.errors;
    return (metric.errors / total) * 100;
  }

  /**
   * Reset metrics for an operation
   */
  resetMetrics(operation: string): void {
    if (this.metrics[operation]) {
      delete this.metrics[operation];
    }
  }

  /**
   * Reset all metrics
   */
  resetAllMetrics(): void {
    this.metrics = {};
  }

  /**
   * Log current metrics
   */
  private logMetrics(): void {
    const summary: any = {};
    
    for (const [operation, data] of Object.entries(this.metrics)) {
      const total = data.count + data.errors;
      const avgTime = data.count > 0 ? (data.totalTime / data.count).toFixed(2) : 0;
      const errorRate = total > 0 ? ((data.errors / total) * 100).toFixed(2) : 0;
      
      summary[operation] = {
        total_operations: total,
        successful: data.count,
        failed: data.errors,
        avg_time_ms: avgTime,
        error_rate_percent: errorRate,
        last_updated: data.lastUpdated
      };
    }

    if (Object.keys(summary).length > 0) {
      this.logger.info('Metrics Summary', undefined, summary);
    }
  }

  /**
   * Ensure a metric exists
   */
  private ensureMetric(operation: string): void {
    if (!this.metrics[operation]) {
      this.metrics[operation] = {
        count: 0,
        totalTime: 0,
        errors: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Middleware to track HTTP request metrics
   */
  trackRequest(operation: string) {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();

      // Track when response finishes
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        if (res.statusCode >= 200 && res.statusCode < 400) {
          this.recordSuccess(operation, duration);
        } else if (res.statusCode >= 400) {
          this.recordError(operation, duration);
        }
      });

      next();
    };
  }

  /**
   * Create a timer for manual tracking
   */
  startTimer(): { stop: () => number } {
    const startTime = Date.now();
    return {
      stop: () => Date.now() - startTime
    };
  }
}

// Singleton instances for each service
const trackers: { [key: string]: MetricsTracker } = {};

export function getMetricsTracker(serviceName: string): MetricsTracker {
  if (!trackers[serviceName]) {
    trackers[serviceName] = new MetricsTracker(serviceName);
  }
  return trackers[serviceName];
}
