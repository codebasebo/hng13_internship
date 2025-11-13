import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, service, correlationId, ...meta }) => {
    let log = `${timestamp} [${service || 'app'}] ${level}: ${message}`;
    if (correlationId) {
      log += ` [correlation_id: ${correlationId}]`;
    }
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

export class Logger {
  private logger: winston.Logger;
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { service: serviceName },
      transports: [
        new winston.transports.Console({
          format: consoleFormat
        }),
        new winston.transports.File({
          filename: `logs/${serviceName}-error.log`,
          level: 'error'
        }),
        new winston.transports.File({
          filename: `logs/${serviceName}-combined.log`
        })
      ]
    });
  }

  private formatMessage(message: string, correlationId?: string, metadata?: any) {
    return {
      message,
      correlationId: correlationId || 'N/A',
      ...metadata
    };
  }

  info(message: string, correlationId?: string, metadata?: any) {
    this.logger.info(this.formatMessage(message, correlationId, metadata));
  }

  error(message: string, error?: Error, correlationId?: string, metadata?: any) {
    this.logger.error(this.formatMessage(message, correlationId, {
      ...metadata,
      error: error?.message,
      stack: error?.stack
    }));
  }

  warn(message: string, correlationId?: string, metadata?: any) {
    this.logger.warn(this.formatMessage(message, correlationId, metadata));
  }

  debug(message: string, correlationId?: string, metadata?: any) {
    this.logger.debug(this.formatMessage(message, correlationId, metadata));
  }

  static generateCorrelationId(): string {
    return uuidv4();
  }
}

export default Logger;
