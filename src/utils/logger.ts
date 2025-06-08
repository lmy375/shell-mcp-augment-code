import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'shell-mcp' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// If we're not in production then log to the `debug.log` file.
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'debug.log',
    level: 'debug'
  }));
}

export default logger;
