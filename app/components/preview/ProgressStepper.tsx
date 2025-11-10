// @ts-nocheck

// TDAC Entry Pack Preview - ProgressStepper Component
// Vertical progress indicator replacing horizontal tabs

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from '../../i18n/LocaleContext';
import { previewTheme } from '../../theme/preview-tokens';
import { ANIMATION_DURATION, ANIMATION_EASING } from '../../utils/animations/previewAnimations';
import { PreviewHaptics } from '../../utils/haptics';

/**
 * ProgressStepper Component
 *
 * Vertical progress stepper showing 4 steps with completion status.
 * Replaces horizontal tab navigation for better mobile UX.
 *
 * @param {Object} props
 * @param {Array<Object>} props.steps - Array of step objects
 * @param {string} props.steps[].id - Unique step identifier
 * @param {string} props.steps[].labelKey - Translation key for step label
 * @param {string} props.steps[].labelDefault - Default label text
 * @param {'completed' | 'current' | 'pending' | 'error'} props.steps[].status - Step status
 * @param {string} props.currentStepId - Currently active step ID
 * @param {Function} props.onStepPress - Callback when step is tapped
 * @param {boolean} props.collapsible - Whether stepper can collapse (default: true)
 * @param {boolean} props.initiallyCollapsed - Initial collapsed state (default: false)
 * @param {Object} props.style - Additional styles
 *
 * @example
 * <ProgressStepper
 *   steps={[
 *     { id: 'tdac', labelKey: 'preview.steps.tdac', labelDefault: 'TDAC Card', status: 'completed' },
 *     { id: 'personal', labelKey: 'preview.steps.personal', labelDefault: 'Personal Info', status: 'current' },
 *     { id: 'travel', labelKey: 'preview.steps.travel', labelDefault: 'Travel Details', status: 'pending' },
 *     { id: 'funds', labelKey: 'preview.steps.funds', labelDefault: 'Proof of Funds', status: 'pending' },
 *   ]}
 *   currentStepId="personal"
 *   onStepPress={(stepId) => handleStepNavigation(stepId)}
 * />
 */
const ProgressStepper = ({
  steps = [],
  currentStepId,
  onStepPress,
  collapsible = true,
  initiallyCollapsed = false,
  style,
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [previousSteps, setPreviousSteps] = useState(steps);

  // Check reduce motion setting
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });
  }, []);

  // Track step changes for animations
  useEffect(() => {
    if (steps !== previousSteps) {
      setPreviousSteps(steps);
    }
  }, [steps]);

  // Status configuration
  const statusConfig = {
    completed: {
      icon: 'check-circle',
      color: previewTheme.colors.statusComplete,
      bgColor: previewTheme.colors.statusCompleteLight,
    },
    current: {
      icon: 'alert-triangle',
      color: previewTheme.colors.statusIncomplete,
      bgColor: previewTheme.colors.statusIncompleteLight,
    },
    pending: {
      icon: 'circle',
      color: previewTheme.colors.neutral400,
      bgColor: previewTheme.colors.neutral100,
    },
    error: {
      icon: 'x-circle',
      color: previewTheme.colors.statusError,
      bgColor: previewTheme.colors.statusErrorLight,
    },
  };

  const handleStepPress = (stepId) => {
    PreviewHaptics.stepperChange();
    if (onStepPress) {
      onStepPress(stepId);
    }
  };

  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Filter to show only current step when collapsed
  const visibleSteps = isCollapsed
    ? steps.filter((step) => step.id === currentStepId)
    : steps;

  // Animated Step Component
  const AnimatedStep = ({ step, index, isLast, isCurrent }) => {
    const config = statusConfig[step.status] || statusConfig.pending;

    // Animation values for status changes
    const iconScale = useSharedValue(1);
    const iconOpacity = useSharedValue(1);

    // Detect status change
    const prevStep = previousSteps.find(s => s.id === step.id);

    useEffect(() => {
      if (prevStep && prevStep.status !== step.status && !reduceMotion) {
        // Pulse animation on status change
        iconScale.value = withSequence(
          withTiming(0.8, { duration: 100, easing: ANIMATION_EASING.EASE_IN_OUT }),
          withTiming(1.2, { duration: 150, easing: ANIMATION_EASING.EASE_IN_OUT }),
          withTiming(1.0, { duration: 100, easing: ANIMATION_EASING.EASE_IN_OUT })
        );

        // Trigger haptic feedback on completion
        if (step.status === 'completed') {
          PreviewHaptics.statusChange('completed');
        }
      }
    }, [step.status]);

    const iconAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: iconScale.value }],
      opacity: iconOpacity.value,
    }));

    return (
      <View key={step.id} style={styles.stepWrapper}>
        <TouchableOpacity
          style={[styles.step, isCurrent && styles.stepCurrent]}
          onPress={() => handleStepPress(step.id)}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${t(step.labelKey, { defaultValue: step.labelDefault })} - ${
            step.status
          }`}
          accessibilityHint={
            isCurrent
              ? t('preview.stepper.currentHint', { defaultValue: 'Current section' })
              : t('preview.stepper.navigateHint', {
                  defaultValue: 'Tap to navigate to this section',
                })
          }
          accessibilityState={{ selected: isCurrent }}
        >
          {/* Icon indicator with animation */}
          <Animated.View style={[styles.iconContainer, { backgroundColor: config.bgColor }, iconAnimatedStyle]}>
            <Feather
              name={config.icon}
              size={previewTheme.iconSizes.medium}
              color={config.color}
            />
          </Animated.View>

          {/* Step label (bilingual) */}
          <View style={styles.labelContainer}>
            <Text
              style={[
                styles.labelText,
                isCurrent && styles.labelTextCurrent,
                { color: config.color },
              ]}
            >
              {t(step.labelKey, { defaultValue: step.labelDefault })}
            </Text>
            {/* Show "You are here" indicator for current step */}
            {isCurrent && (
              <Text style={styles.currentIndicator}>
                {t('preview.stepper.current', { defaultValue: '← You are here' })}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Connection line (except for last item) */}
        {!isLast && (
          <View style={[styles.connectionLine, { borderLeftColor: config.color }]} />
        )}
      </View>
    );
  };

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="menu"
      accessibilityLabel={t('preview.stepper.label', { defaultValue: 'Progress stepper' })}
    >
      {/* Header with collapse toggle */}
      {collapsible && (
        <TouchableOpacity
          style={styles.collapseButton}
          onPress={toggleCollapse}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={
            isCollapsed
              ? t('preview.stepper.expand', { defaultValue: 'Expand progress' })
              : t('preview.stepper.collapse', { defaultValue: 'Collapse progress' })
          }
        >
          <Text style={styles.collapseButtonText}>
            {t('preview.stepper.title', { defaultValue: 'Progress' })}
          </Text>
          <Feather
            name={isCollapsed ? 'chevron-down' : 'chevron-up'}
            size={previewTheme.iconSizes.medium}
            color={previewTheme.colors.neutral600}
          />
        </TouchableOpacity>
      )}

      {/* Steps */}
      <View style={styles.stepsContainer}>
        {visibleSteps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          const isLast = index === visibleSteps.length - 1;

          return (
            <AnimatedStep
              key={step.id}
              step={step}
              index={index}
              isLast={isLast}
              isCurrent={isCurrent}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: previewTheme.colors.white,
    borderRadius: previewTheme.borderRadius.medium,
    padding: previewTheme.spacing.md,
    ...previewTheme.shadows.elevation1,
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: previewTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: previewTheme.colors.neutral200,
    marginBottom: previewTheme.spacing.md,
  },
  collapseButtonText: {
    ...previewTheme.typography.h3,
    color: previewTheme.colors.neutral900,
  },
  stepsContainer: {
    // Container for steps
  },
  stepWrapper: {
    position: 'relative',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: previewTheme.spacing.sm,
    minHeight: 48, // Ensure touch target size
  },
  stepCurrent: {
    // Add any special styling for current step
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: previewTheme.spacing.sm,
  },
  labelContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  labelText: {
    ...previewTheme.typography.body,
  },
  labelTextCurrent: {
    ...previewTheme.typography.bodyBold,
  },
  currentIndicator: {
    ...previewTheme.typography.small,
    color: previewTheme.colors.statusIncomplete,
    marginTop: previewTheme.spacing.xs,
    fontStyle: 'italic',
  },
  connectionLine: {
    position: 'absolute',
    left: 20, // Center of icon (40/2)
    top: 48, // Below icon
    bottom: -12, // Connect to next icon
    borderLeftWidth: previewTheme.dimensions.stepperLineWidth,
    borderStyle: 'solid',
  },
});

// Memoize component for performance
export default React.memo(ProgressStepper);
