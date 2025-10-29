// TDAC Entry Pack Preview - InfoAlert Component
// Shows important notices, warnings, or time-sensitive information

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from '../../i18n/LocaleContext';
import { previewTheme } from '../../theme/preview-tokens';

/**
 * InfoAlert Component
 *
 * Displays important notices with proper color theming and optional dismissal.
 * Use sparingly to avoid alert fatigue.
 *
 * @param {Object} props
 * @param {'info' | 'warning' | 'error' | 'success'} props.variant - Alert variant (default: 'info')
 * @param {string} props.title - Alert title (optional)
 * @param {string} props.message - Alert message
 * @param {boolean} props.dismissible - Whether alert can be dismissed (default: false)
 * @param {Function} props.onDismiss - Callback when dismissed
 * @param {Function} props.onActionPress - Action link callback (optional)
 * @param {string} props.actionLabel - Action link label (optional)
 * @param {React.ReactNode} props.children - Custom content (overrides message)
 * @param {Object} props.style - Additional styles
 *
 * @example
 * <InfoAlert
 *   variant="warning"
 *   title="Submission Deadline"
 *   message="2 days remaining to submit"
 *   dismissible={true}
 *   onDismiss={() => console.log('Dismissed')}
 * />
 */
const InfoAlert = ({
  variant = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
  onActionPress,
  actionLabel,
  children,
  style,
}) => {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(false);

  // Variant configuration
  const variantConfig = {
    info: {
      icon: 'info',
      bgColor: previewTheme.colors.statusInfoLight,
      borderColor: previewTheme.colors.statusInfo,
      textColor: previewTheme.colors.statusInfo,
      iconColor: previewTheme.colors.statusInfo,
    },
    warning: {
      icon: 'alert-triangle',
      bgColor: previewTheme.colors.statusIncompleteLight,
      borderColor: previewTheme.colors.statusIncomplete,
      textColor: previewTheme.colors.neutral900,
      iconColor: previewTheme.colors.statusIncomplete,
    },
    error: {
      icon: 'x-circle',
      bgColor: previewTheme.colors.statusErrorLight,
      borderColor: previewTheme.colors.statusError,
      textColor: previewTheme.colors.statusError,
      iconColor: previewTheme.colors.statusError,
    },
    success: {
      icon: 'check-circle',
      bgColor: previewTheme.colors.statusCompleteLight,
      borderColor: previewTheme.colors.statusComplete,
      textColor: previewTheme.colors.statusComplete,
      iconColor: previewTheme.colors.statusComplete,
    },
  };

  const config = variantConfig[variant];

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={
        title
          ? `${variant} alert: ${title}`
          : `${variant} alert`
      }
    >
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Feather
          name={config.icon}
          size={previewTheme.iconSizes.medium}
          color={config.iconColor}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        {title && (
          <Text
            style={[styles.title, { color: config.textColor }]}
            accessibilityRole="header"
          >
            {title}
          </Text>
        )}

        {/* Message or custom children */}
        {children ? (
          children
        ) : (
          message && (
            <Text style={[styles.message, { color: config.textColor }]}>
              {message}
            </Text>
          )
        )}

        {/* Action link */}
        {onActionPress && actionLabel && (
          <TouchableOpacity
            style={styles.actionLink}
            onPress={onActionPress}
            accessible={true}
            accessibilityRole="link"
            accessibilityLabel={actionLabel}
          >
            <Text style={[styles.actionLinkText, { color: config.iconColor }]}>
              {actionLabel}
            </Text>
            <Feather
              name="arrow-right"
              size={previewTheme.iconSizes.small}
              color={config.iconColor}
              style={styles.actionLinkIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Dismiss button */}
      {dismissible && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('common.dismiss', { defaultValue: 'Dismiss' })}
        >
          <Feather
            name="x"
            size={previewTheme.iconSizes.medium}
            color={config.iconColor}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: previewTheme.borderRadius.medium,
    borderWidth: 1,
    padding: previewTheme.spacing.sm,
    paddingHorizontal: previewTheme.spacing.md,
  },
  iconContainer: {
    marginRight: previewTheme.spacing.sm,
    paddingTop: 2, // Align with text
  },
  content: {
    flex: 1,
  },
  title: {
    ...previewTheme.typography.bodyBold,
    marginBottom: previewTheme.spacing.xs,
  },
  message: {
    ...previewTheme.typography.body,
    lineHeight: previewTheme.typography.body.lineHeight,
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: previewTheme.spacing.sm,
  },
  actionLinkText: {
    ...previewTheme.typography.bodyBold,
    textDecorationLine: 'underline',
  },
  actionLinkIcon: {
    marginLeft: previewTheme.spacing.xs,
  },
  dismissButton: {
    marginLeft: previewTheme.spacing.sm,
    padding: previewTheme.spacing.xs,
  },
});

export default InfoAlert;
