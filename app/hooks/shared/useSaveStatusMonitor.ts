// @ts-nocheck

/**
 * useSaveStatusMonitor Hook
 *
 * Monitors DebouncedSave status and updates component state.
 * Uses optimized polling with functional setState to prevent infinite loops.
 *
 * @example
 * useSaveStatusMonitor({
 *   saveKey: 'thailand_travel_info',
 *   onStatusChange: (status) => formState.setSaveStatus(status),
 *   interval: 100
 * });
 */

import { useEffect } from 'react';
import DebouncedSave from '../../utils/DebouncedSave';

/**
 * Custom hook to monitor save status from DebouncedSave
 *
 * @param {Object} params - Hook parameters
 * @param {string} params.saveKey - Unique key for DebouncedSave
 * @param {Function} params.onStatusChange - Callback to update status (should use functional setState)
 * @param {number} params.interval - Polling interval in milliseconds (default: 100)
 */
export const useSaveStatusMonitor = ({
  saveKey,
  onStatusChange,
  interval = 100
}) => {
  useEffect(() => {
    if (!onStatusChange) {
      console.warn(`[${saveKey}] No onStatusChange callback provided to useSaveStatusMonitor`);
      return;
    }

    const intervalId = setInterval(() => {
      const currentStatus = DebouncedSave.getSaveState(saveKey);

      // Use functional setState pattern to prevent infinite loops
      // The callback checks if status actually changed before updating
      onStatusChange(prevStatus => {
        if (prevStatus !== currentStatus) {
          return currentStatus;
        }
        return prevStatus;
      });
    }, interval);

    return () => clearInterval(intervalId);
  }, [saveKey, onStatusChange, interval]);
};

export default useSaveStatusMonitor;
