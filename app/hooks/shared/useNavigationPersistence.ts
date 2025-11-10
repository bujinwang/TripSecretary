// @ts-nocheck

/**
 * useNavigationPersistence Hook
 *
 * Manages data persistence during navigation lifecycle events.
 * Handles automatic data reloading on screen focus and saving on blur.
 *
 * @example
 * useNavigationPersistence({
 *   navigation,
 *   saveKey: 'thailand_travel_info',
 *   onFocus: async () => {
 *     await reloadData();
 *   }
 * });
 */

import { useEffect } from 'react';
import DebouncedSave from '../../utils/DebouncedSave';

/**
 * Custom hook to handle navigation-based data persistence
 *
 * @param {Object} params - Hook parameters
 * @param {Object} params.navigation - React Navigation object
 * @param {string} params.saveKey - Unique key for DebouncedSave
 * @param {Function} params.onFocus - Optional callback when screen comes into focus
 * @param {Function} params.onBlur - Optional callback when screen loses focus
 * @param {Array} params.dependencies - Additional dependencies for useEffect
 */
export const useNavigationPersistence = ({
  navigation,
  saveKey,
  onFocus,
  onBlur,
  dependencies = []
}) => {
  useEffect(() => {
    // Focus listener - reload data when screen comes into focus
    const unsubscribeFocus = navigation.addListener('focus', async () => {
      if (onFocus) {
        try {
          await onFocus();
        } catch (error) {
          console.error(`[${saveKey}] Failed to reload data on focus:`, error);
        }
      }
    });

    // Blur listener - save data when leaving screen
    const unsubscribeBlur = navigation.addListener('blur', async () => {
      try {
        // Flush any pending saves
        await DebouncedSave.flushPendingSave(saveKey);

        // Call custom blur handler if provided
        if (onBlur) {
          await onBlur();
        }
      } catch (error) {
        console.error(`[${saveKey}] Failed to save data on blur:`, error);
      }
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, saveKey, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        DebouncedSave.flushPendingSave(saveKey);
      } catch (error) {
        console.error(`[${saveKey}] Failed to flush saves on unmount:`, error);
      }
    };
  }, [saveKey]);
};

export default useNavigationPersistence;
