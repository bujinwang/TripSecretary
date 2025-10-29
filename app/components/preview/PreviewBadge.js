// TDAC Entry Pack Preview - PreviewBadge Component
// Indicates to user they're in preview mode

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from '../../i18n/LocaleContext';
import { previewTheme } from '../../theme/preview-tokens';

/**
 * PreviewBadge Component
 *
 * Clearly indicates to user they're in preview mode, not editing mode.
 * Can be dismissed and shows a tooltip with explanation.
 *
 * @param {Object} props
 * @param {'preview' | 'draft' | 'readonly'} props.variant - Badge variant (default: 'preview')
 * @param {boolean} props.dismissible - Whether badge can be dismissed (default: true)
 * @param {boolean} props.collapsed - Whether to show collapsed chip version (default: false)
 * @param {Function} props.onDismiss - Callback when badge is dismissed
 * @param {Object} props.style - Additional styles
 *
 * @example
 * <PreviewBadge
 *   variant="preview"
 *   dismissible={true}
 *   onDismiss={() => console.log('Badge dismissed')}
 * />
 */
const PreviewBadge = ({
  variant = 'preview',
  dismissible = true,
  collapsed = false,
  onDismiss,
  style,
}) => {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Configuration for each variant
  const variantConfig = {
    preview: {
      icon: 'eye',
      titleKey: 'preview.badge.preview.title',
      titleDefault: 'Preview Mode',
      tooltipKey: 'preview.badge.preview.tooltip',
      tooltipDefault: 'Your information has not been submitted yet. You can safely review your entry pack.',
      bgColor: previewTheme.colors.previewBadgeBg,
      borderColor: previewTheme.colors.previewBadgeBorder,
      textColor: previewTheme.colors.neutral900,
    },
    draft: {
      icon: 'edit-3',
      titleKey: 'preview.badge.draft.title',
      titleDefault: 'Draft',
      tooltipKey: 'preview.badge.draft.tooltip',
      tooltipDefault: 'This entry pack has unsaved changes.',
      bgColor: previewTheme.colors.statusIncompleteLight,
      borderColor: previewTheme.colors.statusIncomplete,
      textColor: previewTheme.colors.statusIncomplete,
    },
    readonly: {
      icon: 'lock',
      titleKey: 'preview.badge.readonly.title',
      titleDefault: 'Read Only',
      tooltipKey: 'preview.badge.readonly.tooltip',
      tooltipDefault: 'This entry pack has been submitted and cannot be edited.',
      bgColor: previewTheme.colors.neutral100,
      borderColor: previewTheme.colors.neutral200,
      textColor: previewTheme.colors.neutral600,
    },
  };

  const config = variantConfig[variant];

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleInfoPress = () => {
    setShowTooltip(true);
  };

  const handleCloseTooltip = () => {
    setShowTooltip(false);
  };

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  // Collapsed chip version (minimal)
  if (collapsed) {
    return (
      <TouchableOpacity
        style={[
          styles.chipContainer,
          { backgroundColor: config.bgColor, borderColor: config.borderColor },
          style,
        ]}
        onPress={handleInfoPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={t(config.titleKey, { defaultValue: config.titleDefault })}
        accessibilityHint={t('preview.badge.expandHint', {
          defaultValue: 'Tap to show more information',
        })}
      >
        <Feather
          name={config.icon}
          size={previewTheme.iconSizes.small}
          color={config.textColor}
        />
      </TouchableOpacity>
    );
  }

  // Full badge version
  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: config.bgColor, borderColor: config.borderColor },
          style,
        ]}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={t(config.titleKey, { defaultValue: config.titleDefault })}
      >
        {/* Icon and Title */}
        <View style={styles.content}>
          <Feather
            name={config.icon}
            size={previewTheme.iconSizes.medium}
            color={config.textColor}
            style={styles.icon}
          />
          <Text style={[styles.title, { color: config.textColor }]}>
            {t(config.titleKey, { defaultValue: config.titleDefault })}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Info button */}
          <TouchableOpacity
            style={styles.infoButton}
            onPress={handleInfoPress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('preview.badge.info', { defaultValue: 'Show information' })}
          >
            <Feather
              name="info"
              size={previewTheme.iconSizes.medium}
              color={config.textColor}
            />
          </TouchableOpacity>

          {/* Dismiss button */}
          {dismissible && (
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('preview.badge.dismiss', { defaultValue: 'Dismiss' })}
            >
              <Feather
                name="x"
                size={previewTheme.iconSizes.medium}
                color={config.textColor}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tooltip Modal */}
      <Modal
        visible={showTooltip}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseTooltip}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseTooltip}
        >
          <View style={styles.tooltipContainer}>
            <View style={styles.tooltipHeader}>
              <Feather
                name="info"
                size={previewTheme.iconSizes.large}
                color={previewTheme.colors.statusInfo}
              />
              <TouchableOpacity
                style={styles.tooltipCloseButton}
                onPress={handleCloseTooltip}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('common.close', { defaultValue: 'Close' })}
              >
                <Feather
                  name="x"
                  size={previewTheme.iconSizes.large}
                  color={previewTheme.colors.neutral600}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.tooltipTitle}>
              {t(config.titleKey, { defaultValue: config.titleDefault })}
            </Text>
            <Text style={styles.tooltipText}>
              {t(config.tooltipKey, { defaultValue: config.tooltipDefault })}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: previewTheme.spacing.sm,
    paddingHorizontal: previewTheme.spacing.md,
    borderRadius: previewTheme.borderRadius.medium,
    borderWidth: 1,
  },
  chipContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: previewTheme.spacing.sm,
  },
  title: {
    ...previewTheme.typography.body,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: previewTheme.spacing.sm,
  },
  infoButton: {
    padding: previewTheme.spacing.xs,
    marginRight: previewTheme.spacing.xs,
  },
  dismissButton: {
    padding: previewTheme.spacing.xs,
  },
  // Tooltip modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: previewTheme.spacing.lg,
  },
  tooltipContainer: {
    backgroundColor: previewTheme.colors.white,
    borderRadius: previewTheme.borderRadius.large,
    padding: previewTheme.spacing.lg,
    maxWidth: 400,
    width: '100%',
    ...previewTheme.shadows.elevation3,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: previewTheme.spacing.md,
  },
  tooltipCloseButton: {
    padding: previewTheme.spacing.xs,
  },
  tooltipTitle: {
    ...previewTheme.typography.h3,
    color: previewTheme.colors.neutral900,
    marginBottom: previewTheme.spacing.sm,
  },
  tooltipText: {
    ...previewTheme.typography.body,
    color: previewTheme.colors.neutral600,
    lineHeight: previewTheme.typography.body.lineHeight,
  },
});

export default PreviewBadge;
