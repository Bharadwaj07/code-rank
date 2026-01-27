import { config } from '../config/config';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

type LogLevel = keyof typeof LOG_LEVELS;

const currentLogLevel = LOG_LEVELS[config.app.logLevel as LogLevel] || LOG_LEVELS.info;

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatLog(level: string, message: string, data?: any): string {
  const timestamp = formatTimestamp();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (data) {
    return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
  }
  
  return `${prefix} ${message}`;
}

export const logger = {
  error(message: string, error?: any) {
    if (LOG_LEVELS.error <= currentLogLevel) {
      console.error(formatLog('error', message, error));
    }
  },

  warn(message: string, data?: any) {
    if (LOG_LEVELS.warn <= currentLogLevel) {
      console.warn(formatLog('warn', message, data));
    }
  },

  info(message: string, data?: any) {
    if (LOG_LEVELS.info <= currentLogLevel) {
      console.log(formatLog('info', message, data));
    }
  },

  debug(message: string, data?: any) {
    if (LOG_LEVELS.debug <= currentLogLevel) {
      console.debug(formatLog('debug', message, data));
    }
  },
};
