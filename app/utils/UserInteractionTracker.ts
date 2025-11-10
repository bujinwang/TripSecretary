// @ts-nocheck

/**
 * UserInteractionTracker Hook
 * 
 * A custom React hook that tracks user interactions with form fields
 * to distinguish between user-modified fields and programmatically set defaults.
 * 
 * Features:
 * - Tracks field interaction state with timestamps
 * - Persists state to AsyncStorage for session management
 * - Provides methods to query and modify interaction state
 * - Handles initialization with existing saved data
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PREFIX = 'user_interaction_state_';

/**
 * Generate a unique session ID
 */
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * UserInteractionTracker Hook
 * 
 * @param {string} screenId - Unique identifier for the screen/form
 * @returns {Object} Hook interface with tracking methods
 */
export const useUserInteractionTracker = (screenId) => {
  const [interactionState, setInteractionState] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const sessionIdRef = useRef(generateSessionId());
  const storageKey = `${STORAGE_KEY_PREFIX}${screenId}`;

  /**
   * Load interaction state from AsyncStorage with error recovery
   */
  const loadInteractionState = useCallback(async () => {
    try {
      const storedState = await AsyncStorage.getItem(storageKey);
      if (storedState) {
        try {
          const parsedState = JSON.parse(storedState);
          
          // Validate the parsed state structure
          if (parsedState && typeof parsedState === 'object') {
            const fieldInteractions = parsedState.fieldInteractions || {};
            
            // Validate each field interaction
            const validatedInteractions = {};
            let hasCorruption = false;
            
            Object.keys(fieldInteractions).forEach(fieldName => {
              const fieldState = fieldInteractions[fieldName];
              
              if (fieldState && 
                  typeof fieldState === 'object' && 
                  typeof fieldState.isUserModified === 'boolean') {
                
                // Ensure required properties exist with defaults
                validatedInteractions[fieldName] = {
                  isUserModified: fieldState.isUserModified,
                  lastModified: fieldState.lastModified || new Date().toISOString(),
                  initialValue: fieldState.initialValue
                };
              } else {
                hasCorruption = true;
                console.warn(`Corrupted field state detected for ${fieldName}, skipping`);
              }
            });
            
            if (hasCorruption) {
              console.warn('Interaction state corruption detected, recovered valid fields');
            }
            
            setInteractionState(validatedInteractions);
          } else {
            throw new Error('Invalid state structure');
          }
        } catch (parseError) {
          console.error('Failed to parse interaction state, initializing with empty state:', parseError);
          
          // Clear corrupted data and start fresh
          try {
            await AsyncStorage.removeItem(storageKey);
          } catch (clearError) {
            console.error('Failed to clear corrupted state:', clearError);
          }
          
          setInteractionState({});
        }
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to load interaction state:', error);
      
      // Fallback: initialize with empty state
      setInteractionState({});
      setIsInitialized(true);
    }
  }, [storageKey]);

  /**
   * Save interaction state to AsyncStorage with error recovery
   */
  const saveInteractionState = useCallback(async (newState) => {
    try {
      // Validate state before saving
      if (!newState || typeof newState !== 'object') {
        console.warn('Invalid state provided to saveInteractionState, skipping save');
        return;
      }
      
      const stateToSave = {
        fieldInteractions: newState,
        sessionId: sessionIdRef.current,
        lastUpdated: new Date().toISOString()
      };
      
      // Attempt to save with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await AsyncStorage.setItem(storageKey, JSON.stringify(stateToSave));
          return; // Success, exit retry loop
        } catch (saveError) {
          retryCount++;
          console.warn(`Save attempt ${retryCount} failed:`, saveError);
          
          if (retryCount >= maxRetries) {
            throw saveError; // Re-throw after max retries
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
        }
      }
    } catch (error) {
      console.error('Failed to save interaction state after retries:', error);
      
      // Log the error for monitoring but don't crash the app
      // In a production app, you might want to send this to an error tracking service
    }
  }, [storageKey]);

  /**
   * Initialize the hook by loading existing state
   */
  useEffect(() => {
    loadInteractionState();
  }, [loadInteractionState]);

  /**
   * Mark a field as user-modified with error handling
   * 
   * @param {string} fieldName - Name of the field
   * @param {any} value - Current value of the field
   */
  const markFieldAsModified = useCallback((fieldName, value) => {
    try {
      if (!fieldName || typeof fieldName !== 'string') {
        console.warn('Invalid fieldName provided to markFieldAsModified:', fieldName);
        return;
      }
      
      setInteractionState(prevState => {
        try {
          const newState = {
            ...prevState,
            [fieldName]: {
              isUserModified: true,
              lastModified: new Date().toISOString(),
              initialValue: prevState[fieldName]?.initialValue ?? value
            }
          };
          
          // Save to AsyncStorage asynchronously
          saveInteractionState(newState);
          
          return newState;
        } catch (stateError) {
          console.error('Error updating interaction state:', stateError);
          return prevState; // Return previous state on error
        }
      });
    } catch (error) {
      console.error('Error in markFieldAsModified:', error);
    }
  }, [saveInteractionState]);

  /**
   * Check if a field has been user-modified
   * 
   * @param {string} fieldName - Name of the field
   * @returns {boolean} True if field has been user-modified
   */
  const isFieldUserModified = useCallback((fieldName) => {
    return interactionState[fieldName]?.isUserModified || false;
  }, [interactionState]);

  /**
   * Get list of all user-modified field names
   * 
   * @returns {string[]} Array of field names that have been user-modified
   */
  const getModifiedFields = useCallback(() => {
    return Object.keys(interactionState).filter(fieldName => 
      interactionState[fieldName]?.isUserModified
    );
  }, [interactionState]);

  /**
   * Reset a field's interaction state
   * 
   * @param {string} fieldName - Name of the field to reset
   */
  const resetField = useCallback((fieldName) => {
    setInteractionState(prevState => {
      const newState = { ...prevState };
      delete newState[fieldName];
      
      // Save to AsyncStorage asynchronously
      saveInteractionState(newState);
      
      return newState;
    });
  }, [saveInteractionState]);

  /**
   * Initialize interaction state with existing saved data with error recovery
   * This marks all populated fields as user-modified for backward compatibility
   * 
   * @param {Object} existingData - Object containing existing field values
   */
  const initializeWithExistingData = useCallback((existingData) => {
    try {
      if (!existingData || typeof existingData !== 'object') {
        console.warn('Invalid existingData provided to initializeWithExistingData');
        return;
      }

      setInteractionState(prevState => {
        try {
          const newState = { ...prevState };
          
          // Mark all populated fields as user-modified
          Object.keys(existingData).forEach(fieldName => {
            try {
              const value = existingData[fieldName];
              
              // Only mark as modified if the field has a meaningful value
              if (value !== null && value !== undefined && value !== '') {
                // Don't override existing interaction state
                if (!newState[fieldName]) {
                  newState[fieldName] = {
                    isUserModified: true,
                    lastModified: new Date().toISOString(),
                    initialValue: value
                  };
                }
              }
            } catch (fieldError) {
              console.warn(`Error processing field ${fieldName} during initialization:`, fieldError);
            }
          });
          
          // Save to AsyncStorage asynchronously
          saveInteractionState(newState);
          
          return newState;
        } catch (stateError) {
          console.error('Error updating state during initialization:', stateError);
          return prevState; // Return previous state on error
        }
      });
    } catch (error) {
      console.error('Error in initializeWithExistingData:', error);
    }
  }, [saveInteractionState]);

  /**
   * Get interaction details for a specific field
   * 
   * @param {string} fieldName - Name of the field
   * @returns {Object|null} Interaction details or null if not tracked
   */
  const getFieldInteractionDetails = useCallback((fieldName) => {
    return interactionState[fieldName] || null;
  }, [interactionState]);

  /**
   * Clear all interaction state
   */
  const clearAllInteractions = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(storageKey);
      setInteractionState({});
    } catch (error) {
      console.error('Failed to clear interaction state:', error);
    }
  }, [storageKey]);

  return useMemo(() => ({
    // Core methods required by the spec
    markFieldAsModified,
    isFieldUserModified,
    getModifiedFields,
    resetField,
    initializeWithExistingData,

    // Additional utility methods
    getFieldInteractionDetails,
    clearAllInteractions,

    // State information
    isInitialized,
    sessionId: sessionIdRef.current
  }), [
    markFieldAsModified,
    isFieldUserModified,
    getModifiedFields,
    resetField,
    initializeWithExistingData,
    getFieldInteractionDetails,
    clearAllInteractions,
    isInitialized
  ]);
};

export default useUserInteractionTracker;