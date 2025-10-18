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
   * Create a debounced save function
   * @param {string} key - Unique identifier for this save operation
   * @param {Function} callback - Function to execute when save is triggered
   * @param {number} delay - Delay in milliseconds (default: 300)
   * @returns {Function} Debounced save function
   */
  debouncedSave(key, callback, delay = 300) {
    // Store the callback and args for this key
    this.callbacks.set(key, callback);
    
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
        try {
          this.setSaveState(key, 'saving');
          const savedArgs = this.callbacks.get(key + '_args') || [];
          await callback(...savedArgs);
          this.setSaveState(key, 'saved');
          
          // Auto-clear saved state after 2 seconds
          setTimeout(() => {
            if (this.getSaveState(key) === 'saved') {
              this.setSaveState(key, null);
            }
          }, 2000);
        } catch (error) {
          console.error('DebouncedSave error:', error);
          this.setSaveState(key, 'error');
          
          // Auto-clear error state after 5 seconds
          setTimeout(() => {
            if (this.getSaveState(key) === 'error') {
              this.setSaveState(key, null);
            }
          }, 5000);
        } finally {
          this.pendingTimeouts.delete(key);
        }
      }, delay);

      this.pendingTimeouts.set(key, timeoutId);
    };
  }

  /**
   * Immediately execute any pending save operations
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

        // Execute the callback immediately
        const callback = this.callbacks.get(saveKey);
        const args = this.callbacks.get(saveKey + '_args') || [];
        
        if (callback) {
          try {
            this.setSaveState(saveKey, 'saving');
            const promise = Promise.resolve(callback(...args));
            promises.push(promise);
            
            promise.then(() => {
              this.setSaveState(saveKey, 'saved');
              setTimeout(() => {
                if (this.getSaveState(saveKey) === 'saved') {
                  this.setSaveState(saveKey, null);
                }
              }, 2000);
            }).catch((error) => {
              console.error('FlushPendingSave error:', error);
              this.setSaveState(saveKey, 'error');
              setTimeout(() => {
                if (this.getSaveState(saveKey) === 'error') {
                  this.setSaveState(saveKey, null);
                }
              }, 5000);
            });
          } catch (error) {
            console.error('FlushPendingSave sync error:', error);
            this.setSaveState(saveKey, 'error');
          }
        }
      }
    }

    return Promise.all(promises);
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
}

// Create and export a singleton instance
const debouncedSaveInstance = new DebouncedSave();

export default debouncedSaveInstance;

// Also export the class for testing purposes
export { DebouncedSave };