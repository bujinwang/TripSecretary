// @ts-nocheck

// Haptic Feedback Utilities for TDAC Entry Pack Preview
// Provides consistent haptic feedback across iOS and Android
// Follows front-end-spec.md guidelines for tactile feedback

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback types
 * Maps to Expo Haptics API with graceful fallbacks
 */
const HapticType = {
  // Light impact - button presses, toggle switches
  LIGHT: 'light',
  // Medium impact - confirmations, selections
  MEDIUM: 'medium',
  // Heavy impact - important actions, errors
  HEAVY: 'heavy',
  // Success notification - positive feedback
  SUCCESS: 'success',
  // Warning notification - caution feedback
  WARNING: 'warning',
  // Error notification - negative feedback
  ERROR: 'error',
  // Selection - picker/stepper changes
  SELECTION: 'selection',
};

/**
 * HapticsManager
 * Centralized haptic feedback management with platform-specific handling
 */
class HapticsManager {
  constructor() {
    this.isEnabled = true;
    this.isSupported = this.checkSupport();
  }

  /**
   * Check if haptics are supported on this device
   * @returns {boolean} True if supported
   */
  checkSupport() {
    // iOS supports haptics on iPhone 7+ (basically all modern devices)
    // Android support varies by device and OS version
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Enable haptic feedback
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Disable haptic feedback (user preference)
   */
  disable() {
    this.isEnabled = false;
  }

  /**
   * Check if haptics are currently enabled
   * @returns {boolean} True if enabled
   */
  isHapticsEnabled() {
    return this.isEnabled && this.isSupported;
  }

  /**
   * Trigger light impact haptic
   * Use for: Button presses, tap interactions
   */
  async light() {
    if (!this.isHapticsEnabled()) {
return;
}

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger medium impact haptic
   * Use for: Confirmations, successful actions
   */
  async medium() {
    if (!this.isHapticsEnabled()) {
return;
}

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger heavy impact haptic
   * Use for: Important actions, alerts
   */
  async heavy() {
    if (!this.isHapticsEnabled()) {
return;
}

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger success notification haptic
   * Use for: Submission success, validation complete
   */
  async success() {
    if (!this.isHapticsEnabled()) {
return;
}

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger warning notification haptic
   * Use for: Incomplete forms, missing information
   */
  async warning() {
    if (!this.isHapticsEnabled()) {
return;
}

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger error notification haptic
   * Use for: Validation errors, submission failures
   */
  async error() {
    if (!this.isHapticsEnabled()) {
return;
}

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger selection haptic
   * Use for: Stepper navigation, picker changes
   */
  async selection() {
    if (!this.isHapticsEnabled()) {
return;
}

    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger haptic by type
   * @param {string} type - Haptic type from HapticType enum
   */
  async trigger(type) {
    if (!this.isHapticsEnabled()) {
return;
}

    switch (type) {
      case HapticType.LIGHT:
        await this.light();
        break;
      case HapticType.MEDIUM:
        await this.medium();
        break;
      case HapticType.HEAVY:
        await this.heavy();
        break;
      case HapticType.SUCCESS:
        await this.success();
        break;
      case HapticType.WARNING:
        await this.warning();
        break;
      case HapticType.ERROR:
        await this.error();
        break;
      case HapticType.SELECTION:
        await this.selection();
        break;
      default:
        console.warn(`Unknown haptic type: ${type}`);
    }
  }
}

// Singleton instance
const hapticsManager = new HapticsManager();

/**
 * Preview-specific haptic feedback functions
 * Ready-to-use helpers for common preview interactions
 */
export const PreviewHaptics = {
  /**
   * Button press feedback
   * Use in: ActionButtonGroup, all touchable buttons
   */
  buttonPress: () => hapticsManager.light(),

  /**
   * Primary action feedback (submit, confirm)
   * Use in: Submit button press
   */
  primaryAction: () => hapticsManager.medium(),

  /**
   * Stepper navigation feedback
   * Use in: ProgressStepper step changes
   */
  stepperChange: () => hapticsManager.selection(),

  /**
   * Status change feedback
   * Use in: ProgressStepper status updates (completed → error)
   */
  statusChange: (status) => {
    if (status === 'completed') {
      return hapticsManager.success();
    } else if (status === 'error') {
      return hapticsManager.error();
    } else if (status === 'current') {
      return hapticsManager.selection();
    }
    return hapticsManager.light();
  },

  /**
   * Validation success feedback
   * Use in: Form validation passes
   */
  validationSuccess: () => hapticsManager.success(),

  /**
   * Validation error feedback
   * Use in: Form validation fails
   */
  validationError: () => hapticsManager.error(),

  /**
   * Warning feedback
   * Use in: Incomplete status, missing information
   */
  warning: () => hapticsManager.warning(),

  /**
   * Alert dismissal feedback
   * Use in: InfoAlert dismissed
   */
  alertDismiss: () => hapticsManager.light(),

  /**
   * Document expand feedback
   * Use in: DocumentPreviewCard tapped to expand
   */
  documentExpand: () => hapticsManager.medium(),

  /**
   * Submission success feedback
   * Use in: Entry pack submission succeeds
   */
  submissionSuccess: () => hapticsManager.success(),

  /**
   * Submission error feedback
   * Use in: Entry pack submission fails
   */
  submissionError: () => hapticsManager.error(),

  /**
   * Pull-to-refresh feedback
   * Use in: Refresh gesture triggered
   */
  refreshTriggered: () => hapticsManager.medium(),

  /**
   * Section scroll feedback (optional)
   * Use in: Auto-scroll to section
   */
  sectionScroll: () => hapticsManager.light(),
};

/**
 * Hook for using haptics in components
 * @returns {Object} Haptic feedback functions
 */
export const useHaptics = () => {
  return {
    trigger: (type) => hapticsManager.trigger(type),
    enable: () => hapticsManager.enable(),
    disable: () => hapticsManager.disable(),
    isEnabled: () => hapticsManager.isHapticsEnabled(),
    ...PreviewHaptics,
  };
};

/**
 * Higher-order component to add haptic feedback to touchables
 * @param {Function} Component - Touchable component
 * @param {string} hapticType - Type of haptic to trigger
 * @returns {Function} Enhanced component
 */
export const withHapticFeedback = (Component, hapticType = HapticType.LIGHT) => {
  return (props) => {
    const handlePress = async (event) => {
      await hapticsManager.trigger(hapticType);
      if (props.onPress) {
        props.onPress(event);
      }
    };

    return <Component {...props} onPress={handlePress} />;
  };
};

// Export singleton instance and types
export { hapticsManager, HapticType };

// Default export
export default {
  manager: hapticsManager,
  PreviewHaptics,
  useHaptics,
  withHapticFeedback,
  HapticType,
};
