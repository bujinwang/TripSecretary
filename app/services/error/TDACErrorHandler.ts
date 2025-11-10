/**
 * TDAC Error Handler Service
 * Comprehensive error handling, retry mechanisms, and user-friendly error reporting
 * 
 * Requirements: 5.1-5.5, 24.1-24.5
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../LoggingService';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

interface ErrorCategory {
  patterns: RegExp[];
  userMessage: string;
  recoverable: boolean;
  retryable: boolean;
}

interface ErrorCategories {
  [key: string]: ErrorCategory;
}

interface ErrorContext {
  userAgent?: string;
  submissionMethod?: string;
  [key: string]: any;
}

interface ErrorEntry {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  name?: string;
  context: ErrorContext;
  attemptNumber: number;
  userAgent: string;
  submissionMethod: string;
}

interface ErrorHandlingResult {
  category: string;
  userMessage: string;
  technicalMessage: string;
  recoverable: boolean;
  shouldRetry: boolean;
  retryDelay: number;
  attemptNumber: number;
  maxRetries: number;
  suggestions: string[];
  errorId: string;
  timestamp: string;
}

interface ErrorStatistics {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsByMethod: Record<string, number>;
  recentErrors: ErrorEntry[];
  errorRate: number;
}

interface ErrorDialog {
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    action: string;
    primary: boolean;
  }>;
  icon: string;
  severity: string;
}

interface ErrorButton {
  text: string;
  action: string;
  primary: boolean;
}

class TDACErrorHandler {
  retryConfig: RetryConfig;
  errorCategories: ErrorCategories;
  errorLog: ErrorEntry[];
  maxLogEntries: number;

  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
      backoffMultiplier: 2,
      retryableErrors: [
        'NetworkError',
        'TimeoutError',
        'CloudflareError',
        'TemporaryServerError',
        'RateLimitError'
      ]
    };

    this.errorCategories = {
      network: {
        patterns: [
          /network/i,
          /connection/i,
          /timeout/i,
          /fetch.*failed/i,
          /econnrefused/i
        ],
        userMessage: 'Network connection issue. Please check your internet connection and try again.',
        recoverable: true,
        retryable: true
      },
      
      validation: {
        patterns: [
          /validation/i,
          /invalid.*format/i,
          /required.*field/i,
          /missing.*data/i
        ],
        userMessage: 'Please check your information and ensure all required fields are filled correctly.',
        recoverable: true,
        retryable: false
      },
      
      cloudflare: {
        patterns: [
          /cloudflare/i,
          /challenge/i,
          /verification.*failed/i,
          /token.*invalid/i
        ],
        userMessage: 'Security verification failed. Please complete the verification challenge and try again.',
        recoverable: true,
        retryable: true
      },
      
      server: {
        patterns: [
          /server.*error/i,
          /internal.*error/i,
          /service.*unavailable/i,
          /502|503|504/
        ],
        userMessage: 'The TDAC service is temporarily unavailable. Please try again in a few minutes.',
        recoverable: true,
        retryable: true
      },
      
      rateLimit: {
        patterns: [
          /rate.*limit/i,
          /too.*many.*requests/i,
          /429/
        ],
        userMessage: 'Too many requests. Please wait a moment before trying again.',
        recoverable: true,
        retryable: true
      },
      
      authentication: {
        patterns: [
          /unauthorized/i,
          /authentication/i,
          /401/
        ],
        userMessage: 'Authentication failed. Please restart the submission process.',
        recoverable: true,
        retryable: false
      },
      
      business: {
        patterns: [
          /arrival.*date/i,
          /submission.*window/i,
          /already.*submitted/i,
          /duplicate/i
        ],
        userMessage: 'There is an issue with your submission data. Please review and correct the information.',
        recoverable: true,
        retryable: false
      },
      
      system: {
        patterns: [
          /out.*of.*memory/i,
          /storage.*full/i,
          /permission.*denied/i
        ],
        userMessage: 'System issue detected. Please free up storage space or restart the app.',
        recoverable: false,
        retryable: false
      }
    };

    this.errorLog = [];
    this.maxLogEntries = 100;
  }

  /**
   * Handle TDAC submission error with retry logic
   * @param {Error} error - The error that occurred
   * @param {Object} context - Context information about the operation
   * @param {number} attemptNumber - Current attempt number (0-based)
   * @returns {Object} - Error handling result with retry decision
   */
  async handleSubmissionError(error: Error, context: ErrorContext = {}, attemptNumber: number = 0): Promise<ErrorHandlingResult> {
    try {
      logger.debug('TDACErrorHandler', 'Handling TDAC submission error', {
        message: error.message,
        attempt: attemptNumber + 1,
        maxRetries: this.retryConfig.maxRetries,
        context: context
      });

      // Log the error
      await this.logError(error, context, attemptNumber);

      // Categorize the error
      const errorCategory = this.categorizeError(error);
      
      // Determine if retry is appropriate
      const shouldRetry = this.shouldRetry(error, errorCategory, attemptNumber);
      
      // Calculate retry delay if retrying
      const retryDelay = shouldRetry ? this.calculateRetryDelay(attemptNumber) : 0;

      const result: ErrorHandlingResult = {
        category: errorCategory.name,
        userMessage: errorCategory.userMessage,
        technicalMessage: error.message,
        recoverable: errorCategory.recoverable,
        shouldRetry: shouldRetry,
        retryDelay: retryDelay,
        attemptNumber: attemptNumber + 1,
        maxRetries: this.retryConfig.maxRetries,
        suggestions: this.getRecoverySuggestions(errorCategory, error, context),
        errorId: this.generateErrorId(),
        timestamp: new Date().toISOString()
      };

      logger.debug('TDACErrorHandler', 'Error handling result', {
        category: result.category,
        shouldRetry: result.shouldRetry,
        retryDelay: result.retryDelay,
        recoverable: result.recoverable
      });

      return result;

    } catch (handlingError: any) {
      logger.error('TDACErrorHandler', 'Error in error handler', { error: handlingError });
      
      // Fallback error handling
      return {
        category: 'system',
        userMessage: 'An unexpected error occurred. Please try again or contact support.',
        technicalMessage: error.message,
        recoverable: false,
        shouldRetry: false,
        retryDelay: 0,
        attemptNumber: attemptNumber + 1,
        maxRetries: this.retryConfig.maxRetries,
        suggestions: ['Restart the app', 'Check internet connection', 'Contact support'],
        errorId: this.generateErrorId(),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Categorize error based on patterns
   */
  categorizeError(error: Error): ErrorCategory & { name: string } {
    const errorMessage = error.message || error.toString();
    
    for (const [categoryName, category] of Object.entries(this.errorCategories)) {
      for (const pattern of category.patterns) {
        if (pattern.test(errorMessage)) {
          return {
            name: categoryName,
            ...category
          };
        }
      }
    }

    // Default category for unknown errors
    return {
      name: 'unknown',
      userMessage: 'An unexpected error occurred. Please try again.',
      recoverable: true,
      retryable: true,
      patterns: []
    };
  }

  /**
   * Determine if operation should be retried
   */
  shouldRetry(error: Error, errorCategory: ErrorCategory & { name: string }, attemptNumber: number): boolean {
    // Don't retry if max attempts reached
    if (attemptNumber >= this.retryConfig.maxRetries) {
      return false;
    }

    // Don't retry if error category is not retryable
    if (!errorCategory.retryable) {
      return false;
    }

    // Check if error type is in retryable list
    const errorType = error.name || error.constructor.name;
    if (this.retryConfig.retryableErrors.includes(errorType)) {
      return true;
    }

    // Check specific error patterns that should be retried
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /cloudflare/i,
      /server.*error/i,
      /rate.*limit/i,
      /502|503|504/
    ];

    return retryablePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attemptNumber: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attemptNumber),
      this.retryConfig.maxDelay
    );
    
    // Add jitter to prevent thundering herd (but ensure we don't exceed maxDelay)
    const jitter = Math.random() * 0.1 * delay;
    const finalDelay = Math.floor(delay + jitter);
    
    // Ensure we never exceed maxDelay even with jitter
    return Math.min(finalDelay, this.retryConfig.maxDelay);
  }

  /**
   * Get recovery suggestions based on error category
   */
  getRecoverySuggestions(errorCategory: ErrorCategory & { name: string }, error: Error, context: ErrorContext): string[] {
    const suggestions: string[] = [];

    switch (errorCategory.name) {
      case 'network':
        suggestions.push(
          'Check your internet connection',
          'Try switching between WiFi and mobile data',
          'Move to an area with better signal'
        );
        break;

      case 'validation':
        suggestions.push(
          'Review all required fields',
          'Check date formats (YYYY-MM-DD)',
          'Ensure passport number is correct',
          'Verify arrival date is within 72 hours'
        );
        break;

      case 'cloudflare':
        suggestions.push(
          'Complete the security verification',
          'Try using a different browser or method',
          'Clear app cache and try again'
        );
        break;

      case 'server':
        suggestions.push(
          'Wait a few minutes and try again',
          'Check TDAC service status',
          'Try during off-peak hours'
        );
        break;

      case 'rateLimit':
        suggestions.push(
          'Wait 5-10 minutes before retrying',
          'Avoid multiple simultaneous submissions',
          'Try again during off-peak hours'
        );
        break;

      case 'authentication':
        suggestions.push(
          'Restart the submission process',
          'Clear app data and login again',
          'Check system time is correct'
        );
        break;

      case 'business':
        suggestions.push(
          'Check arrival date is correct',
          'Ensure submission is within allowed window',
          'Verify this card hasn\'t been submitted before'
        );
        break;

      case 'system':
        suggestions.push(
          'Restart the app',
          'Free up device storage space',
          'Update the app to latest version'
        );
        break;

      default:
        suggestions.push(
          'Try again in a few minutes',
          'Restart the app',
          'Contact support if problem persists'
        );
    }

    return suggestions;
  }

  /**
   * Log error for debugging and analytics
   */
  async logError(error: Error, context: ErrorContext, attemptNumber: number): Promise<void> {
    try {
      const errorEntry: ErrorEntry = {
        id: this.generateErrorId(),
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        name: error.name,
        context: context,
        attemptNumber: attemptNumber,
        userAgent: context.userAgent || 'unknown',
        submissionMethod: context.submissionMethod || 'unknown'
      };

      // Add to in-memory log
      this.errorLog.unshift(errorEntry);
      
      // Keep log size manageable
      if (this.errorLog.length > this.maxLogEntries) {
        this.errorLog = this.errorLog.slice(0, this.maxLogEntries);
      }

      // Persist to AsyncStorage for debugging
      await AsyncStorage.setItem('tdac_error_log', JSON.stringify(this.errorLog));

      logger.debug('TDACErrorHandler', 'Error logged', {
        id: errorEntry.id,
        message: errorEntry.message,
        attempt: attemptNumber + 1
      });

    } catch (loggingError: any) {
      logger.error('TDACErrorHandler', 'Failed to log error', { error: loggingError });
    }
  }

  /**
   * Generate unique error ID
   */
  generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStatistics(): ErrorStatistics {
    const stats: ErrorStatistics = {
      totalErrors: this.errorLog.length,
      errorsByCategory: {},
      errorsByMethod: {},
      recentErrors: this.errorLog.slice(0, 10),
      errorRate: 0
    };

    // Count errors by category and method
    for (const error of this.errorLog) {
      const category = this.categorizeError({ message: error.message } as Error).name;
      stats.errorsByCategory[category] = (stats.errorsByCategory[category] || 0) + 1;
      
      const method = error.context?.submissionMethod || 'unknown';
      stats.errorsByMethod[method] = (stats.errorsByMethod[method] || 0) + 1;
    }

    // Calculate error rate (errors in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = this.errorLog.filter(error => 
      new Date(error.timestamp) > oneHourAgo
    );
    stats.errorRate = recentErrors.length;

    return stats;
  }

  /**
   * Clear error log
   */
  async clearErrorLog(): Promise<void> {
    try {
      this.errorLog = [];
      await AsyncStorage.removeItem('tdac_error_log');
      logger.debug('TDACErrorHandler', 'Error log cleared');
    } catch (error: any) {
      logger.error('TDACErrorHandler', 'Failed to clear error log', { error });
    }
  }

  /**
   * Export error log for support
   */
  async exportErrorLog(): Promise<string | null> {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        deviceInfo: {
          platform: 'react-native',
          // Add more device info as needed
        },
        errors: this.errorLog,
        statistics: this.getErrorStatistics()
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error: any) {
      logger.error('TDACErrorHandler', 'Failed to export error log', { error });
      return null;
    }
  }

  /**
   * Create user-friendly error dialog data
   */
  createErrorDialog(errorResult: ErrorHandlingResult): ErrorDialog {
    return {
      title: this.getErrorTitle(errorResult.category),
      message: errorResult.userMessage,
      buttons: this.getErrorButtons(errorResult),
      icon: this.getErrorIcon(errorResult.category),
      severity: this.getErrorSeverity(errorResult.category)
    };
  }

  /**
   * Get error dialog title
   */
  getErrorTitle(category: string): string {
    const titles: Record<string, string> = {
      network: 'Connection Issue',
      validation: 'Information Required',
      cloudflare: 'Security Verification',
      server: 'Service Unavailable',
      rateLimit: 'Please Wait',
      authentication: 'Authentication Error',
      business: 'Submission Issue',
      system: 'System Error',
      unknown: 'Unexpected Error'
    };

    return titles[category] || 'Error';
  }

  /**
   * Get error dialog buttons
   */
  getErrorButtons(errorResult: ErrorHandlingResult): ErrorButton[] {
    const buttons: ErrorButton[] = [];

    if (errorResult.shouldRetry) {
      buttons.push({
        text: `Retry (${errorResult.retryDelay / 1000}s)`,
        action: 'retry',
        primary: true
      });
    }

    if (errorResult.recoverable) {
      buttons.push({
        text: 'Try Different Method',
        action: 'alternative',
        primary: false
      });
    }

    buttons.push({
      text: 'Cancel',
      action: 'cancel',
      primary: false
    });

    if (errorResult.category === 'system' || !errorResult.recoverable) {
      buttons.push({
        text: 'Contact Support',
        action: 'support',
        primary: false
      });
    }

    return buttons;
  }

  /**
   * Get error icon
   */
  getErrorIcon(category: string): string {
    const icons: Record<string, string> = {
      network: '📶',
      validation: '📝',
      cloudflare: '🔐',
      server: '🔧',
      rateLimit: '⏰',
      authentication: '🔑',
      business: '📋',
      system: '⚠️',
      unknown: '❓'
    };

    return icons[category] || '❌';
  }

  /**
   * Get error severity level
   */
  getErrorSeverity(category: string): string {
    const severities: Record<string, string> = {
      network: 'warning',
      validation: 'info',
      cloudflare: 'warning',
      server: 'error',
      rateLimit: 'warning',
      authentication: 'error',
      business: 'warning',
      system: 'critical',
      unknown: 'error'
    };

    return severities[category] || 'error';
  }
}

export default new TDACErrorHandler();


