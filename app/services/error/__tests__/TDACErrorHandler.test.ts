// @ts-nocheck

/**
 * TDAC Error Handler Tests
 * Tests for comprehensive error handling, retry mechanisms, and user-friendly error reporting
 */

import TDACErrorHandler from '../TDACErrorHandler';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve())
}));

describe('TDACErrorHandler', () => {
  beforeEach(() => {
    // Clear error log before each test
    TDACErrorHandler.errorLog = [];
  });

  describe('handleSubmissionError', () => {
    it('should handle network errors with retry', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';

      const result = await TDACErrorHandler.handleSubmissionError(
        networkError,
        { operation: 'test', submissionMethod: 'api' },
        0
      );

      expect(result.category).toBe('network');
      expect(result.shouldRetry).toBe(true);
      expect(result.recoverable).toBe(true);
      expect(result.userMessage).toContain('Network connection issue');
      expect(result.retryDelay).toBeGreaterThan(0);
      expect(result.suggestions).toContain('Check your internet connection');
    });

    it('should handle validation errors without retry', async () => {
      const validationError = new Error('Invalid format for required field');
      
      const result = await TDACErrorHandler.handleSubmissionError(
        validationError,
        { operation: 'test', submissionMethod: 'api' },
        0
      );

      expect(result.category).toBe('validation');
      expect(result.shouldRetry).toBe(false);
      expect(result.recoverable).toBe(true);
      expect(result.userMessage).toContain('check your information');
      expect(result.suggestions).toContain('Review all required fields');
    });

    it('should handle Cloudflare errors with retry', async () => {
      const cloudflareError = new Error('Cloudflare verification failed');
      
      const result = await TDACErrorHandler.handleSubmissionError(
        cloudflareError,
        { operation: 'test', submissionMethod: 'hybrid' },
        0
      );

      expect(result.category).toBe('cloudflare');
      expect(result.shouldRetry).toBe(true);
      expect(result.recoverable).toBe(true);
      expect(result.userMessage).toContain('Security verification failed');
      expect(result.suggestions).toContain('Complete the security verification');
    });

    it('should handle server errors with retry', async () => {
      const serverError = new Error('Internal server error');
      
      const result = await TDACErrorHandler.handleSubmissionError(
        serverError,
        { operation: 'test', submissionMethod: 'api' },
        0
      );

      expect(result.category).toBe('server');
      expect(result.shouldRetry).toBe(true);
      expect(result.recoverable).toBe(true);
      expect(result.userMessage).toContain('temporarily unavailable');
      expect(result.suggestions).toContain('Wait a few minutes and try again');
    });

    it('should handle rate limit errors with retry', async () => {
      const rateLimitError = new Error('Too many requests - rate limit exceeded');
      
      const result = await TDACErrorHandler.handleSubmissionError(
        rateLimitError,
        { operation: 'test', submissionMethod: 'api' },
        0
      );

      expect(result.category).toBe('rateLimit');
      expect(result.shouldRetry).toBe(true);
      expect(result.recoverable).toBe(true);
      expect(result.userMessage).toContain('Too many requests');
      expect(result.suggestions).toContain('Wait 5-10 minutes before retrying');
    });

    it('should handle authentication errors without retry', async () => {
      const authError = new Error('Unauthorized access - 401');
      
      const result = await TDACErrorHandler.handleSubmissionError(
        authError,
        { operation: 'test', submissionMethod: 'api' },
        0
      );

      expect(result.category).toBe('authentication');
      expect(result.shouldRetry).toBe(false);
      expect(result.recoverable).toBe(true);
      expect(result.userMessage).toContain('Authentication failed');
      expect(result.suggestions).toContain('Restart the submission process');
    });

    it('should handle business logic errors without retry', async () => {
      const businessError = new Error('Arrival date is outside submission window');
      
      const result = await TDACErrorHandler.handleSubmissionError(
        businessError,
        { operation: 'test', submissionMethod: 'api' },
        0
      );

      expect(result.category).toBe('business');
      expect(result.shouldRetry).toBe(false);
      expect(result.recoverable).toBe(true);
      expect(result.userMessage).toContain('issue with your submission data');
      expect(result.suggestions).toContain('Check arrival date is correct');
    });

    it('should handle system errors as non-recoverable', async () => {
      const systemError = new Error('Out of memory - system failure');
      
      const result = await TDACErrorHandler.handleSubmissionError(
        systemError,
        { operation: 'test', submissionMethod: 'api' },
        0
      );

      expect(result.category).toBe('system');
      expect(result.shouldRetry).toBe(false);
      expect(result.recoverable).toBe(false);
      expect(result.userMessage).toContain('System issue detected');
      expect(result.suggestions).toContain('Restart the app');
    });

    it('should not retry after max attempts', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';

      const result = await TDACErrorHandler.handleSubmissionError(
        networkError,
        { operation: 'test', submissionMethod: 'api' },
        3 // Max attempts reached
      );

      expect(result.shouldRetry).toBe(false);
      expect(result.attemptNumber).toBe(4);
    });

    it('should calculate exponential backoff delay', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';

      const result1 = await TDACErrorHandler.handleSubmissionError(networkError, {}, 0);
      const result2 = await TDACErrorHandler.handleSubmissionError(networkError, {}, 1);
      const result3 = await TDACErrorHandler.handleSubmissionError(networkError, {}, 2);

      expect(result2.retryDelay).toBeGreaterThan(result1.retryDelay);
      expect(result3.retryDelay).toBeGreaterThan(result2.retryDelay);
      expect(result3.retryDelay).toBeLessThanOrEqual(10000); // Max delay
    });
  });

  describe('categorizeError', () => {
    it('should categorize network errors correctly', () => {
      const networkError = new Error('Network connection failed');
      const category = TDACErrorHandler.categorizeError(networkError);
      
      expect(category.name).toBe('network');
      expect(category.retryable).toBe(true);
      expect(category.recoverable).toBe(true);
    });

    it('should categorize unknown errors with default category', () => {
      const unknownError = new Error('Some unknown error message');
      const category = TDACErrorHandler.categorizeError(unknownError);
      
      expect(category.name).toBe('unknown');
      expect(category.retryable).toBe(true);
      expect(category.recoverable).toBe(true);
    });
  });

  describe('shouldRetry', () => {
    it('should not retry non-retryable error categories', () => {
      const validationError = new Error('Invalid format');
      const category = { retryable: false };
      
      const shouldRetry = TDACErrorHandler.shouldRetry(validationError, category, 0);
      expect(shouldRetry).toBe(false);
    });

    it('should not retry after max attempts', () => {
      const networkError = new Error('Network failed');
      const category = { retryable: true };
      
      const shouldRetry = TDACErrorHandler.shouldRetry(networkError, category, 3);
      expect(shouldRetry).toBe(false);
    });

    it('should retry retryable errors within attempt limit', () => {
      const networkError = new Error('Network failed');
      networkError.name = 'NetworkError';
      const category = { retryable: true };
      
      const shouldRetry = TDACErrorHandler.shouldRetry(networkError, category, 1);
      expect(shouldRetry).toBe(true);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff', () => {
      const delay1 = TDACErrorHandler.calculateRetryDelay(0);
      const delay2 = TDACErrorHandler.calculateRetryDelay(1);
      const delay3 = TDACErrorHandler.calculateRetryDelay(2);

      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
      expect(delay3).toBeLessThanOrEqual(10000);
    });

    it('should respect maximum delay', () => {
      const delay = TDACErrorHandler.calculateRetryDelay(10);
      expect(delay).toBeLessThanOrEqual(10000);
    });
  });

  describe('getRecoverySuggestions', () => {
    it('should provide network-specific suggestions', () => {
      const category = { name: 'network' };
      const suggestions = TDACErrorHandler.getRecoverySuggestions(category, new Error(), {});
      
      expect(suggestions).toContain('Check your internet connection');
      expect(suggestions).toContain('Try switching between WiFi and mobile data');
    });

    it('should provide validation-specific suggestions', () => {
      const category = { name: 'validation' };
      const suggestions = TDACErrorHandler.getRecoverySuggestions(category, new Error(), {});
      
      expect(suggestions).toContain('Review all required fields');
      expect(suggestions).toContain('Check date formats (YYYY-MM-DD)');
    });

    it('should provide default suggestions for unknown categories', () => {
      const category = { name: 'unknown' };
      const suggestions = TDACErrorHandler.getRecoverySuggestions(category, new Error(), {});
      
      expect(suggestions).toContain('Try again in a few minutes');
      expect(suggestions).toContain('Restart the app');
    });
  });

  describe('createErrorDialog', () => {
    it('should create appropriate dialog data', () => {
      const errorResult = {
        category: 'network',
        userMessage: 'Network issue',
        shouldRetry: true,
        recoverable: true,
        retryDelay: 2000
      };

      const dialog = TDACErrorHandler.createErrorDialog(errorResult);

      expect(dialog.title).toBe('Connection Issue');
      expect(dialog.message).toBe('Network issue');
      expect(dialog.icon).toBe('📶');
      expect(dialog.severity).toBe('warning');
      expect(dialog.buttons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'retry', primary: true }),
          expect.objectContaining({ action: 'alternative' }),
          expect.objectContaining({ action: 'cancel' })
        ])
      );
    });

    it('should include support button for system errors', () => {
      const errorResult = {
        category: 'system',
        userMessage: 'System error',
        shouldRetry: false,
        recoverable: false
      };

      const dialog = TDACErrorHandler.createErrorDialog(errorResult);

      expect(dialog.buttons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'support' })
        ])
      );
    });
  });

  describe('error logging', () => {
    it('should log errors with proper structure', async () => {
      const error = new Error('Test error');
      const context = { operation: 'test', submissionMethod: 'api' };

      await TDACErrorHandler.logError(error, context, 0);

      expect(TDACErrorHandler.errorLog).toHaveLength(1);
      expect(TDACErrorHandler.errorLog[0]).toMatchObject({
        message: 'Test error',
        context: context,
        attemptNumber: 0
      });
      expect(TDACErrorHandler.errorLog[0].id).toBeDefined();
      expect(TDACErrorHandler.errorLog[0].timestamp).toBeDefined();
    });

    it('should maintain log size limit', async () => {
      // Add more than max entries
      for (let i = 0; i < 105; i++) {
        await TDACErrorHandler.logError(new Error(`Error ${i}`), {}, 0);
      }

      expect(TDACErrorHandler.errorLog.length).toBeLessThanOrEqual(100);
    });
  });

  describe('getErrorStatistics', () => {
    it('should calculate error statistics correctly', async () => {
      await TDACErrorHandler.logError(new Error('Network failed'), { submissionMethod: 'api' }, 0);
      await TDACErrorHandler.logError(new Error('Validation failed'), { submissionMethod: 'webview' }, 0);
      await TDACErrorHandler.logError(new Error('Network timeout'), { submissionMethod: 'api' }, 0);

      const stats = TDACErrorHandler.getErrorStatistics();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByCategory.network).toBe(2);
      expect(stats.errorsByCategory.validation).toBe(1);
      expect(stats.errorsByMethod.api).toBe(2);
      expect(stats.errorsByMethod.webview).toBe(1);
      expect(stats.recentErrors).toHaveLength(3);
    });
  });

  describe('exportErrorLog', () => {
    it('should export error log as JSON', async () => {
      await TDACErrorHandler.logError(new Error('Test error'), { operation: 'test' }, 0);

      const exported = await TDACErrorHandler.exportErrorLog();
      const data = JSON.parse(exported);

      expect(data.timestamp).toBeDefined();
      expect(data.version).toBe('1.0.0');
      expect(data.errors).toHaveLength(1);
      expect(data.statistics).toBeDefined();
    });
  });
});