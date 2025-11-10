// @ts-nocheck

/**
 * Tests for DebouncedSave utility
 */

import { DebouncedSave } from '../DebouncedSave';

describe('DebouncedSave', () => {
  let debouncedSave;

  beforeEach(() => {
    debouncedSave = new DebouncedSave();
    jest.useFakeTimers();
  });

  afterEach(() => {
    debouncedSave.clear();
    jest.useRealTimers();
  });

  test('should create debounced save function', () => {
    const mockCallback = jest.fn();
    const debouncedFn = debouncedSave.debouncedSave('test', mockCallback, 300);
    
    expect(typeof debouncedFn).toBe('function');
  });

  test('should debounce multiple calls', () => {
    const mockCallback = jest.fn();
    const debouncedFn = debouncedSave.debouncedSave('test', mockCallback, 300);
    
    // Call multiple times rapidly
    debouncedFn('arg1');
    debouncedFn('arg2');
    debouncedFn('arg3');
    
    // Should not have called callback yet
    expect(mockCallback).not.toHaveBeenCalled();
    
    // Fast-forward time
    jest.advanceTimersByTime(300);
    
    // Should have called callback only once with last arguments
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('arg3');
  });

  test('should track save states correctly', () => {
    const mockCallback = jest.fn().mockResolvedValue();
    const debouncedFn = debouncedSave.debouncedSave('test', mockCallback, 300);
    
    // Initial state should be null
    expect(debouncedSave.getSaveState('test')).toBeNull();
    
    // Call function
    debouncedFn();
    
    // Should be pending
    expect(debouncedSave.getSaveState('test')).toBe('pending');
    
    // Fast-forward to trigger save
    jest.advanceTimersByTime(300);
    
    // Should be saving (briefly)
    expect(debouncedSave.getSaveState('test')).toBe('saving');
  });

  test('should flush pending saves immediately', async () => {
    const mockCallback = jest.fn().mockResolvedValue();
    const debouncedFn = debouncedSave.debouncedSave('test', mockCallback, 300);
    
    // Call function
    debouncedFn('testArg');
    
    // Should be pending
    expect(debouncedSave.getSaveState('test')).toBe('pending');
    expect(debouncedSave.hasPendingSaves('test')).toBe(true);
    
    // Flush pending saves
    await debouncedSave.flushPendingSave('test');
    
    // Should have called callback immediately
    expect(mockCallback).toHaveBeenCalledWith('testArg');
    expect(debouncedSave.hasPendingSaves('test')).toBe(false);
  });

  test('should handle save errors', async () => {
    const mockCallback = jest.fn().mockRejectedValue(new Error('Save failed'));
    const debouncedFn = debouncedSave.debouncedSave('test', mockCallback, 300);
    
    // Call function
    debouncedFn();
    
    // Fast-forward to trigger save
    jest.advanceTimersByTime(300);
    
    // Wait for microtasks to complete
    await Promise.resolve();
    
    // Should be in error state
    expect(debouncedSave.getSaveState('test')).toBe('error');
  });

  test('should clear all states and timeouts', () => {
    const mockCallback = jest.fn();
    const debouncedFn = debouncedSave.debouncedSave('test', mockCallback, 300);
    
    debouncedFn();
    
    expect(debouncedSave.hasPendingSaves()).toBe(true);
    expect(debouncedSave.getSaveState('test')).toBe('pending');
    
    debouncedSave.clear();
    
    expect(debouncedSave.hasPendingSaves()).toBe(false);
    expect(debouncedSave.getSaveState('test')).toBeNull();
  });

  test('should handle multiple keys independently', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    
    const debouncedFn1 = debouncedSave.debouncedSave('test1', mockCallback1, 300);
    const debouncedFn2 = debouncedSave.debouncedSave('test2', mockCallback2, 300);
    
    debouncedFn1('arg1');
    debouncedFn2('arg2');
    
    expect(debouncedSave.getSaveState('test1')).toBe('pending');
    expect(debouncedSave.getSaveState('test2')).toBe('pending');
    
    jest.advanceTimersByTime(300);
    
    expect(mockCallback1).toHaveBeenCalledWith('arg1');
    expect(mockCallback2).toHaveBeenCalledWith('arg2');
  });
});