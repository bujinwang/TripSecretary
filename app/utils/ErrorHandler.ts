// @ts-nocheck

/**
 * ErrorHandler - Centralized Error Handling Service
 *
 * Provides consistent error handling across the application with:
 * - Standardized error logging
 * - User-friendly error notifications
 * - Error severity levels
 * - Error recovery callbacks
 */

import { Alert } from 'react-native';

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  CRITICAL: 'critical',  // App-breaking errors, require user action
  WARNING: 'warning',    // Non-critical errors, user should be informed
  INFO: 'info',          // Informational messages, minimal user impact
  SILENT: 'silent',      // Log only, no user notification
};

/**
 * Error types for categorization
 */
export const ErrorType = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  STORAGE: 'storage',
  PERMISSION: 'permission',
  DATA_LOAD: 'data_load',
  DATA_SAVE: 'data_save',
  NAVIGATION: 'navigation',
  UNKNOWN: 'unknown',
};

/**
 * Default error messages by type
 */
const DEFAULT_ERROR_MESSAGES = {
  [ErrorType.NETWORK]: {
    title: '网络错误',
    message: '网络连接失败，请检查您的网络设置后重试。',
  },
  [ErrorType.VALIDATION]: {
    title: '验证错误',
    message: '请检查您输入的信息是否正确。',
  },
  [ErrorType.AUTHENTICATION]: {
    title: '身份验证失败',
    message: '身份验证失败，请重新尝试。',
  },
  [ErrorType.STORAGE]: {
    title: '存储错误',
    message: '数据存储失败，请稍后重试。',
  },
  [ErrorType.PERMISSION]: {
    title: '权限不足',
    message: '无法访问所需权限，请在设置中启用。',
  },
  [ErrorType.DATA_LOAD]: {
    title: '加载失败',
    message: '加载数据时出现问题，请重试。',
  },
  [ErrorType.DATA_SAVE]: {
    title: '保存失败',
    message: '保存数据时出现问题，请重试。',
  },
  [ErrorType.NAVIGATION]: {
    title: '导航错误',
    message: '无法导航到目标页面，请稍后重试。',
  },
  [ErrorType.UNKNOWN]: {
    title: '出错了',
    message: '发生了未知错误，请稍后重试。',
  },
};

/**
 * ErrorHandler class - Main error handling service
 */
class ErrorHandler {
  /**
   * Log error to console with context
   * @private
   */
  static _logError(context, error, additionalInfo = {}) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${context}]`, {
      error: error.message || error,
      stack: error.stack,
      ...additionalInfo,
    });
  }

  /**
   * Show error alert to user
   * @private
   */
  static _showErrorAlert(title, message, buttons = []) {
    Alert.alert(
      title,
      message,
      buttons.length > 0 ? buttons : [{ text: '确定', style: 'default' }],
      { cancelable: false }
    );
  }

  /**
   * Handle error with specified severity and options
   *
   * @param {Error|string} error - Error object or error message
   * @param {Object} options - Error handling options
   * @param {string} options.context - Context where error occurred (e.g., 'ThailandTravelInfo.saveData')
   * @param {ErrorSeverity} options.severity - Error severity level
   * @param {ErrorType} options.type - Error type for categorization
   * @param {string} options.customTitle - Custom error title for user notification
   * @param {string} options.customMessage - Custom error message for user notification
   * @param {Function} options.onRetry - Callback function for retry action
   * @param {Function} options.onCancel - Callback function for cancel action
   * @param {Object} options.additionalInfo - Additional info to log
   */
  static handle(error, options = {}) {
    const {
      context = 'Unknown',
      severity = ErrorSeverity.WARNING,
      type = ErrorType.UNKNOWN,
      customTitle,
      customMessage,
      onRetry,
      onCancel,
      additionalInfo = {},
    } = options;

    // Always log the error
    this._logError(context, error, { severity, type, ...additionalInfo });

    // Determine if we should show user notification based on severity
    if (severity === ErrorSeverity.SILENT) {
      return;
    }

    // Get default messages for the error type
    const defaultMessages = DEFAULT_ERROR_MESSAGES[type] || DEFAULT_ERROR_MESSAGES[ErrorType.UNKNOWN];

    // Use custom messages if provided, otherwise use defaults
    const title = customTitle || defaultMessages.title;
    const message = customMessage || defaultMessages.message;

    // Build alert buttons based on callbacks
    const buttons = [];

    if (onRetry) {
      buttons.push({
        text: '重试',
        onPress: onRetry,
        style: 'default',
      });
    }

    if (onCancel) {
      buttons.push({
        text: '取消',
        onPress: onCancel,
        style: 'cancel',
      });
    }

    // If no buttons specified, add default OK button
    if (buttons.length === 0) {
      buttons.push({
        text: '确定',
        style: 'default',
      });
    }

    // Show alert to user
    this._showErrorAlert(title, message, buttons);
  }

  /**
   * Handle network errors
   */
  static handleNetworkError(error, context, options = {}) {
    this.handle(error, {
      context,
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.WARNING,
      ...options,
    });
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(error, context, options = {}) {
    this.handle(error, {
      context,
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.INFO,
      ...options,
    });
  }

  /**
   * Handle authentication errors
   */
  static handleAuthenticationError(error, context, options = {}) {
    this.handle(error, {
      context,
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.CRITICAL,
      ...options,
    });
  }

  /**
   * Handle storage errors (save/load)
   */
  static handleStorageError(error, context, options = {}) {
    this.handle(error, {
      context,
      type: ErrorType.STORAGE,
      severity: ErrorSeverity.WARNING,
      ...options,
    });
  }

  /**
   * Handle data loading errors
   */
  static handleDataLoadError(error, context, options = {}) {
    this.handle(error, {
      context,
      type: ErrorType.DATA_LOAD,
      severity: ErrorSeverity.WARNING,
      ...options,
    });
  }

  /**
   * Handle data saving errors
   */
  static handleDataSaveError(error, context, options = {}) {
    this.handle(error, {
      context,
      type: ErrorType.DATA_SAVE,
      severity: ErrorSeverity.WARNING,
      ...options,
    });
  }

  /**
   * Handle navigation errors
   */
  static handleNavigationError(error, context, options = {}) {
    this.handle(error, {
      context,
      type: ErrorType.NAVIGATION,
      severity: ErrorSeverity.WARNING,
      ...options,
    });
  }

  /**
   * Wrap async function with error handling
   *
   * @param {Function} fn - Async function to wrap
   * @param {Object} errorOptions - Error handling options (same as handle())
   * @returns {Function} - Wrapped function with error handling
   *
   * @example
   * const loadData = ErrorHandler.wrapAsync(
   *   async () => { await fetchData(); },
   *   { context: 'MyComponent.loadData', type: ErrorType.DATA_LOAD }
   * );
   */
  static wrapAsync(fn, errorOptions = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handle(error, errorOptions);
        // Re-throw if needed for further handling
        if (errorOptions.rethrow) {
          throw error;
        }
      }
    };
  }

  /**
   * Create a try-catch wrapper for common async operations
   *
   * @param {Function} operation - Async operation to execute
   * @param {Object} options - Error handling options
   * @returns {Promise<any>} - Result of the operation or undefined if error
   *
   * @example
   * const result = await ErrorHandler.tryAsync(
   *   () => UserDataService.save(data),
   *   { context: 'SaveUserData', type: ErrorType.DATA_SAVE }
   * );
   */
  static async tryAsync(operation, options = {}) {
    try {
      return await operation();
    } catch (error) {
      this.handle(error, options);
      return undefined;
    }
  }
}

export default ErrorHandler;
