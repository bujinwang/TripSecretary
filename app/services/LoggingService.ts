/**
 * LoggingService - Centralized logging for the application
 *
 * Provides consistent logging interface with:
 * - Component-based logging
 * - Development/production modes
 * - Error tracking integration ready
 * - Structured logging with metadata
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogData = Record<string, any> | null;

class LoggingService {
  /**
   * Log debug information (only in development)
   */
  static debug(component: string, message: string, data: LogData = null): void {
    if (__DEV__) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${component}]`;
      
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }

  /**
   * Log informational messages
   */
  static info(component: string, message: string, data: LogData = null): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${component}] ℹ️`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Log warning messages
   */
  static warn(component: string, message: string, data: LogData = null): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${component}] ⚠️`;
    
    if (data) {
      console.warn(`${prefix} ${message}`, data);
    } else {
      console.warn(`${prefix} ${message}`);
    }
  }

  /**
   * Log error messages with context
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static error(component: string, error: Error | string | any, context: LogData = null): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${component}] ❌`;
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : null;
    
    console.error(`${prefix} ${errorMessage}`);
    
    if (errorStack) {
      console.error('Stack trace:', errorStack);
    }
    
    if (context) {
      console.error('Context:', context);
    }

    // TODO: Send to error tracking service (e.g., Sentry) in production
    if (!__DEV__) {
      this.sendToErrorTracking(component, error, context);
    }
  }

  /**
   * Log success messages
   */
  static success(component: string, message: string, data: LogData = null): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${component}] ✅`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Log performance metrics
   */
  static performance(component: string, operation: string, duration: number, metadata: LogData = null): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${component}] ⏱️`;
    const durationInSeconds = (duration / 1000).toFixed(2);
    
    const message = `${operation} completed in ${durationInSeconds}s`;
    
    if (metadata) {
      console.log(`${prefix} ${message}`, metadata);
    } else {
      console.log(`${prefix} ${message}`);
    }

    // TODO: Send to analytics service in production
    if (!__DEV__) {
      this.sendToAnalytics(component, operation, duration, metadata);
    }
  }

  /**
   * Log API requests (useful for debugging)
   */
  static apiRequest(component: string, method: string, url: string, payload: LogData = null): void {
    if (__DEV__) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${component}] 🌐`;
      
      console.log(`${prefix} ${method} ${url}`);
      
      if (payload) {
        console.log('Payload:', payload);
      }
    }
  }

  /**
   * Log API responses (useful for debugging)
   */
  static apiResponse(component: string, method: string, url: string, status: number, data: LogData = null): void {
    if (__DEV__) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${component}] 🌐`;
      const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
      
      console.log(`${prefix} ${statusEmoji} ${method} ${url} - ${status}`);
      
      if (data) {
        console.log('Response:', data);
      }
    }
  }

  /**
   * Create a logger instance for a specific component
   * Useful for reducing repetition in components
   */
  static for(component: string) {
    return {
      debug: (message: string, data: LogData) => this.debug(component, message, data),
      info: (message: string, data: LogData) => this.info(component, message, data),
      warn: (message: string, data: LogData) => this.warn(component, message, data),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (error: any, context: LogData) => this.error(component, error, context),
      success: (message: string, data: LogData) => this.success(component, message, data),
      performance: (operation: string, duration: number, metadata: LogData) => 
        this.performance(component, operation, duration, metadata),
      apiRequest: (method: string, url: string, payload: LogData) => 
        this.apiRequest(component, method, url, payload),
      apiResponse: (method: string, url: string, status: number, data: LogData) => 
        this.apiResponse(component, method, url, status, data),
    };
  }

  /**
   * Send error to error tracking service
   * Placeholder for integration with Sentry, Bugsnag, etc.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static sendToErrorTracking(component: string, error: any, context: LogData): void {
    // TODO: Implement error tracking service integration
    // Example: Sentry.captureException(error, { tags: { component }, extra: context });
  }

  /**
   * Send analytics event
   * Placeholder for integration with analytics service
   */
  private static sendToAnalytics(component: string, operation: string, duration: number, metadata: LogData): void {
    // TODO: Implement analytics service integration
    // Example: Analytics.track('Performance', { component, operation, duration, ...metadata });
  }
}

export default LoggingService;
