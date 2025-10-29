// TDAC Entry Pack Preview - LoadingStates Component
// Skeleton loading states for preview components
// Provides better perceived performance during data loading

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { previewTheme } from '../../theme/preview-tokens';

/**
 * Shimmer animation component
 * Creates a shimmer effect that moves across skeleton elements
 */
const ShimmerEffect = ({ children, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerLoop.start();

    return () => shimmerLoop.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={[styles.shimmerContainer, style]}>
      {children}
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

/**
 * StatusCardSkeleton
 * Loading placeholder for StatusCard component
 */
export const StatusCardSkeleton = ({ style }) => {
  return (
    <View style={[styles.statusCardContainer, style]}>
      <ShimmerEffect>
        {/* Header skeleton */}
        <View style={styles.statusCardHeader}>
          <View style={styles.iconSkeleton} />
          <View style={styles.titleSkeleton} />
        </View>

        {/* Progress skeleton */}
        <View style={styles.progressSkeleton} />

        {/* Missing items skeleton */}
        <View style={styles.missingItemsSection}>
          <View style={styles.missingItemSkeleton} />
          <View style={styles.missingItemSkeleton} />
          <View style={[styles.missingItemSkeleton, { width: '60%' }]} />
        </View>

        {/* Action button skeleton */}
        <View style={styles.actionButtonSkeleton} />
      </ShimmerEffect>
    </View>
  );
};

/**
 * StepperSkeleton
 * Loading placeholder for ProgressStepper component
 */
export const StepperSkeleton = ({ style, stepCount = 4 }) => {
  return (
    <View style={[styles.stepperContainer, style]}>
      <ShimmerEffect>
        {Array.from({ length: stepCount }).map((_, index) => (
          <View key={index} style={styles.stepItem}>
            {/* Icon circle skeleton */}
            <View style={styles.stepIconSkeleton} />

            {/* Label skeleton */}
            <View style={styles.stepLabelContainer}>
              <View style={styles.stepLabelSkeleton} />
              <View style={[styles.stepSubLabelSkeleton, { width: '70%' }]} />
            </View>

            {/* Connection line (except last item) */}
            {index < stepCount - 1 && <View style={styles.connectionLineSkeleton} />}
          </View>
        ))}
      </ShimmerEffect>
    </View>
  );
};

/**
 * DocumentPreviewSkeleton
 * Loading placeholder for DocumentPreviewCard component
 */
export const DocumentPreviewSkeleton = ({ style }) => {
  return (
    <View style={[styles.documentContainer, style]}>
      <ShimmerEffect>
        {/* Header */}
        <View style={styles.documentHeader}>
          <View style={styles.documentIconSkeleton} />
          <View style={styles.documentTitleSkeleton} />
        </View>

        {/* Data rows */}
        <View style={styles.documentDataRow}>
          <View style={styles.documentLabelSkeleton} />
          <View style={styles.documentValueSkeleton} />
        </View>
        <View style={styles.documentDataRow}>
          <View style={styles.documentLabelSkeleton} />
          <View style={styles.documentValueSkeleton} />
        </View>
        <View style={styles.documentDataRow}>
          <View style={styles.documentLabelSkeleton} />
          <View style={[styles.documentValueSkeleton, { width: '50%' }]} />
        </View>

        {/* Info badge */}
        <View style={styles.infoBadgeSkeleton} />
      </ShimmerEffect>
    </View>
  );
};

/**
 * PreviewBadgeSkeleton
 * Loading placeholder for PreviewBadge component
 */
export const PreviewBadgeSkeleton = ({ style }) => {
  return (
    <View style={[styles.badgeContainer, style]}>
      <ShimmerEffect>
        <View style={styles.badgeIconSkeleton} />
        <View style={styles.badgeLabelSkeleton} />
      </ShimmerEffect>
    </View>
  );
};

/**
 * InfoAlertSkeleton
 * Loading placeholder for InfoAlert component
 */
export const InfoAlertSkeleton = ({ style }) => {
  return (
    <View style={[styles.alertContainer, style]}>
      <ShimmerEffect>
        <View style={styles.alertIconSkeleton} />
        <View style={styles.alertContent}>
          <View style={styles.alertTextSkeleton} />
          <View style={[styles.alertTextSkeleton, { width: '70%' }]} />
        </View>
      </ShimmerEffect>
    </View>
  );
};

/**
 * ActionButtonGroupSkeleton
 * Loading placeholder for ActionButtonGroup component
 */
export const ActionButtonGroupSkeleton = ({ style, showSecondary = false }) => {
  return (
    <View style={[styles.buttonGroupContainer, style]}>
      <ShimmerEffect>
        <View style={styles.primaryButtonSkeleton} />
        {showSecondary && <View style={styles.secondaryButtonSkeleton} />}
      </ShimmerEffect>
    </View>
  );
};

/**
 * FullPreviewSkeleton
 * Complete preview screen skeleton
 * Shows all components in loading state
 */
export const FullPreviewSkeleton = ({ style }) => {
  return (
    <View style={[styles.fullPreviewContainer, style]}>
      <PreviewBadgeSkeleton style={styles.section} />
      <StatusCardSkeleton style={styles.section} />
      <StepperSkeleton style={styles.section} />
      <DocumentPreviewSkeleton style={styles.section} />
      <InfoAlertSkeleton style={styles.section} />
    </View>
  );
};

const styles = StyleSheet.create({
  // Shimmer effect styles
  shimmerContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 300,
  },

  // StatusCard skeleton
  statusCardContainer: {
    backgroundColor: previewTheme.colors.white,
    borderRadius: previewTheme.borderRadius.large,
    borderWidth: previewTheme.dimensions.borderWidth.medium,
    borderColor: previewTheme.colors.neutral200,
    padding: previewTheme.spacing.md,
    ...previewTheme.shadows.elevation2,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: previewTheme.spacing.sm,
  },
  iconSkeleton: {
    width: previewTheme.iconSizes.large,
    height: previewTheme.iconSizes.large,
    borderRadius: previewTheme.iconSizes.large / 2,
    backgroundColor: previewTheme.colors.neutral200,
    marginRight: previewTheme.spacing.sm,
  },
  titleSkeleton: {
    height: 22,
    flex: 1,
    backgroundColor: previewTheme.colors.neutral200,
    borderRadius: previewTheme.borderRadius.small,
  },
  progressSkeleton: {
    height: 16,
    width: '60%',
    backgroundColor: previewTheme.colors.neutral200,
    borderRadius: previewTheme.borderRadius.small,
    marginTop: previewTheme.spacing.sm,
    marginBottom: previewTheme.spacing.md,
  },
  missingItemsSection: {
    marginBottom: previewTheme.spacing.md,
  },
  missingItemSkeleton: {
    height: 14,
    backgroundColor: previewTheme.colors.neutral200,
    borderRadius: previewTheme.borderRadius.small,
    marginBottom: previewTheme.spacing.xs,
  },
  actionButtonSkeleton: {
    height: 44,
    backgroundColor: previewTheme.colors.neutral200,
    borderRadius: previewTheme.borderRadius.medium,
    marginTop: previewTheme.spacing.sm,
  },

  // Stepper skeleton
  stepperContainer: {
    backgroundColor: previewTheme.colors.white,
    borderRadius: previewTheme.borderRadius.medium,
    padding: previewTheme.spacing.md,
    ...previewTheme.shadows.elevation1,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: previewTheme.spacing.sm,
    position: 'relative',
  },
  stepIconSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: previewTheme.colors.neutral200,
    marginRight: previewTheme.spacing.sm,
  },
  stepLabelContainer: {
    flex: 1,
  },
  stepLabelSkeleton: {
    height: 16,
    backgroundColor: previewTheme.colors.neutral200,
    borderRadius: previewTheme.borderRadius.small,
    marginBottom: previewTheme.spacing.xs,
  },
  stepSubLabelSkeleton: {
    height: 14,
    backgroundColor: previewTheme.colors.neutral200,
    borderRadius: previewTheme.borderRadius.small,
  },
  connectionLineSkeleton: {
    position: 'absolute',
    left: 20,
    top: 48,
    bottom: -12,
    width: 2,
    backgroundColor: previewTheme.colors.neutral200,
  },

  // Document skeleton
  documentContainer: {
    backgroundColor: previewTheme.colors.white,
    borderRadius: previewTheme.borderRadius.medium,
    borderWidth: 1,
    borderColor: previewTheme.colors.neutral200,
    borderStyle: 'dashed',
    padding: previewTheme.spacing.md,
    ...previewTheme.shadows.elevation1,
  },
  documentHeader: {
    alignItems: 'center',
    marginBottom: previewTheme.spacing.lg,
  },
  documentIconSkeleton: {
    width: previewTheme.iconSizes.xl,
    height: previewTheme.iconSizes.xl,
    borderRadius: previewTheme.iconSizes.xl / 2,
    backgroundColor: previewTheme.colors.neutral200,
    marginBottom: previewTheme.spacing.sm,
  },
  documentTitleSkeleton: {
    height: 18,
    width: '60%',
    backgroundColor: previewTheme.colors.neutral200,
    borderRadius: previewTheme.borderRadius.small,
  },
  documentDataRow: {
    flexDirection: 'row',
    marginBottom: previewTheme.spacing.sm,
  },
  documentLabelSkeleton: {
    height: 16,
    width: 80,
    backgroundColor: previewTheme.colors.neutral200,
    borderRadius: previewTheme.borderRadius.small,
    marginRight: previewTheme.spacing.sm,
  },
  documentValueSkeleton: {
    height: 16,
    flex: 1,
    backgroundColor: previewTheme.colors.neutral200,
    borderRadius: previewTheme.borderRadius.small,
  },
  infoBadgeSkeleton: {
    height: 40,
    backgroundColor: previewTheme.colors.neutral200,
    borderRadius: previewTheme.borderRadius.small,
    marginTop: previewTheme.spacing.md,
  },

  // Badge skeleton
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: previewTheme.colors.neutral100,
    borderRadius: previewTheme.borderRadius.medium,
    borderWidth: 1,
    borderColor: previewTheme.colors.neutral200,
    padding: previewTheme.spacing.sm,
    paddingHorizontal: previewTheme.spacing.md,
  },
  badgeIconSkeleton: {
    width: previewTheme.iconSizes.medium,
    height: previewTheme.iconSizes.medium,
    borderRadius: previewTheme.iconSizes.medium / 2,
    backgroundColor: previewTheme.colors.neutral200,
    marginRight: previewTheme.spacing.sm,
  },
  badgeLabelSkeleton: {
    height: 16,
    width: 120,
    backgroundColor: previewTheme.colors.neutral200,
    borderRadius: previewTheme.borderRadius.small,
  },

  // Alert skeleton
  alertContainer: {
    flexDirection: 'row',
    backgroundColor: previewTheme.colors.neutral100,
    borderRadius: previewTheme.borderRadius.medium,
    borderWidth: 1,
    borderColor: previewTheme.colors.neutral200,
    padding: previewTheme.spacing.sm,
    paddingHorizontal: previewTheme.spacing.md,
  },
  alertIconSkeleton: {
    width: previewTheme.iconSizes.medium,
    height: previewTheme.iconSizes.medium,
    borderRadius: previewTheme.iconSizes.medium / 2,
    backgroundColor: previewTheme.colors.neutral200,
    marginRight: previewTheme.spacing.sm,
  },
  alertContent: {
    flex: 1,
  },
  alertTextSkeleton: {
    height: 14,
    backgroundColor: previewTheme.colors.neutral200,
    borderRadius: previewTheme.borderRadius.small,
    marginBottom: previewTheme.spacing.xs,
  },

  // Button group skeleton
  buttonGroupContainer: {
    paddingHorizontal: previewTheme.spacing.md,
    paddingVertical: previewTheme.spacing.md,
  },
  primaryButtonSkeleton: {
    height: previewTheme.dimensions.buttonHeight.large,
    backgroundColor: previewTheme.colors.neutral200,
    borderRadius: previewTheme.borderRadius.large,
  },
  secondaryButtonSkeleton: {
    height: previewTheme.dimensions.buttonHeight.large,
    backgroundColor: previewTheme.colors.neutral100,
    borderRadius: previewTheme.borderRadius.large,
    borderWidth: previewTheme.dimensions.borderWidth.medium,
    borderColor: previewTheme.colors.neutral200,
    marginTop: previewTheme.spacing.sm,
  },

  // Full preview skeleton
  fullPreviewContainer: {
    flex: 1,
  },
  section: {
    marginHorizontal: previewTheme.spacing.md,
    marginTop: previewTheme.spacing.lg,
  },
});

export default {
  StatusCardSkeleton,
  StepperSkeleton,
  DocumentPreviewSkeleton,
  PreviewBadgeSkeleton,
  InfoAlertSkeleton,
  ActionButtonGroupSkeleton,
  FullPreviewSkeleton,
};
