/**
 * useThailandPrimaryButton Hook
 *
 * Custom hook to determine the primary action button state for Thailand Entry Flow
 * based on completion status, arrival date, and entry pack status.
 *
 * Extracted from ThailandEntryFlowScreen to improve maintainability and testability.
 */

import { useMemo } from 'react';
import { useLocale } from '../../i18n/LocaleContext';
import ArrivalWindowCalculator from '../../utils/thailand/ArrivalWindowCalculator';

/**
 * @typedef {Object} ButtonState
 * @property {string} title - Button text to display
 * @property {string} action - Action type identifier
 * @property {boolean} disabled - Whether button is disabled
 * @property {string} variant - Button style variant ('primary' | 'secondary')
 * @property {string} [subtitle] - Optional subtitle text below button
 */

/**
 * Hook to calculate primary button state based on entry flow status
 *
 * @param {Object} params - Hook parameters
 * @param {number} params.completionPercent - Overall completion percentage (0-100)
 * @param {string|null} params.arrivalDate - User's arrival date (ISO string)
 * @param {boolean} params.showSupersededStatus - Whether entry pack is superseded
 * @param {string|null} params.entryPackStatus - Entry pack status ('submitted', 'superseded', etc.)
 * @returns {ButtonState} Button state configuration
 */
interface UseThailandPrimaryButtonParams {
  completionPercent: number;
  arrivalDate: string | null;
  showSupersededStatus: boolean;
  entryPackStatus: string | null;
}

export const useThailandPrimaryButton = ({
  completionPercent,
  arrivalDate,
  showSupersededStatus,
  entryPackStatus,
}: UseThailandPrimaryButtonParams) => {
  const { t } = useLocale();

  const buttonState = useMemo(() => {
    // Priority 1: Check if entry pack is superseded (needs resubmission)
    if (showSupersededStatus || entryPackStatus === 'superseded') {
      return {
        title: '更新我的泰国准备信息 🌺',
        action: 'resubmit_tdac',
        disabled: false,
        variant: 'primary',
        subtitle: '你的信息有更新，让我们重新准备最新的入境卡'
      };
    }

    // Check completion status
    const isComplete = completionPercent === 100;

    // Check submission window status
    let canSubmitNow = false;
    if (arrivalDate) {
      try {
        const window = ArrivalWindowCalculator.getSubmissionWindow(arrivalDate);
        canSubmitNow = window.canSubmit;
      } catch (error) {
        console.warn('Failed to calculate submission window:', error);
        canSubmitNow = false;
      }
    }

    // Priority 2: High completion (>=80%) + complete + can submit
    if (completionPercent >= 80 && isComplete && canSubmitNow) {
      return {
        title: '提交入境卡',
        action: 'submit_tdac',
        disabled: false,
        variant: 'primary'
      };
    }

    // Priority 3: Medium completion (>=60%) - show preview option
    if (completionPercent >= 60) {
      return {
        title: '查看我的通关包 📋',
        action: 'view_entry_pack',
        disabled: false,
        variant: 'primary',
        subtitle: '看看你已经准备好的入境信息'
      };
    }

    // Priority 4: Incomplete - encourage continued preparation
    if (!isComplete) {
      return {
        title: '继续准备我的泰国之旅 💪',
        action: 'continue_improving',
        disabled: false,
        variant: 'secondary'
      };
    }

    // Priority 5: Complete but no arrival date
    if (isComplete && !arrivalDate) {
      return {
        title: '告诉我你什么时候到泰国 ✈️',
        action: 'continue_improving',
        disabled: false,
        variant: 'secondary',
        subtitle: '设置抵达日期，我们就能帮你找到最佳提交时间'
      };
    }

    // Priority 6: Complete but submission window not open
    if (isComplete && !canSubmitNow) {
      return {
        title: t('progressiveEntryFlow.countdown.preWindow', { defaultValue: '等待提交窗口' }),
        action: 'wait_for_window',
        disabled: true,
        variant: 'primary',
        subtitle: t('progressiveEntryFlow.countdown.preWindow', {
          defaultValue: '提交窗口尚未开启'
        })
      };
    }

    // Default fallback: Ready to submit
    return {
      title: '提交入境卡',
      action: 'submit_tdac',
      disabled: false,
      variant: 'primary'
    };
  }, [completionPercent, arrivalDate, showSupersededStatus, entryPackStatus, t]);

  return buttonState;
};

export default useThailandPrimaryButton;
