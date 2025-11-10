// @ts-nocheck

// TDAC Entry Pack Preview - DocumentPreviewCard Component
// Displays preview of the TDAC card that will be generated

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from '../../i18n/LocaleContext';
import { previewTheme } from '../../theme/preview-tokens';
import {
  ANIMATION_EASING,
  ReduceMotionManager,
} from '../../utils/animations/previewAnimations';
import { PreviewHaptics } from '../../utils/haptics';

/**
 * DocumentPreviewCard Component
 *
 * Displays preview of the TDAC card with document data.
 * Can be tapped to expand to fullscreen view.
 *
 * @param {Object} props
 * @param {'sample' | 'filled' | 'submitted'} props.variant - Document variant
 * @param {Object} props.documentData - Document data to display
 * @param {string} props.documentData.name - User's name
 * @param {string} props.documentData.tdacNumber - TDAC number
 * @param {string} props.documentData.passportNumber - Passport number
 * @param {React.ReactNode} props.documentContent - Custom document preview content
 * @param {boolean} props.loading - Whether document is loading
 * @param {Error} props.error - Error object if preview failed to load
 * @param {Function} props.onExpand - Callback when tapped to expand
 * @param {Function} props.onRetry - Callback to retry loading (for error state)
 * @param {Object} props.style - Additional styles
 *
 * @example
 * <DocumentPreviewCard
 *   variant="filled"
 *   documentData={{
 *     name: 'JOHN DOE',
 *     tdacNumber: 'A6A69EB',
 *     passportNumber: 'E1234567'
 *   }}
 *   onExpand={() => navigation.navigate('FullScreenPreview')}
 * />
 */
const DocumentPreviewCard = ({
  variant = 'sample',
  documentData = {},
  documentContent,
  loading = false,
  error = null,
  onExpand,
  onRetry,
  style,
}) => {
  const { t } = useTranslation();
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Animation values
  const scale = useSharedValue(1);
  const borderRadius = useSharedValue(previewTheme.borderRadius.medium);

  const handleExpand = () => {
    PreviewHaptics.documentExpand();

    const isReduceMotion = ReduceMotionManager.isReduceMotionEnabled;

    if (isReduceMotion) {
      // No animation
      if (onExpand) {
        onExpand();
      } else {
        setIsFullScreen(true);
      }
    } else {
      // Animate: scale up briefly, then trigger modal
      scale.value = withSequence(
        withTiming(1.05, {
          duration: 150,
          easing: ANIMATION_EASING.EASE_IN_OUT,
        }),
        withTiming(1, {
          duration: 150,
          easing: ANIMATION_EASING.EASE_IN_OUT,
        })
      );

      // Trigger expand after animation starts
      setTimeout(() => {
        if (onExpand) {
          onExpand();
        } else {
          setIsFullScreen(true);
        }
      }, 150);
    }
  };

  const handleCloseFullScreen = () => {
    PreviewHaptics.buttonPress();
    setIsFullScreen(false);
  };

  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Variant configuration
  const variantConfig = {
    sample: {
      infoKey: 'preview.document.sample.info',
      infoDefault: 'Preview only - sample data shown',
      borderStyle: 'dashed',
    },
    filled: {
      infoKey: 'preview.document.filled.info',
      infoDefault: 'Preview only - actual card will include full details',
      borderStyle: 'dashed',
    },
    submitted: {
      infoKey: 'preview.document.submitted.info',
      infoDefault: 'Submitted document - official TDAC card',
      borderStyle: 'solid',
    },
  };

  const config = variantConfig[variant];

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator
          size="large"
          color={previewTheme.colors.actionSecondary}
        />
        <Text style={styles.loadingText}>
          {t('preview.document.loading', { defaultValue: 'Loading document preview...' })}
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Feather
          name="alert-circle"
          size={previewTheme.iconSizes.xl}
          color={previewTheme.colors.statusError}
        />
        <Text style={styles.errorTitle}>
          {t('preview.document.error.title', { defaultValue: 'Failed to load preview' })}
        </Text>
        <Text style={styles.errorMessage}>
          {error.message || t('preview.document.error.message', { defaultValue: 'An error occurred while generating the preview.' })}
        </Text>
        {onRetry && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('preview.document.retry', { defaultValue: 'Retry' })}
          >
            <Feather
              name="refresh-cw"
              size={previewTheme.iconSizes.medium}
              color={previewTheme.colors.white}
            />
            <Text style={styles.retryButtonText}>
              {t('preview.document.retry', { defaultValue: 'Retry' })}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Preview content
  const PreviewContent = () => (
    <View style={styles.previewContent}>
      {/* Custom content if provided */}
      {documentContent ? (
        documentContent
      ) : (
        // Default document preview layout
        <>
          <View style={styles.documentHeader}>
            <Feather
              name="file-text"
              size={previewTheme.iconSizes.xl}
              color={previewTheme.colors.neutral400}
            />
            <Text style={styles.documentTitle}>
              {t('preview.document.title', { defaultValue: 'TDAC Document Preview' })}
            </Text>
          </View>

          {/* Document data */}
          {documentData.name && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>
                {t('preview.document.name', { defaultValue: 'Name:' })}
              </Text>
              <Text style={styles.dataValue}>{documentData.name}</Text>
            </View>
          )}

          {documentData.tdacNumber && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>
                {t('preview.document.tdac', { defaultValue: 'TDAC:' })}
              </Text>
              <Text style={styles.dataValue}>{documentData.tdacNumber}</Text>
            </View>
          )}

          {documentData.passportNumber && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>
                {t('preview.document.passport', { defaultValue: 'Passport:' })}
              </Text>
              <Text style={styles.dataValue}>{documentData.passportNumber}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <>
      {/* Card view */}
      <TouchableOpacity
        onPress={handleExpand}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={t('preview.document.label', { defaultValue: 'Document preview' })}
        accessibilityHint={t('preview.document.expandHint', {
          defaultValue: 'Double tap to view in full screen',
        })}
      >
        <Animated.View
          style={[
            styles.container,
            { borderStyle: config.borderStyle },
            animatedCardStyle,
            style,
          ]}
        >
        <PreviewContent />

        {/* Info badge at bottom */}
        <View style={styles.infoBadge}>
          <Feather
            name="info"
            size={previewTheme.iconSizes.small}
            color={previewTheme.colors.statusInfo}
            style={styles.infoBadgeIcon}
          />
          <Text style={styles.infoBadgeText}>
            {t(config.infoKey, { defaultValue: config.infoDefault })}
          </Text>
        </View>

        {/* Expand indicator */}
        <View style={styles.expandIndicator}>
          <Feather
            name="maximize-2"
            size={previewTheme.iconSizes.small}
            color={previewTheme.colors.neutral400}
          />
        </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Fullscreen modal */}
      <Modal
        visible={isFullScreen}
        animationType="fade"
        onRequestClose={handleCloseFullScreen}
      >
        <View style={styles.fullScreenContainer}>
          {/* Header */}
          <View style={styles.fullScreenHeader}>
            <Text style={styles.fullScreenTitle}>
              {t('preview.document.fullscreen.title', { defaultValue: 'Document Preview' })}
            </Text>
            <TouchableOpacity
              style={styles.fullScreenCloseButton}
              onPress={handleCloseFullScreen}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', { defaultValue: 'Close' })}
            >
              <Feather
                name="x"
                size={previewTheme.iconSizes.large}
                color={previewTheme.colors.neutral900}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.fullScreenContent}>
            <PreviewContent />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: previewTheme.colors.white,
    borderRadius: previewTheme.borderRadius.medium,
    borderWidth: 1,
    borderColor: previewTheme.colors.previewBorder,
    padding: previewTheme.spacing.md,
    ...previewTheme.shadows.elevation1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    ...previewTheme.typography.body,
    color: previewTheme.colors.neutral600,
    marginTop: previewTheme.spacing.md,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    borderColor: previewTheme.colors.statusError,
    backgroundColor: previewTheme.colors.statusErrorLight,
  },
  errorTitle: {
    ...previewTheme.typography.h3,
    color: previewTheme.colors.statusError,
    marginTop: previewTheme.spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    ...previewTheme.typography.body,
    color: previewTheme.colors.neutral600,
    marginTop: previewTheme.spacing.sm,
    textAlign: 'center',
    paddingHorizontal: previewTheme.spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: previewTheme.colors.statusError,
    paddingVertical: previewTheme.spacing.sm,
    paddingHorizontal: previewTheme.spacing.md,
    borderRadius: previewTheme.borderRadius.medium,
    marginTop: previewTheme.spacing.md,
  },
  retryButtonText: {
    ...previewTheme.typography.bodyBold,
    color: previewTheme.colors.white,
    marginLeft: previewTheme.spacing.xs,
  },
  previewContent: {
    minHeight: 150,
  },
  documentHeader: {
    alignItems: 'center',
    marginBottom: previewTheme.spacing.lg,
  },
  documentTitle: {
    ...previewTheme.typography.h3,
    color: previewTheme.colors.neutral900,
    marginTop: previewTheme.spacing.sm,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: previewTheme.spacing.sm,
  },
  dataLabel: {
    ...previewTheme.typography.bodyBold,
    color: previewTheme.colors.neutral600,
    width: 100,
  },
  dataValue: {
    ...previewTheme.typography.body,
    color: previewTheme.colors.neutral900,
    flex: 1,
    fontFamily: 'monospace',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: previewTheme.colors.statusInfoLight,
    padding: previewTheme.spacing.sm,
    borderRadius: previewTheme.borderRadius.small,
    marginTop: previewTheme.spacing.md,
  },
  infoBadgeIcon: {
    marginRight: previewTheme.spacing.xs,
  },
  infoBadgeText: {
    ...previewTheme.typography.small,
    color: previewTheme.colors.statusInfo,
    flex: 1,
  },
  expandIndicator: {
    position: 'absolute',
    top: previewTheme.spacing.sm,
    right: previewTheme.spacing.sm,
  },
  // Fullscreen modal styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: previewTheme.colors.white,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: previewTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: previewTheme.colors.neutral200,
  },
  fullScreenTitle: {
    ...previewTheme.typography.h2,
    color: previewTheme.colors.neutral900,
  },
  fullScreenCloseButton: {
    padding: previewTheme.spacing.xs,
  },
  fullScreenContent: {
    flex: 1,
    padding: previewTheme.spacing.lg,
  },
});

export default DocumentPreviewCard;
