/**
 * LoggingService - Centralized logging for the application
 *
 * Provides consistent logging interface with:
 * - Component-based logging
 * - Environment-based log levels (DEBUG, INFO, WARN, ERROR)
 * - Production-safe (no debug logs in production)
 * - Error tracking integration ready
 * - Structured logging with metadata
 */

import type { LogLevel, LogLevelNumber, LogMetadata, Logger } from '../types/services';

// Declare global __DEV__ for React Native
declare const __DEV__: boolean;

// Log levels
const LOG_LEVELS: Record<string, LogLevelNumber> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
} as const;

class LoggingService {
  // Current log level (defaults based on __DEV__)
  private static _logLevel: LogLevelNumber = __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
  
  /**
   * Set log level programmatically (useful for testing or runtime configuration)
   */
  static setLogLevel(level: LogLevel | LogLevelNumber): void {
    if (typeof level === 'string') {
      this._logLevel = (LOG_LEVELS[level.toUpperCase()] as LogLevelNumber) || LOG_LEVELS.INFO;
    } else {
      this._logLevel = level;
    }
  }
  
  /**
   * Get current log level
   */
  static getLogLevel(): LogLevelNumber {
    return this._logLevel;
  }
  
  /**
   * Check if a log level should be output
   */
  private static _shouldLog(level: LogLevelNumber): boolean {
    return level >= this._logLevel;
  }
  
  /**
   * Internal logging method that respects log levels
   */
  private static _log(
    level: LogLevelNumber,
    component: string,
    message: string,
    data: LogMetadata | null = null,
    consoleMethod: 'log' | 'warn' | 'error' = 'log'
  ): void {
    if (!this._shouldLog(level)) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${component}]`;
    
    if (data) {
      console[consoleMethod](`${prefix} ${message}`, data);
    } else {
      console[consoleMethod](`${prefix} ${message}`);
    }
  }

  /**
   * Log debug information (only in development or if DEBUG level enabled)
   */
  static debug(component: string, message: string, data: LogMetadata | null = null): void {
    this._log(LOG_LEVELS.DEBUG, component, message, data, 'log');
  }

  /**
   * Log informational messages
   */
  static info(component: string, message: string, data: LogMetadata | null = null): void {
    this._log(LOG_LEVELS.INFO, component, `ℹ️ ${message}`, data, 'log');
  }

  /**
   * Log warning messages
   */
  static warn(component: string, message: string, data: LogMetadata | null = null): void {
    this._log(LOG_LEVELS.WARN, component, `⚠️ ${message}`, data, 'warn');
  }

  /**
   * Log error messages with context
   */
  static error(component: string, error: Error | string, context: LogMetadata | null = null): void {
    if (!this._shouldLog(LOG_LEVELS.ERROR)) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${component}] ❌`;
    
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : null;
    
    console.error(`${prefix} ${errorMessage}`);
    
    if (errorStack) {
      console.error('Stack trace:', errorStack);
    }
    
    if (context) {
      console.error('Context:', context);
    }

    // Send to error tracking service (e.g., Sentry) in production
    if (!__DEV__) {
      this.sendToErrorTracking(component, error, context);
    }
  }

  /**
   * Log success messages
   */
  static success(component: string, message: string, data: LogMetadata | null = null): void {
    this._log(LOG_LEVELS.INFO, component, `✅ ${message}`, data, 'log');
  }

  /**
   * Log performance metrics
   */
  static performance(
    component: string,
    operation: string,
    duration: number,
    metadata: LogMetadata | null = null
  ): void {
    const durationInSeconds = (duration / 1000).toFixed(2);
    const message = `⏱️ ${operation} completed in ${durationInSeconds}s`;
    
    this._log(LOG_LEVELS.INFO, component, message, metadata, 'log');

    // Send to analytics service in production
    if (!__DEV__) {
      this.sendToAnalytics(component, operation, duration, metadata);
    }
  }

  /**
   * Log API requests (useful for debugging)
   */
  static apiRequest(component: string, method: string, url: string, payload: any = null): void {
    const message = `🌐 ${method} ${url}`;
    this._log(LOG_LEVELS.DEBUG, component, message, payload ? { payload } : null, 'log');
  }

  /**
   * Log API responses (useful for debugging)
   */
  static apiResponse(
    component: string,
    method: string,
    url: string,
    status: number,
    data: any = null
  ): void {
    const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
    const message = `🌐 ${statusEmoji} ${method} ${url} - ${status}`;
    
    this._log(LOG_LEVELS.DEBUG, component, message, data ? { response: data } : null, 'log');
  }

  /**
   * Create a logger instance for a specific component
   * Useful for reducing repetition in components
   */
  static for(component: string): Logger {
    return {
      debug: (message: string, data?: LogMetadata) => this.debug(component, message, data || null),
      info: (message: string, data?: LogMetadata) => this.info(component, message, data || null),
      warn: (message: string, data?: LogMetadata) => this.warn(component, message, data || null),
      error: (error: string | Error, context?: LogMetadata) => 
        this.error(component, error, context || null),
      success: (message: string, data?: LogMetadata) => 
        this.success(component, message, data || null),
      performance: (operation: string, duration: number, metadata?: LogMetadata) => 
        this.performance(component, operation, duration, metadata || null),
      apiRequest: (method: string, url: string, body?: any) => 
        this.apiRequest(component, method, url, body),
      apiResponse: (method: string, url: string, status: number, data?: any) => 
        this.apiResponse(component, method, url, status, data),
    };
  }

  /**
   * Send error to error tracking service
   * Placeholder for integration with Sentry, Bugsnag, etc.
   */
  private static sendToErrorTracking(
    component: string,
    error: Error | string,
    context: LogMetadata | null
  ): void {
    // TODO: Implement error tracking service integration
    // Example: Sentry.captureException(error, { tags: { component }, extra: context });
  }

  /**
   * Send analytics event
   * Placeholder for integration with analytics service
   */
  private static sendToAnalytics(
    component: string,
    operation: string,
    duration: number,
    metadata: LogMetadata | null
  ): void {
    // TODO: Implement analytics service integration
    // Example: Analytics.track('Performance', { component, operation, duration, ...metadata });
  }
}

// Export log levels for external use
(LoggingService as any).LOG_LEVELS = LOG_LEVELS;

export default LoggingService;

