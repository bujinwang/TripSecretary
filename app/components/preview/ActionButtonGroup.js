// TDAC Entry Pack Preview - ActionButtonGroup Component
// Primary and secondary CTAs for main user actions

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../i18n/LocaleContext';
import { previewTheme } from '../../theme/preview-tokens';
import { ANIMATION_DURATION } from '../../utils/animations/previewAnimations';
import { PreviewHaptics } from '../../utils/haptics';

const AnimatedTouchable = Animated.createAnimatedComponent(Animated.View);

/**
 * ActionButtonGroup Component
 *
 * Primary and secondary action buttons fixed to bottom of screen.
 * Renders based on entry pack status.
 *
 * @param {Object} props
 * @param {'preview-incomplete' | 'preview-complete' | 'submitted'} props.variant - Button group variant
 * @param {Function} props.onPrimaryPress - Primary button press handler
 * @param {Function} props.onSecondaryPress - Secondary button press handler (optional)
 * @param {string} props.primaryLabel - Custom primary button label (optional)
 * @param {string} props.secondaryLabel - Custom secondary button label (optional)
 * @param {boolean} props.primaryLoading - Show loading state on primary button
 * @param {boolean} props.primaryDisabled - Disable primary button
 * @param {boolean} props.secondaryDisabled - Disable secondary button
 * @param {boolean} props.fixed - Whether to fix to bottom (default: true)
 * @param {Object} props.style - Additional styles
 *
 * @example
 * <ActionButtonGroup
 *   variant="preview-complete"
 *   onPrimaryPress={() => handleSubmit()}
 *   onSecondaryPress={() => handleContinueEditing()}
 *   primaryLoading={isSubmitting}
 * />
 */
const ActionButtonGroup = ({
  variant = 'preview-incomplete',
  onPrimaryPress,
  onSecondaryPress,
  primaryLabel,
  secondaryLabel,
  primaryLoading = false,
  primaryDisabled = false,
  secondaryDisabled = false,
  fixed = true,
  style,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Variant configuration
  const variantConfig = {
    'preview-incomplete': {
      primaryKey: 'preview.actions.continueEditing',
      primaryDefault: 'Continue Editing',
      primaryIcon: 'edit-2',
      showSecondary: false,
    },
    'preview-complete': {
      primaryKey: 'preview.actions.submit',
      primaryDefault: 'Submit TDAC Entry Card',
      primaryIcon: 'arrow-right',
      secondaryKey: 'preview.actions.continueEditing',
      secondaryDefault: 'Continue Editing',
      secondaryIcon: 'edit-2',
      showSecondary: true,
    },
    'preview-info': {
      primaryKey: 'common.back',
      primaryDefault: 'Back',
      primaryIcon: 'arrow-left',
      showSecondary: false,
    },
    submitted: {
      primaryKey: 'preview.actions.viewPdf',
      primaryDefault: 'View PDF',
      primaryIcon: 'file-text',
      secondaryKey: 'preview.actions.share',
      secondaryDefault: 'Share',
      secondaryIcon: 'share-2',
      showSecondary: true,
    },
  };

  const config = variantConfig[variant];

  // Animation values for button press
  const primaryScale = useSharedValue(1);
  const secondaryScale = useSharedValue(1);

  const primaryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: primaryScale.value }],
  }));

  const secondaryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: secondaryScale.value }],
  }));

  // Primary button press handler with animation
  const handlePrimaryPress = () => {
    if (primaryDisabled || primaryLoading) return;

    // Scale animation: 1.0 → 0.97 → 1.0
    primaryScale.value = withSequence(
      withTiming(0.97, { duration: ANIMATION_DURATION.FAST }),
      withTiming(1.0, { duration: ANIMATION_DURATION.FAST })
    );

    // Haptic feedback
    if (variant === 'preview-complete') {
      PreviewHaptics.primaryAction();
    } else {
      PreviewHaptics.buttonPress();
    }

    if (onPrimaryPress) {
      onPrimaryPress();
    }
  };

  // Secondary button press handler with animation
  const handleSecondaryPress = () => {
    if (secondaryDisabled) return;

    secondaryScale.value = withSequence(
      withTiming(0.97, { duration: ANIMATION_DURATION.FAST }),
      withTiming(1.0, { duration: ANIMATION_DURATION.FAST })
    );

    PreviewHaptics.buttonPress();

    if (onSecondaryPress) {
      onSecondaryPress();
    }
  };

  const containerStyle = fixed
    ? [
        styles.fixedContainer,
        { paddingBottom: insets.bottom + previewTheme.spacing.md },
      ]
    : styles.container;

  return (
    <View style={[containerStyle, style]}>
      {/* Primary Button */}
      <AnimatedTouchable
        style={[
          styles.primaryButton,
          (primaryDisabled || primaryLoading) && styles.primaryButtonDisabled,
          primaryAnimatedStyle,
        ]}
        onTouchEnd={handlePrimaryPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={
          primaryLabel || t(config.primaryKey, { defaultValue: config.primaryDefault })
        }
        accessibilityHint={
          variant === 'preview-complete'
            ? t('preview.actions.submitHint', {
                defaultValue: 'Double tap to submit your entry pack for processing',
              })
            : undefined
        }
        accessibilityState={{ disabled: primaryDisabled || primaryLoading }}
      >
        {primaryLoading ? (
          <ActivityIndicator color={previewTheme.colors.white} />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>
              {primaryLabel || t(config.primaryKey, { defaultValue: config.primaryDefault })}
            </Text>
            <Feather
              name={config.primaryIcon}
              size={previewTheme.iconSizes.medium}
              color={previewTheme.colors.white}
              style={styles.buttonIcon}
            />
          </>
        )}
      </AnimatedTouchable>

      {/* Secondary Button (conditional) */}
      {config.showSecondary && onSecondaryPress && (
        <AnimatedTouchable
          style={[
            styles.secondaryButton,
            secondaryDisabled && styles.secondaryButtonDisabled,
            secondaryAnimatedStyle,
          ]}
          onTouchEnd={handleSecondaryPress}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={
            secondaryLabel || t(config.secondaryKey, { defaultValue: config.secondaryDefault })
          }
          accessibilityState={{ disabled: secondaryDisabled }}
        >
          <Feather
            name={config.secondaryIcon}
            size={previewTheme.iconSizes.medium}
            color={
              secondaryDisabled
                ? previewTheme.colors.neutral400
                : previewTheme.colors.actionPrimary
            }
            style={styles.buttonIcon}
          />
          <Text
            style={[
              styles.secondaryButtonText,
              secondaryDisabled && styles.secondaryButtonTextDisabled,
            ]}
          >
            {secondaryLabel || t(config.secondaryKey, { defaultValue: config.secondaryDefault })}
          </Text>
        </AnimatedTouchable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: previewTheme.spacing.md,
    paddingVertical: previewTheme.spacing.md,
  },
  fixedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: previewTheme.colors.white,
    paddingHorizontal: previewTheme.spacing.md,
    paddingTop: previewTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: previewTheme.colors.neutral200,
    ...previewTheme.shadows.elevation3,
  },
  // Primary button styles
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: previewTheme.colors.actionPrimary,
    height: previewTheme.dimensions.buttonHeight.large,
    borderRadius: previewTheme.borderRadius.large,
    paddingHorizontal: previewTheme.spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(16, 185, 129, 0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryButtonDisabled: {
    backgroundColor: previewTheme.colors.neutral200,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  primaryButtonText: {
    ...previewTheme.typography.button,
    color: previewTheme.colors.white,
  },
  // Secondary button styles
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: previewTheme.colors.white,
    height: previewTheme.dimensions.buttonHeight.large,
    borderRadius: previewTheme.borderRadius.large,
    borderWidth: previewTheme.dimensions.borderWidth.medium,
    borderColor: previewTheme.colors.actionPrimary,
    paddingHorizontal: previewTheme.spacing.lg,
    marginTop: previewTheme.spacing.sm,
  },
  secondaryButtonDisabled: {
    borderColor: previewTheme.colors.neutral200,
    backgroundColor: previewTheme.colors.neutral50,
  },
  secondaryButtonText: {
    ...previewTheme.typography.button,
    color: previewTheme.colors.actionPrimary,
  },
  secondaryButtonTextDisabled: {
    color: previewTheme.colors.neutral400,
  },
  buttonIcon: {
    marginLeft: previewTheme.spacing.xs,
  },
});

// Memoize component for performance
export default React.memo(ActionButtonGroup);
