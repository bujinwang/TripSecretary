/**
 * useNavigationPersistence Hook
 *
 * Manages data persistence during navigation lifecycle events.
 * Handles automatic data reloading on screen focus and saving on blur.
 */
import { useEffect } from 'react';
import DebouncedSave from '../../utils/DebouncedSave';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Navigation = any;

interface UseNavigationPersistenceParams {
  navigation: Navigation;
  saveKey: string;
  onFocus?: () => Promise<void> | void;
  onBlur?: () => Promise<void> | void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dependencies?: any[];
}

export const useNavigationPersistence = ({
  navigation,
  saveKey,
  onFocus,
  onBlur,
  dependencies = [],
}: UseNavigationPersistenceParams) => {
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', async () => {
      if (onFocus) {
        try {
          await onFocus();
        } catch (error) {
          console.error(`[${saveKey}] Failed to reload data on focus:`, error);
        }
      }
    });

    const unsubscribeBlur = navigation.addListener('blur', async () => {
      try {
        await DebouncedSave.flushPendingSave(saveKey);
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

  useEffect(() => () => {
      try {
        DebouncedSave.flushPendingSave(saveKey);
      } catch (error) {
        console.error(`[${saveKey}] Failed to flush saves on unmount:`, error);
      }
    }, [saveKey]);
};

export default useNavigationPersistence;
