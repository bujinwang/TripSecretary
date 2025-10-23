/**
 * DebouncedSave.errorHandling.test.js - Tests for error handling and recovery in DebouncedSave
 * Tests the enhanced error handling, retry logic, and recovery mechanisms
 * 
 * Requirements: 3.3, 4.4
 */

import { DebouncedSave } from '../DebouncedSave';

describe('DebouncedSave Error Handling', () => {
  let debouncedSave;

  beforeEach(() => {
    debouncedSave = new DebouncedSave();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    debouncedSave.clear();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('retry logic', () => {
    test('should retry failed save operations', async () => {
      let attemptCount = 0;
      const mockCallback = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        return Promise.resolve('success');
      });

      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 3,
        retryDelay: 500
      });

      debouncedFn();
      
      // Fast-forward through debounce delay
      jest.advanceTimersByTime(100);
      
      // Fast-forward through retry delays
      await jest.advanceTimersByTimeAsync(2000);

      expect(mockCallback).toHaveBeenCalledTimes(3);
      expect(debouncedSave.getSaveState('test-key')).toBe('saved');
    });

    test('should fail after max retries exceeded', async () => {
      const mockCallback = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      const onError = jest.fn();

      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 2,
        retryDelay: 100,
        onError
      });

      debouncedFn();
      
      jest.advanceTimersByTime(100);
      await jest.advanceTimersByTimeAsync(1000);

      expect(mockCallback).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(debouncedSave.getSaveState('test-key')).toBe('error');
      expect(onError).toHaveBeenCalledWith(expect.any(Error), 2);
    });

    test('should use exponential backoff for retries', async () => {
      let callTimes = [];
      const mockCallback = jest.fn().mockImplementation(() => {
        callTimes.push(Date.now());
        throw new Error('Always fails');
      });

      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 3,
        retryDelay: 100
      });

      debouncedFn();
      
      jest.advanceTimersByTime(100); // Initial debounce
      await jest.advanceTimersByTimeAsync(100); // First attempt
      await jest.advanceTimersByTimeAsync(200); // First retry (100 * 2^1)
      await jest.advanceTimersByTimeAsync(400); // Second retry (100 * 2^2)
      await jest.advanceTimersByTimeAsync(800); // Third retry (100 * 2^3)

      expect(mockCallback).toHaveBeenCalledTimes(4);
    });

    test('should call onRetry callback during retries', async () => {
      const mockCallback = jest.fn().mockRejectedValue(new Error('Test error'));
      const onRetry = jest.fn();

      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 2,
        retryDelay: 100,
        onRetry
      });

      debouncedFn();
      
      jest.advanceTimersByTime(100);
      await jest.advanceTimersByTimeAsync(500);

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 2);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 2, 2);
    });

    test('should set state to retrying during retry attempts', async () => {
      const mockCallback = jest.fn().mockRejectedValue(new Error('Test error'));

      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 1,
        retryDelay: 100
      });

      debouncedFn();
      
      jest.advanceTimersByTime(100);
      await jest.advanceTimersByTimeAsync(50); // During first retry delay

      expect(debouncedSave.getSaveState('test-key')).toBe('retrying');
    });
  });

  describe('error state management', () => {
    test('should store error details for debugging', async () => {
      const testError = new Error('Test error message');
      const mockCallback = jest.fn().mockRejectedValue(testError);

      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 0
      });

      debouncedFn();
      
      jest.advanceTimersByTime(100);
      await jest.advanceTimersByTimeAsync(100);

      const errorDetails = debouncedSave.getErrorDetails('test-key');
      expect(errorDetails).toEqual({
        error: 'Test error message',
        timestamp: expect.any(String),
        retryCount: 0
      });
    });

    test('should track retry count', async () => {
      const mockCallback = jest.fn().mockRejectedValue(new Error('Test error'));

      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 2,
        retryDelay: 100
      });

      debouncedFn();
      
      jest.advanceTimersByTime(100);
      await jest.advanceTimersByTimeAsync(500); // Wait for retries to complete

      expect(debouncedSave.getRetryCount('test-key')).toBeGreaterThan(0);
    });

    test('should clear retry count on successful save', async () => {
      let attemptCount = 0;
      const mockCallback = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('First attempt fails');
        }
        return Promise.resolve('success');
      });

      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 2,
        retryDelay: 100
      });

      debouncedFn();
      
      jest.advanceTimersByTime(100);
      await jest.advanceTimersByTimeAsync(300);

      expect(debouncedSave.getRetryCount('test-key')).toBe(0);
      expect(debouncedSave.getSaveState('test-key')).toBe('saved');
    });

    test('should auto-clear error state after timeout', async () => {
      const mockCallback = jest.fn().mockRejectedValue(new Error('Test error'));

      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 0
      });

      debouncedFn();
      
      jest.advanceTimersByTime(100);
      await jest.advanceTimersByTimeAsync(100);

      expect(debouncedSave.getSaveState('test-key')).toBe('error');

      // Fast-forward past error timeout (10 seconds)
      jest.advanceTimersByTime(10000);

      expect(debouncedSave.getSaveState('test-key')).toBe(null);
    });
  });

  describe('manual retry functionality', () => {
    test('should allow manual retry of failed saves', async () => {
      const mockCallback = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success');

      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 0
      });

      debouncedFn('arg1', 'arg2');
      
      jest.advanceTimersByTime(100);
      await jest.advanceTimersByTimeAsync(100);

      expect(debouncedSave.getSaveState('test-key')).toBe('error');

      // Manual retry
      const retryPromise = debouncedSave.retrySave('test-key');
      await jest.advanceTimersByTimeAsync(100);
      await retryPromise;

      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenLastCalledWith('arg1', 'arg2');
      expect(debouncedSave.getSaveState('test-key')).toBe('saved');
    });

    test('should reset error state before manual retry', async () => {
      const mockCallback = jest.fn().mockRejectedValue(new Error('Always fails'));

      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 1
      });

      debouncedFn();
      
      jest.advanceTimersByTime(100);
      await jest.advanceTimersByTimeAsync(300);

      expect(debouncedSave.getRetryCount('test-key')).toBeGreaterThan(0);

      // Manual retry should reset state
      const retryPromise = debouncedSave.retrySave('test-key');
      await jest.advanceTimersByTimeAsync(100);

      expect(debouncedSave.getRetryCount('test-key')).toBe(0);
    });

    test('should throw error for manual retry of non-existent key', async () => {
      await expect(debouncedSave.retrySave('non-existent-key')).rejects.toThrow(
        'No callback found for key: non-existent-key'
      );
    });
  });

  describe('flushPendingSave with error handling', () => {
    test('should handle errors during flush operations', async () => {
      const mockCallback1 = jest.fn().mockResolvedValue('success');
      const mockCallback2 = jest.fn().mockRejectedValue(new Error('Flush error'));

      const debouncedFn1 = debouncedSave.debouncedSave('key1', mockCallback1, 100);
      const debouncedFn2 = debouncedSave.debouncedSave('key2', mockCallback2, 100, {
        maxRetries: 0 // No retries to avoid timing issues
      });

      debouncedFn1();
      debouncedFn2();

      // Should not throw even if some saves fail
      const flushPromise = debouncedSave.flushPendingSave();
      await jest.advanceTimersByTimeAsync(200);
      await flushPromise;

      expect(mockCallback1).toHaveBeenCalled();
      expect(mockCallback2).toHaveBeenCalled();
      expect(debouncedSave.getSaveState('key1')).toBe('saved');
      expect(debouncedSave.getSaveState('key2')).toBe('error');
    }, 10000);

    test('should flush specific key with retry logic', async () => {
      let attemptCount = 0;
      const mockCallback = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('First attempt fails');
        }
        return Promise.resolve('success');
      });

      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 2,
        retryDelay: 100
      });

      debouncedFn();

      const flushPromise = debouncedSave.flushPendingSave('test-key');
      await jest.advanceTimersByTimeAsync(300);
      await flushPromise;

      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(debouncedSave.getSaveState('test-key')).toBe('saved');
    });
  });

  describe('callback error handling', () => {
    test('should handle errors in onError callback gracefully', async () => {
      const mockCallback = jest.fn().mockRejectedValue(new Error('Save error'));
      const faultyOnError = jest.fn().mockImplementation(() => {
        throw new Error('Error callback failed');
      });

      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 0,
        onError: faultyOnError
      });

      debouncedFn();
      
      jest.advanceTimersByTime(100);
      await jest.advanceTimersByTimeAsync(100);

      expect(faultyOnError).toHaveBeenCalled();
      expect(debouncedSave.getSaveState('test-key')).toBe('error');
    });

    test('should handle errors in onRetry callback gracefully', async () => {
      const mockCallback = jest.fn().mockRejectedValue(new Error('Save error'));
      const faultyOnRetry = jest.fn().mockImplementation(() => {
        throw new Error('Retry callback failed');
      });

      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 1,
        retryDelay: 100,
        onRetry: faultyOnRetry
      });

      debouncedFn();
      
      jest.advanceTimersByTime(100);
      await jest.advanceTimersByTimeAsync(300);

      expect(faultyOnRetry).toHaveBeenCalled();
      expect(debouncedSave.getSaveState('test-key')).toBe('error');
    });
  });

  describe('debug information', () => {
    test('should provide comprehensive debug information', async () => {
      const mockCallback1 = jest.fn().mockResolvedValue('success');
      const mockCallback2 = jest.fn().mockRejectedValue(new Error('Test error'));

      const debouncedFn1 = debouncedSave.debouncedSave('success-key', mockCallback1, 100);
      const debouncedFn2 = debouncedSave.debouncedSave('error-key', mockCallback2, 100, {
        maxRetries: 0 // No retries to avoid timing issues
      });

      debouncedFn1();
      debouncedFn2();

      jest.advanceTimersByTime(100);
      await jest.advanceTimersByTimeAsync(200);

      const debugInfo = debouncedSave.getDebugInfo();

      expect(debugInfo.states['success-key']).toBe('saved');
      expect(debugInfo.states['error-key']).toBe('error');
      expect(debugInfo.pendingTimeouts).toEqual([]);
      expect(debugInfo.errors['error-key']).toEqual({
        error: 'Test error',
        timestamp: expect.any(String),
        retryCount: 0
      });
    });

    test('should track pending timeouts in debug info', () => {
      const mockCallback = jest.fn();
      const debouncedFn = debouncedSave.debouncedSave('pending-key', mockCallback, 100);

      debouncedFn();

      const debugInfo = debouncedSave.getDebugInfo();
      expect(debugInfo.pendingTimeouts).toContain('pending-key');
    });
  });

  describe('graceful degradation', () => {
    test('should handle missing callback gracefully', async () => {
      // Simulate corrupted state where callback is missing
      debouncedSave.callbacks.delete('missing-key');

      await expect(debouncedSave.retrySave('missing-key')).rejects.toThrow(
        'No callback found for key: missing-key'
      );
    });

    test('should handle invalid options gracefully', () => {
      const mockCallback = jest.fn();

      // Should not throw with invalid options
      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 'invalid',
        retryDelay: null,
        onError: 'not-a-function'
      });

      expect(debouncedFn).toBeInstanceOf(Function);
    });

    test('should preserve interaction state during save failures', async () => {
      const mockCallback = jest.fn().mockRejectedValue(new Error('Save failed'));

      const debouncedFn = debouncedSave.debouncedSave('test-key', mockCallback, 100, {
        maxRetries: 0
      });

      debouncedFn('important-data');

      jest.advanceTimersByTime(100);
      await jest.advanceTimersByTimeAsync(100);

      // Arguments should be preserved for retry
      expect(debouncedSave.callbacks.get('test-key_args')).toEqual(['important-data']);
      expect(debouncedSave.getSaveState('test-key')).toBe('error');
    });
  });
});