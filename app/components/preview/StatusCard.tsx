// @ts-nocheck

// TDAC Entry Pack Preview - StatusCard Component
// Displays submission status and required actions

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AccessibilityInfo } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from '../../i18n/LocaleContext';
import { previewTheme } from '../../theme/preview-tokens';
import { ANIMATION_DURATION, ANIMATION_EASING } from '../../utils/animations/previewAnimations';
import { PreviewHaptics } from '../../utils/haptics';

/**
 * StatusCard Component
 *
 * Primary focal point showing submission status and required actions.
 *
 * @param {Object} props
 * @param {'incomplete' | 'complete' | 'submitted' | 'error'} props.variant - Status variant
 * @param {string} props.title - Custom title (optional, overrides variant title)
 * @param {Array<Object>} props.missingItems - Array of missing items with {key, label, onPress}
 * @param {Object} props.progress - Progress info {completed, total}
 * @param {Function} props.onActionPress - Callback for action button press
 * @param {string} props.actionLabel - Custom action button label (optional)
 * @param {Object} props.style - Additional styles
 *
 * @example
 * <StatusCard
 *   variant="incomplete"
 *   title="Draft - Action Required"
 *   progress={{completed: 2, total: 4}}
 *   missingItems={[
 *     {key: 'tdac', label: 'TDAC Card', onPress: () => nav.navigate('TDAC')}
 *   ]}
 *   onActionPress={() => navigation.navigate('EditTDAC')}
 * />
 */
const StatusCard = ({
  variant = 'incomplete',
  title,
  missingItems = [],
  progress,
  onActionPress,
  actionLabel,
  style,
}) => {
  const { t } = useTranslation();
  const [reduceMotion, setReduceMotion] = useState(false);

  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  // Check reduce motion setting
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });
  }, []);

  // Entrance animation on mount
  useEffect(() => {
    if (reduceMotion) {
      // Simple fade for reduce motion
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = 1;
    } else {
      // Fade + scale with bounce
      opacity.value = withTiming(1, {
        duration: ANIMATION_DURATION.SLOW,
        easing: ANIMATION_EASING.EASE_OUT_BACK,
      });
      scale.value = withTiming(1, {
        duration: ANIMATION_DURATION.SLOW,
        easing: ANIMATION_EASING.EASE_OUT_BACK,
      });
    }
  }, [reduceMotion]);

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Configuration for each variant
  const variantConfig = {
    incomplete: {
      icon: 'alert-triangle',
      titleKey: 'preview.status.incomplete.title',
      titleDefault: 'Draft - Action Required',
      color: previewTheme.colors.statusIncomplete,
      bgColor: previewTheme.colors.white,
      borderColor: previewTheme.colors.statusIncomplete,
      actionLabelKey: 'preview.status.incomplete.action',
      actionLabelDefault: 'Add Information',
      showMissingItems: true,
    },
    complete: {
      icon: 'check-circle',
      titleKey: 'preview.status.complete.title',
      titleDefault: 'Ready to Submit',
      color: previewTheme.colors.statusComplete,
      bgColor: previewTheme.colors.white,
      borderColor: previewTheme.colors.statusComplete,
      actionLabelKey: 'preview.status.complete.action',
      actionLabelDefault: 'Submit Now',
      showMissingItems: false,
    },
    submitted: {
      icon: 'info',
      titleKey: 'preview.status.submitted.title',
      titleDefault: 'Submitted',
      color: previewTheme.colors.statusInfo,
      bgColor: previewTheme.colors.white,
      borderColor: previewTheme.colors.statusInfo,
      actionLabelKey: 'preview.status.submitted.action',
      actionLabelDefault: 'View Details',
      showMissingItems: false,
    },
    error: {
      icon: 'x-circle',
      titleKey: 'preview.status.error.title',
      titleDefault: 'Submission Failed',
      color: previewTheme.colors.statusError,
      bgColor: previewTheme.colors.white,
      borderColor: previewTheme.colors.statusError,
      actionLabelKey: 'preview.status.error.action',
      actionLabelDefault: 'Retry',
      showMissingItems: false,
    },
  };

  const config = variantConfig[variant];

  // Limit missing items display to 3, show "+X more" if needed
  const visibleMissingItems = missingItems.slice(0, 3);
  const remainingCount = missingItems.length - 3;

  // Calculate display title
  const displayTitle = title || t(config.titleKey, { defaultValue: config.titleDefault });

  // Handle action press with haptic feedback
  const handleActionPress = () => {
    PreviewHaptics.buttonPress();
    if (onActionPress) {
      onActionPress();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { borderColor: config.borderColor, backgroundColor: config.bgColor },
        animatedStyle,
        style,
      ]}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={displayTitle}
    >
      {/* Header with icon and title */}
      <View style={styles.header}>
        <Feather
          name={config.icon}
          size={previewTheme.iconSizes.large}
          color={config.color}
          accessibilityLabel={`${variant} status icon`}
        />
        <Text
          style={[styles.title, { color: config.color }]}
          accessibilityRole="header"
        >
          {displayTitle}
        </Text>
      </View>

      {/* Progress indicator (if provided) */}
      {progress && (
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            {t('preview.status.completionProgress', {
              completed: progress.completed,
              total: progress.total,
              defaultValue: `${progress.completed} of ${progress.total} sections complete`,
            })}
          </Text>
        </View>
      )}

      {/* Missing items list (only for incomplete status) */}
      {config.showMissingItems && missingItems.length > 0 && (
        <View style={styles.missingSection}>
          <Text style={styles.missingSectionTitle}>
            {t('preview.status.missing', { defaultValue: 'Missing:' })}
          </Text>
          {visibleMissingItems.map((item, index) => (
            <TouchableOpacity
              key={item.key || index}
              style={styles.missingItem}
              onPress={item.onPress}
              activeOpacity={item.onPress ? 0.7 : 1}
            >
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.missingItemText}>{item.label || item}</Text>
              {item.onPress && (
                <Feather
                  name="edit-2"
                  size={previewTheme.iconSizes.small}
                  color={previewTheme.colors.neutral400}
                  style={styles.editIcon}
                />
              )}
            </TouchableOpacity>
          ))}
          {remainingCount > 0 && (
            <Text style={styles.moreItems}>
              {t('preview.status.missing.more', {
                defaultValue: `+ ${remainingCount} more`,
                count: remainingCount,
              })}
            </Text>
          )}
        </View>
      )}

      {/* Action button */}
      {onActionPress && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: config.color }]}
          onPress={handleActionPress}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={
            actionLabel || t(config.actionLabelKey, { defaultValue: config.actionLabelDefault })
          }
          accessibilityHint={t('preview.status.actionHint', {
            defaultValue: 'Double tap to take action',
          })}
        >
          <Feather
            name="arrow-right"
            size={previewTheme.iconSizes.medium}
            color={previewTheme.colors.white}
          />
          <Text style={styles.actionButtonText}>
            {actionLabel || t(config.actionLabelKey, { defaultValue: config.actionLabelDefault })}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: previewTheme.borderRadius.large,
    borderWidth: previewTheme.dimensions.borderWidth.medium,
    padding: previewTheme.spacing.md,
    ...previewTheme.shadows.elevation2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: previewTheme.spacing.sm,
  },
  title: {
    ...previewTheme.typography.h3,
    marginLeft: previewTheme.spacing.sm,
    flex: 1,
  },
  missingSection: {
    marginTop: previewTheme.spacing.sm,
    marginBottom: previewTheme.spacing.md,
  },
  progressSection: {
    marginTop: previewTheme.spacing.xs,
    paddingTop: previewTheme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: previewTheme.colors.neutral200,
  },
  progressText: {
    ...previewTheme.typography.small,
    color: previewTheme.colors.neutral600,
  },
  missingSectionTitle: {
    ...previewTheme.typography.bodyBold,
    color: previewTheme.colors.neutral900,
    marginBottom: previewTheme.spacing.xs,
  },
  missingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: previewTheme.spacing.xs,
    paddingLeft: previewTheme.spacing.sm,
    paddingVertical: previewTheme.spacing.xs,
  },
  editIcon: {
    marginLeft: previewTheme.spacing.xs,
  },
  bullet: {
    ...previewTheme.typography.body,
    color: previewTheme.colors.neutral600,
    marginRight: previewTheme.spacing.xs,
  },
  missingItemText: {
    ...previewTheme.typography.body,
    color: previewTheme.colors.neutral600,
    flex: 1,
  },
  moreItems: {
    ...previewTheme.typography.small,
    color: previewTheme.colors.neutral400,
    marginTop: previewTheme.spacing.xs,
    paddingLeft: previewTheme.spacing.md,
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: previewTheme.spacing.sm,
    paddingHorizontal: previewTheme.spacing.md,
    borderRadius: previewTheme.borderRadius.medium,
    marginTop: previewTheme.spacing.sm,
  },
  actionButtonText: {
    ...previewTheme.typography.bodyBold,
    color: previewTheme.colors.white,
    marginLeft: previewTheme.spacing.xs,
  },
});

// Memoize component for performance
export default React.memo(StatusCard);
