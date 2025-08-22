import pino from 'pino';

// Define the shape of the options our factory function will accept
interface LoggerOptions {
  service: string;
}

export function createLogger(options: LoggerOptions) {
  const { service } = options;

  // Ensure a service name is provided.
  if (!service) {
    throw new Error('Logger requires a service name to be specified.');
  }

  // Define the transport based on the environment
  const transportConfig =
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'SYS:standard',
            colorize: true,
            ignore: 'pid,hostname',
          },
        }
      : undefined;

  // Create and return the logger instance
  const logger = pino({
    // Use the `base` option to set static metadata on every log line.
    base: {
      service: service,
    },
    level: process.env.LOG_LEVEL || 'info',
    transport: transportConfig,
  });

  return logger;
}
