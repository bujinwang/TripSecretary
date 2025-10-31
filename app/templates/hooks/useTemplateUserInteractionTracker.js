/**
 * useTemplateUserInteractionTracker Hook
 *
 * Ported from Thailand's UserInteractionTracker
 * Tracks user interactions with form fields to distinguish between
 * user-modified fields and programmatically set defaults.
 *
 * Features:
 * - Tracks field interaction state with timestamps
 * - Persists state to AsyncStorage for session management
 * - Provides methods to query and modify interaction state
 * - Handles initialization with existing saved data
 * - Error recovery for corrupted state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PREFIX = 'user_interaction_state_';

/**
 * Generate a unique session ID
 */
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * useTemplateUserInteractionTracker Hook
 *
 * @param {string} screenId - Unique identifier for the screen/form (from config.destinationId)
 * @param {Object} config - Template configuration
 * @returns {Object} Hook interface with tracking methods
 */
export const useTemplateUserInteractionTracker = (screenId, config) => {
  const [interactionState, setInteractionState] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const sessionIdRef = useRef(generateSessionId());
  const storageKey = `${STORAGE_KEY_PREFIX}${screenId}`;

  /**
   * Load interaction state from AsyncStorage with error recovery
   */
  const loadInteractionState = useCallback(async () => {
    if (!config.tracking?.trackFieldModifications) {
      setIsInitialized(true);
      return;
    }

    try {
      const storedState = await AsyncStorage.getItem(storageKey);
      if (storedState) {
        try {
          const parsedState = JSON.parse(storedState);

          if (parsedState && typeof parsedState === 'object') {
            const fieldInteractions = parsedState.fieldInteractions || {};
            const validatedInteractions = {};
            let hasCorruption = false;

            Object.keys(fieldInteractions).forEach(fieldName => {
              const fieldState = fieldInteractions[fieldName];

              if (fieldState &&
                  typeof fieldState === 'object' &&
                  typeof fieldState.isUserModified === 'boolean') {
                validatedInteractions[fieldName] = {
                  isUserModified: fieldState.isUserModified,
                  lastModified: fieldState.lastModified || new Date().toISOString(),
                  initialValue: fieldState.initialValue
                };
              } else {
                hasCorruption = true;
                console.warn(`[Tracker] Corrupted field state for ${fieldName}, skipping`);
              }
            });

            if (hasCorruption) {
              console.warn('[Tracker] Interaction state corruption detected, recovered valid fields');
            }

            setInteractionState(validatedInteractions);
          } else {
            throw new Error('Invalid state structure');
          }
        } catch (parseError) {
          console.error('[Tracker] Failed to parse interaction state:', parseError);
          await AsyncStorage.removeItem(storageKey);
          setInteractionState({});
        }
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('[Tracker] Failed to load interaction state:', error);
      setInteractionState({});
      setIsInitialized(true);
    }
  }, [storageKey, config.tracking?.trackFieldModifications]);

  /**
   * Save interaction state to AsyncStorage
   */
  const saveInteractionState = useCallback(async (state) => {
    if (!config.tracking?.trackFieldModifications) return;

    try {
      const stateToSave = {
        fieldInteractions: state,
        sessionId: sessionIdRef.current,
        lastUpdated: new Date().toISOString()
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('[Tracker] Failed to save interaction state:', error);
    }
  }, [storageKey, config.tracking?.trackFieldModifications]);

  /**
   * Mark a field as user-modified
   */
  const markFieldAsModified = useCallback((fieldName, value) => {
    if (!config.tracking?.trackFieldModifications) return;

    setInteractionState(prevState => {
      const existingState = prevState[fieldName] || {};
      const newState = {
        ...prevState,
        [fieldName]: {
          isUserModified: true,
          lastModified: new Date().toISOString(),
          initialValue: existingState.initialValue !== undefined ? existingState.initialValue : value
        }
      };

      // Save to AsyncStorage asynchronously
      saveInteractionState(newState);

      return newState;
    });
  }, [saveInteractionState, config.tracking?.trackFieldModifications]);

  /**
   * Check if a field has been user-modified
   */
  const isFieldUserModified = useCallback((fieldName) => {
    if (!config.tracking?.trackFieldModifications) return true; // If tracking disabled, treat all as modified
    return interactionState[fieldName]?.isUserModified || false;
  }, [interactionState, config.tracking?.trackFieldModifications]);

  /**
   * Get field interaction details
   */
  const getFieldInteractionDetails = useCallback((fieldName) => {
    return interactionState[fieldName] || {
      isUserModified: false,
      lastModified: null,
      initialValue: null
    };
  }, [interactionState]);

  /**
   * Mark a field as pre-filled (not user-modified)
   */
  const markFieldAsPreFilled = useCallback((fieldName, value) => {
    if (!config.tracking?.trackFieldModifications) return;

    setInteractionState(prevState => {
      // Don't overwrite if already user-modified
      if (prevState[fieldName]?.isUserModified) {
        return prevState;
      }

      const newState = {
        ...prevState,
        [fieldName]: {
          isUserModified: false,
          lastModified: new Date().toISOString(),
          initialValue: value
        }
      };

      saveInteractionState(newState);
      return newState;
    });
  }, [saveInteractionState, config.tracking?.trackFieldModifications]);

  /**
   * Reset interaction state for a specific field
   */
  const resetFieldInteraction = useCallback((fieldName) => {
    if (!config.tracking?.trackFieldModifications) return;

    setInteractionState(prevState => {
      const newState = { ...prevState };
      delete newState[fieldName];
      saveInteractionState(newState);
      return newState;
    });
  }, [saveInteractionState, config.tracking?.trackFieldModifications]);

  /**
   * Get all user-modified fields
   */
  const getUserModifiedFields = useCallback(() => {
    return Object.keys(interactionState).filter(fieldName =>
      interactionState[fieldName]?.isUserModified
    );
  }, [interactionState]);

  /**
   * Clear all interaction state
   */
  const clearInteractionState = useCallback(async () => {
    setInteractionState({});
    try {
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error('[Tracker] Failed to clear interaction state:', error);
    }
  }, [storageKey]);

  // Load interaction state on mount
  useEffect(() => {
    loadInteractionState();
  }, [loadInteractionState]);

  return {
    // State
    interactionState,
    isInitialized,
    sessionId: sessionIdRef.current,

    // Methods
    markFieldAsModified,
    markFieldAsPreFilled,
    isFieldUserModified,
    getFieldInteractionDetails,
    resetFieldInteraction,
    getUserModifiedFields,
    clearInteractionState,
    loadInteractionState,
  };
};

export default useTemplateUserInteractionTracker;
