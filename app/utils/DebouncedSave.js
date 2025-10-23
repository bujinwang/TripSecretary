/**
 * DebouncedSave - Utility for debounced save operations with state tracking
 * 
 * Provides debounced save functionality to prevent excessive save operations
 * while maintaining save state tracking for UI feedback.
 */

class DebouncedSave {
  constructor() {
    this.pendingTimeouts = new Map();
    this.saveStates = new Map();
    this.callbacks = new Map();
  }

  /**
   * Create a debounced save function with error handling and retry logic
   * @param {string} key - Unique identifier for this save operation
   * @param {Function} callback - Function to execute when save is triggered
   * @param {number} delay - Delay in milliseconds (default: 300)
   * @param {Object} options - Additional options
   * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
   * @param {number} options.retryDelay - Base delay between retries in ms (default: 1000)
   * @param {Function} options.onError - Error callback function
   * @param {Function} options.onRetry - Retry callback function
   * @returns {Function} Debounced save function
   */
  debouncedSave(key, callback, delay = 300, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      onError = null,
      onRetry = null
    } = options;

    // Store the callback and options for this key
    this.callbacks.set(key, callback);
    this.callbacks.set(key + '_options', options);
    
    return (...args) => {
      // Store the latest arguments
      this.callbacks.set(key + '_args', args);
      
      // Clear any existing timeout for this key
      if (this.pendingTimeouts.has(key)) {
        clearTimeout(this.pendingTimeouts.get(key));
      }

      // Set state to pending
      this.setSaveState(key, 'pending');

      // Create new timeout
      const timeoutId = setTimeout(async () => {
        await this._executeSaveWithRetry(key, maxRetries, retryDelay, onError, onRetry);
      }, delay);

      this.pendingTimeouts.set(key, timeoutId);
    };
  }

  /**
   * Execute save operation with retry logic
   * @private
   */
  async _executeSaveWithRetry(key, maxRetries, retryDelay, onError, onRetry) {
    let retryCount = 0;
    
    while (retryCount <= maxRetries) {
      try {
        this.setSaveState(key, 'saving');
        const callback = this.callbacks.get(key);
        const savedArgs = this.callbacks.get(key + '_args') || [];
        
        if (!callback) {
          throw new Error(`No callback found for key: ${key}`);
        }
        
        await callback(...savedArgs);
        this.setSaveState(key, 'saved');
        
        // Clear retry count on success
        this.callbacks.delete(key + '_retryCount');
        
        // Auto-clear saved state after 2 seconds
        setTimeout(() => {
          if (this.getSaveState(key) === 'saved') {
            this.setSaveState(key, null);
          }
        }, 2000);
        
        return; // Success, exit retry loop
        
      } catch (error) {
        retryCount++;
        console.error(`DebouncedSave error (attempt ${retryCount}/${maxRetries + 1}):`, error);
        
        // Store retry count for monitoring
        this.callbacks.set(key + '_retryCount', retryCount);
        
        if (retryCount <= maxRetries) {
          // Still have retries left
          this.setSaveState(key, 'retrying');
          
          // Call retry callback if provided
          if (onRetry) {
            try {
              onRetry(error, retryCount, maxRetries);
            } catch (callbackError) {
              console.error('Error in retry callback:', callbackError);
            }
          }
          
          // Wait before retry with exponential backoff
          const waitTime = retryDelay * Math.pow(2, retryCount - 1);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
        } else {
          // Max retries exceeded
          this.setSaveState(key, 'error');
          
          // Call error callback if provided
          if (onError) {
            try {
              onError(error, retryCount - 1);
            } catch (callbackError) {
              console.error('Error in error callback:', callbackError);
            }
          }
          
          // Store error details for debugging
          this.callbacks.set(key + '_lastError', {
            error: error.message,
            timestamp: new Date().toISOString(),
            retryCount: retryCount - 1
          });
          
          // Auto-clear error state after 10 seconds for persistent errors
          setTimeout(() => {
            if (this.getSaveState(key) === 'error') {
              this.setSaveState(key, null);
            }
          }, 10000);
        }
      }
    }
    
    // Clean up timeout reference
    this.pendingTimeouts.delete(key);
  }

  /**
   * Immediately execute any pending save operations with error handling
   * @param {string} key - Optional key to flush specific operation, or null for all
   * @returns {Promise} Promise that resolves when all pending saves complete
   */
  async flushPendingSave(key = null) {
    const keysToFlush = key ? [key] : Array.from(this.pendingTimeouts.keys());
    const promises = [];

    for (const saveKey of keysToFlush) {
      if (this.pendingTimeouts.has(saveKey)) {
        // Clear the timeout
        clearTimeout(this.pendingTimeouts.get(saveKey));
        this.pendingTimeouts.delete(saveKey);

        // Get options for this save operation
        const options = this.callbacks.get(saveKey + '_options') || {};
        const {
          maxRetries = 3,
          retryDelay = 1000,
          onError = null,
          onRetry = null
        } = options;

        // Execute with retry logic
        const promise = this._executeSaveWithRetry(saveKey, maxRetries, retryDelay, onError, onRetry);
        promises.push(promise);
      }
    }

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('FlushPendingSave: Some saves failed:', error);
      // Don't throw - allow partial success
    }
  }

  /**
   * Get the current save state for a key
   * @param {string} key - The key to check
   * @returns {string|null} Current state: 'pending', 'saving', 'saved', 'error', or null
   */
  getSaveState(key) {
    return this.saveStates.get(key) || null;
  }

  /**
   * Set the save state for a key
   * @param {string} key - The key to set state for
   * @param {string|null} state - The state to set
   */
  setSaveState(key, state) {
    if (state === null) {
      this.saveStates.delete(key);
    } else {
      this.saveStates.set(key, state);
    }
  }

  /**
   * Check if there are any pending save operations
   * @param {string} key - Optional key to check specific operation
   * @returns {boolean} True if there are pending saves
   */
  hasPendingSaves(key = null) {
    if (key) {
      return this.pendingTimeouts.has(key);
    }
    return this.pendingTimeouts.size > 0;
  }

  /**
   * Clear all pending saves and states
   */
  clear() {
    // Clear all timeouts
    for (const timeoutId of this.pendingTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    
    this.pendingTimeouts.clear();
    this.saveStates.clear();
    this.callbacks.clear();
  }

  /**
   * Get error details for a specific key
   * @param {string} key - The key to get error details for
   * @returns {Object|null} Error details or null if no error
   */
  getErrorDetails(key) {
    return this.callbacks.get(key + '_lastError') || null;
  }

  /**
   * Get retry count for a specific key
   * @param {string} key - The key to get retry count for
   * @returns {number} Current retry count
   */
  getRetryCount(key) {
    return this.callbacks.get(key + '_retryCount') || 0;
  }

  /**
   * Force retry a failed save operation
   * @param {string} key - The key to retry
   * @returns {Promise} Promise that resolves when retry completes
   */
  async retrySave(key) {
    const callback = this.callbacks.get(key);
    const args = this.callbacks.get(key + '_args') || [];
    const options = this.callbacks.get(key + '_options') || {};
    
    if (!callback) {
      throw new Error(`No callback found for key: ${key}`);
    }

    const {
      maxRetries = 3,
      retryDelay = 1000,
      onError = null,
      onRetry = null
    } = options;

    // Reset retry count
    this.callbacks.delete(key + '_retryCount');
    this.callbacks.delete(key + '_lastError');

    return this._executeSaveWithRetry(key, maxRetries, retryDelay, onError, onRetry);
  }

  /**
   * Get all current save states (useful for debugging)
   * @returns {Object} Object with all current save states
   */
  getAllStates() {
    const states = {};
    for (const [key, state] of this.saveStates.entries()) {
      states[key] = state;
    }
    return states;
  }

  /**
   * Get comprehensive debug information
   * @returns {Object} Debug information including states, errors, and retry counts
   */
  getDebugInfo() {
    const debug = {
      states: this.getAllStates(),
      pendingTimeouts: Array.from(this.pendingTimeouts.keys()),
      errors: {},
      retryCounts: {}
    };

    // Collect error details and retry counts
    for (const [key, value] of this.callbacks.entries()) {
      if (key.endsWith('_lastError')) {
        const originalKey = key.replace('_lastError', '');
        debug.errors[originalKey] = value;
      } else if (key.endsWith('_retryCount')) {
        const originalKey = key.replace('_retryCount', '');
        debug.retryCounts[originalKey] = value;
      }
    }

    return debug;
  }
}

// Create and export a singleton instance
const debouncedSaveInstance = new DebouncedSave();

export default debouncedSaveInstance;

// Also export the class for testing purposes
export { DebouncedSave };