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
} as const;

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
} as const;

type ErrorSeverityValue = (typeof ErrorSeverity)[keyof typeof ErrorSeverity];
type ErrorTypeValue = (typeof ErrorType)[keyof typeof ErrorType];

interface ErrorHandlerOptions {
  context?: string;
  severity?: ErrorSeverityValue;
  type?: ErrorTypeValue;
  customTitle?: string;
  customMessage?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  additionalInfo?: Record<string, unknown>;
  rethrow?: boolean;
}

interface DefaultMessage {
  title: string;
  message: string;
}

/**
 * Default error messages by type
 */
const DEFAULT_ERROR_MESSAGES: Record<string, DefaultMessage> = {
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

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * ErrorHandler class - Main error handling service
 */
class ErrorHandler {
  /**
   * Log error to console with context
   * @private
   */
  static _logError(context: string, error: Error | string, additionalInfo: Record<string, unknown> = {}): void {
    const timestamp = new Date().toISOString();
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[${timestamp}] [${context}]`, {
      error: err.message || error,
      stack: err.stack,
      ...additionalInfo,
    });
  }

  /**
   * Show error alert to user
   * @private
   */
  static _showErrorAlert(title: string, message: string, buttons: AlertButton[] = []): void {
    Alert.alert(
      title,
      message,
      buttons.length > 0 ? buttons : [{ text: '确定', style: 'default' }],
      { cancelable: false }
    );
  }

  /**
   * Handle error with specified severity and options
   */
  static handle(error: Error | string, options: ErrorHandlerOptions = {}): void {
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
    const defaultMessages = DEFAULT_ERROR_MESSAGES[type as string] || DEFAULT_ERROR_MESSAGES[ErrorType.UNKNOWN];

    // Use custom messages if provided, otherwise use defaults
    const title = customTitle || defaultMessages.title;
    const message = customMessage || defaultMessages.message;

    // Build alert buttons based on callbacks
    const buttons: AlertButton[] = [];

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

  /** Handle network errors */
  static handleNetworkError(error: Error | string, context: string, options: ErrorHandlerOptions = {}): void {
    this.handle(error, {
      context,
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.WARNING,
      ...options,
    });
  }

  /** Handle validation errors */
  static handleValidationError(error: Error | string, context: string, options: ErrorHandlerOptions = {}): void {
    this.handle(error, {
      context,
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.INFO,
      ...options,
    });
  }

  /** Handle authentication errors */
  static handleAuthenticationError(error: Error | string, context: string, options: ErrorHandlerOptions = {}): void {
    this.handle(error, {
      context,
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.CRITICAL,
      ...options,
    });
  }

  /** Handle storage errors (save/load) */
  static handleStorageError(error: Error | string, context: string, options: ErrorHandlerOptions = {}): void {
    this.handle(error, {
      context,
      type: ErrorType.STORAGE,
      severity: ErrorSeverity.WARNING,
      ...options,
    });
  }

  /** Handle data loading errors */
  static handleDataLoadError(error: Error | string, context: string, options: ErrorHandlerOptions = {}): void {
    this.handle(error, {
      context,
      type: ErrorType.DATA_LOAD,
      severity: ErrorSeverity.WARNING,
      ...options,
    });
  }

  /** Handle data saving errors */
  static handleDataSaveError(error: Error | string, context: string, options: ErrorHandlerOptions = {}): void {
    this.handle(error, {
      context,
      type: ErrorType.DATA_SAVE,
      severity: ErrorSeverity.WARNING,
      ...options,
    });
  }

  /** Handle navigation errors */
  static handleNavigationError(error: Error | string, context: string, options: ErrorHandlerOptions = {}): void {
    this.handle(error, {
      context,
      type: ErrorType.NAVIGATION,
      severity: ErrorSeverity.WARNING,
      ...options,
    });
  }

  /**
   * Wrap async function with error handling
   */
  static wrapAsync<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    errorOptions: ErrorHandlerOptions = {}
  ): (...args: Parameters<T>) => Promise<ReturnType<T> | undefined> {
    return async (...args: Parameters<T>) => {
      try {
        return await fn(...args) as ReturnType<T>;
      } catch (error) {
        this.handle(error as Error | string, errorOptions);
        // Re-throw if needed for further handling
        if (errorOptions.rethrow) {
          throw error;
        }
        return undefined;
      }
    };
  }

  /**
   * Create a try-catch wrapper for common async operations
   */
  static async tryAsync<T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.handle(error as Error | string, options);
      return undefined;
    }
  }
}

export default ErrorHandler;
