/**
 * Service Types
 * 
 * Shared type definitions for services
 */

// Logging Service Types
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE';
export type LogLevelNumber = 0 | 1 | 2 | 3 | 4;

export interface LogMetadata {
  [key: string]: any;
}

export interface Logger {
  debug: (message: string, data?: LogMetadata) => void;
  info: (message: string, data?: LogMetadata) => void;
  warn: (message: string, data?: LogMetadata) => void;
  error: (message: string | Error, error?: Error, context?: LogMetadata) => void;
  success: (message: string, data?: LogMetadata) => void;
  apiRequest: (method: string, url: string, body?: any) => void;
  apiResponse: (method: string, url: string, status: number, data?: any) => void;
  performance: (operation: string, duration: number, metadata?: LogMetadata) => void;
}

