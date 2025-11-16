// @ts-nocheck

/**
 * LoggingService - Centralized logging for the application
 *
 * Provides consistent logging interface with:
 * - Component-based logging
 * - Development/production modes
 * - Error tracking integration ready
 * - Structured logging with metadata
 */

class LoggingService {
  /**
   * Log debug information (only in development)
   *
   * @param {string} component - Component or module name
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  static debug(component, message, data = null) {
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
   *
   * @param {string} component - Component or module name
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  static info(component, message, data = null) {
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
   *
   * @param {string} component - Component or module name
   * @param {string} message - Warning message
   * @param {Object} data - Additional data to log
   */
  static warn(component, message, data = null) {
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
   *
   * @param {string} component - Component or module name
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Additional context about the error
   */
  static error(component, error, context = null) {
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

    // TODO: Send to error tracking service (e.g., Sentry) in production
    if (!__DEV__) {
      this.sendToErrorTracking(component, error, context);
    }
  }

  /**
   * Log success messages
   *
   * @param {string} component - Component or module name
   * @param {string} message - Success message
   * @param {Object} data - Additional data to log
   */
  static success(component, message, data = null) {
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
   *
   * @param {string} component - Component or module name
   * @param {string} operation - Operation being measured
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  static performance(component, operation, duration, metadata = null) {
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
   *
   * @param {string} component - Component or module name
   * @param {string} method - HTTP method
   * @param {string} url - API endpoint
   * @param {Object} payload - Request payload
   */
  static apiRequest(component, method, url, payload = null) {
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
   *
   * @param {string} component - Component or module name
   * @param {string} method - HTTP method
   * @param {string} url - API endpoint
   * @param {number} status - Response status code
   * @param {Object} data - Response data
   */
  static apiResponse(component, method, url, status, data = null) {
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
   *
   * @param {string} component - Component name
   * @returns {Object} Logger instance with bound methods
   */
  static for(component) {
    return {
      debug: (message, data) => this.debug(component, message, data),
      info: (message, data) => this.info(component, message, data),
      warn: (message, data) => this.warn(component, message, data),
      error: (error, context) => this.error(component, error, context),
      success: (message, data) => this.success(component, message, data),
      performance: (operation, duration, metadata) => 
        this.performance(component, operation, duration, metadata),
      apiRequest: (method, url, payload) => 
        this.apiRequest(component, method, url, payload),
      apiResponse: (method, url, status, data) => 
        this.apiResponse(component, method, url, status, data),
    };
  }

  /**
   * Send error to error tracking service
   * Placeholder for integration with Sentry, Bugsnag, etc.
   *
   * @param {string} component - Component name
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Additional context
   * @private
   */
  static sendToErrorTracking(component, error, context) {
    // TODO: Implement error tracking service integration
    // Example: Sentry.captureException(error, { tags: { component }, extra: context });
  }

  /**
   * Send analytics event
   * Placeholder for integration with analytics service
   *
   * @param {string} component - Component name
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional metadata
   * @private
   */
  static sendToAnalytics(component, operation, duration, metadata) {
    // TODO: Implement analytics service integration
    // Example: Analytics.track('Performance', { component, operation, duration, ...metadata });
  }
}

export default LoggingService;
