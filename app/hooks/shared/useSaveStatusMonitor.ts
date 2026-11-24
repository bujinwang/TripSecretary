/**
 * useSaveStatusMonitor Hook
 *
 * Monitors DebouncedSave status and updates component state.
 */
import { useEffect } from 'react';
import DebouncedSave from '../../utils/DebouncedSave';

interface UseSaveStatusMonitorParams {
  saveKey: string;
  onStatusChange: (updater: (prevStatus: string | null) => string | null) => void;
  interval?: number;
}

export const useSaveStatusMonitor = ({
  saveKey,
  onStatusChange,
  interval = 100,
}: UseSaveStatusMonitorParams) => {
  useEffect(() => {
    if (!onStatusChange) {
      console.warn(`[${saveKey}] No onStatusChange callback provided to useSaveStatusMonitor`);
      return;
    }

    const intervalId = setInterval(() => {
      const currentStatus = DebouncedSave.getSaveState(saveKey);

      onStatusChange((prevStatus: string | null) => {
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
