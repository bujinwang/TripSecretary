/**
 * DebouncedSave - Utility for debounced save operations with state tracking
 *
 * Provides debounced save functionality to prevent excessive save operations
 * while maintaining save state tracking for UI feedback.
 */

type TimeoutHandle = ReturnType<typeof setTimeout>;

export type SaveState = 'pending' | 'saving' | 'saved' | 'retrying' | 'error';

export type DebouncedSaveCallback = (...args: unknown[]) => unknown | Promise<unknown>;

export interface DebouncedSaveOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: unknown, retryCount: number) => void;
  onRetry?: (error: unknown, attempt: number, maxRetries: number) => void;
}

type CallbackOptions = Required<Pick<DebouncedSaveOptions, 'maxRetries' | 'retryDelay'>> &
  Pick<DebouncedSaveOptions, 'onError' | 'onRetry'>;

interface CallbackMetadata {
  callback: DebouncedSaveCallback;
  args: unknown[];
  options: CallbackOptions;
  retryCount: number;
  lastError?: {
    error: string;
    timestamp: string;
    retryCount: number;
  };
}

interface DebugInfo {
  states: Record<string, SaveState>;
  pendingTimeouts: string[];
  errors: Record<string, CallbackMetadata['lastError'] | undefined>;
  retryCounts: Record<string, number>;
}

class DebouncedSave {
  private readonly pendingTimeouts: Map<string, TimeoutHandle>;

  private readonly saveStates: Map<string, SaveState>;

  private readonly callbacks: Map<string, CallbackMetadata>;

  constructor() {
    this.pendingTimeouts = new Map();
    this.saveStates = new Map();
    this.callbacks = new Map();
  }

  /**
   * Create a debounced save function with error handling and retry logic.
   */
  debouncedSave<T extends DebouncedSaveCallback>(
    key: string,
    callback: T,
    delay = 300,
    options: DebouncedSaveOptions = {}
  ): (...args: Parameters<T>) => void {
    const metadata = this.ensureMetadata(key, callback, options);

    return (...args: Parameters<T>) => {
      metadata.args = args;
      metadata.callback = callback;
      metadata.options = this.mergeOptions(options);

      if (this.pendingTimeouts.has(key)) {
        clearTimeout(this.pendingTimeouts.get(key)!);
      }

      this.setSaveState(key, 'pending');

      const timeoutId: TimeoutHandle = setTimeout(() => {
        void this.executeSaveWithRetry(key);
      }, delay);

      this.pendingTimeouts.set(key, timeoutId);
    };
  }

  /**
   * Immediately execute any pending save operations with error handling.
   */
  async flushPendingSave(key: string | null = null): Promise<void> {
    const keysToFlush = key ? [key] : Array.from(this.pendingTimeouts.keys());
    const promises: Array<Promise<void>> = [];

    for (const saveKey of keysToFlush) {
      const timeout = this.pendingTimeouts.get(saveKey);
      if (!timeout) {
        continue;
      }

      clearTimeout(timeout);
      this.pendingTimeouts.delete(saveKey);

      const metadata = this.callbacks.get(saveKey);
      if (!metadata) {
        continue;
      }

      promises.push(this.executeSaveWithRetry(saveKey));
    }

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('FlushPendingSave: Some saves failed:', error);
    }
  }

  /**
   * Get the current save state for a key.
   */
  getSaveState(key: string): SaveState | null {
    return this.saveStates.get(key) ?? null;
  }

  /**
   * Set the save state for a key.
   */
  setSaveState(key: string, state: SaveState | null): void {
    if (state === null) {
      this.saveStates.delete(key);
    } else {
      this.saveStates.set(key, state);
    }
  }

  /**
   * Check if there are any pending save operations.
   */
  hasPendingSaves(key: string | null = null): boolean {
    if (key) {
      return this.pendingTimeouts.has(key);
    }
    return this.pendingTimeouts.size > 0;
  }

  /**
   * Clear all pending saves and states.
   */
  clear(): void {
    for (const timeoutId of Array.from(this.pendingTimeouts.values())) {
      clearTimeout(timeoutId);
    }

    this.pendingTimeouts.clear();
    this.saveStates.clear();
    this.callbacks.clear();
  }

  /**
   * Get error details for a specific key.
   */
  getErrorDetails(key: string): CallbackMetadata['lastError'] | null {
    return this.callbacks.get(key)?.lastError ?? null;
  }

  /**
   * Get retry count for a specific key.
   */
  getRetryCount(key: string): number {
    return this.callbacks.get(key)?.retryCount ?? 0;
  }

  /**
   * Force retry a failed save operation.
   */
  async retrySave(key: string): Promise<void> {
    const metadata = this.callbacks.get(key);
    if (!metadata) {
      throw new Error(`No callback found for key: ${key}`);
    }

    metadata.retryCount = 0;
    metadata.lastError = undefined;

    await this.executeSaveWithRetry(key);
  }

  /**
   * Get all current save states (useful for debugging).
   */
  getAllStates(): Record<string, SaveState> {
    const states: Record<string, SaveState> = {};
    for (const [key, state] of Array.from(this.saveStates.entries())) {
      states[key] = state;
    }
    return states;
  }

  /**
   * Get comprehensive debug information.
   */
  getDebugInfo(): DebugInfo {
    const debug: DebugInfo = {
      states: this.getAllStates(),
      pendingTimeouts: Array.from(this.pendingTimeouts.keys()),
      errors: {},
      retryCounts: {},
    };

    for (const [key, metadata] of Array.from(this.callbacks.entries())) {
      debug.errors[key] = metadata.lastError;
      debug.retryCounts[key] = metadata.retryCount;
    }

    return debug;
  }

  private ensureMetadata(
    key: string,
    callback: DebouncedSaveCallback,
    options: DebouncedSaveOptions
  ): CallbackMetadata {
    const existing = this.callbacks.get(key);
    const mergedOptions = this.mergeOptions(options);

    if (existing) {
      existing.callback = callback;
      existing.options = mergedOptions;
      return existing;
    }

    const metadata: CallbackMetadata = {
      callback,
      args: [],
      options: mergedOptions,
      retryCount: 0,
    };

    this.callbacks.set(key, metadata);
    return metadata;
  }

  private mergeOptions(options: DebouncedSaveOptions): CallbackOptions {
    return {
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      onError: options.onError,
      onRetry: options.onRetry,
    };
  }

  private async executeSaveWithRetry(key: string): Promise<void> {
    const metadata = this.callbacks.get(key);
    if (!metadata) {
      return;
    }

    const { callback, options } = metadata;
    const { maxRetries, retryDelay, onError, onRetry } = options;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        this.setSaveState(key, 'saving');
        await callback(...metadata.args);
        metadata.retryCount = 0;
        metadata.lastError = undefined;
        this.setSaveState(key, 'saved');

        setTimeout(() => {
          if (this.getSaveState(key) === 'saved') {
            this.setSaveState(key, null);
          }
        }, 2000);

        return;
      } catch (error) {
        attempt += 1;
        metadata.retryCount = attempt;
        console.error(`DebouncedSave error (attempt ${attempt}/${maxRetries + 1}):`, error);

        if (attempt <= maxRetries) {
          this.setSaveState(key, 'retrying');

          if (onRetry) {
            try {
              onRetry(error, attempt, maxRetries);
            } catch (callbackError) {
              console.error('Error in retry callback:', callbackError);
            }
          }

          const waitTime = retryDelay * Math.pow(2, attempt - 1);
          await new Promise<void>((resolve) => {
            setTimeout(resolve, waitTime);
          });
        } else {
          this.setSaveState(key, 'error');

          metadata.lastError = {
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
            retryCount: attempt - 1,
          };

          if (onError) {
            try {
              onError(error, attempt - 1);
            } catch (callbackError) {
              console.error('Error in error callback:', callbackError);
            }
          }

          setTimeout(() => {
            if (this.getSaveState(key) === 'error') {
              this.setSaveState(key, null);
            }
          }, 10000);
        }
      }
    }

    this.pendingTimeouts.delete(key);
  }
}

// Create and export a singleton instance
const debouncedSaveInstance = new DebouncedSave();

export default debouncedSaveInstance;

// Also export the class for testing purposes
export { DebouncedSave };