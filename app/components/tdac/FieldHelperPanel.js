/**
 * FieldHelperPanel Component
 *
 * Displays floating helper buttons for copying passport and travel data
 * Used in TDAC WebView screen to assist users with form filling
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Clipboard,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import LoggingService from '../../services/LoggingService';

const logger = LoggingService.for('FieldHelperPanel');

/**
 * FieldHelperPanel component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether panel is visible
 * @param {Function} props.onClose - Callback when panel is closed
 * @param {Object} props.fields - Fields to display with labels and values
 */
const FieldHelperPanel = ({ visible, onClose, fields }) => {
  const [copiedField, setCopiedField] = useState(null);

  if (!visible) {
    return null;
  }

  /**
   * Copy text to clipboard and show feedback
   */
  const copyToClipboard = (text, fieldName) => {
    Clipboard.setString(text);
    setCopiedField(fieldName);
    logger.debug('Field copied to clipboard', { fieldName });

    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  /**
   * Render a single field button
   */
  const renderFieldButton = (field) => {
    const isCopied = copiedField === field.name;
    const hasValue = field.value && field.value.trim() !== '';

    if (!hasValue) {
      return null;
    }

    return (
      <TouchableOpacity
        key={field.name}
        style={[styles.fieldButton, isCopied && styles.fieldButtonCopied]}
        onPress={() => copyToClipboard(field.value, field.name)}
        activeOpacity={0.7}
      >
        <View style={styles.fieldButtonContent}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <Text style={styles.fieldValue} numberOfLines={1}>
            {field.value}
          </Text>
        </View>
        <Text style={styles.copyIcon}>
          {isCopied ? '✓' : '📋'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Panel */}
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📋 复制助手</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <Text style={styles.helpText}>
          点击下方字段可快速复制到剪贴板
        </Text>

        {/* Fields */}
        <ScrollView
          style={styles.fieldsContainer}
          showsVerticalScrollIndicator={false}
        >
          {fields.map(renderFieldButton)}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 复制后，在网页中粘贴填写
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  helpText: {
    ...typography.body2,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  fieldsContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  fieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldButtonCopied: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  fieldButtonContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fieldValue: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '500',
  },
  copyIcon: {
    fontSize: 20,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default FieldHelperPanel;
