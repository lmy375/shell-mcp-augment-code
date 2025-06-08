import winston from 'winston';

export class Logger {
  private static instance: winston.Logger;

  public static getInstance(level: string = 'info'): winston.Logger {
    if (!Logger.instance) {
      Logger.instance = winston.createLogger({
        level,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
          winston.format.printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}${stack ? '\n' + stack : ''}`;
          })
        ),
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          })
        ]
      });
    }
    return Logger.instance;
  }

  public static setLevel(level: string): void {
    if (Logger.instance) {
      Logger.instance.level = level;
    }
  }
}

export const logger = Logger.getInstance();
