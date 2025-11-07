/**
 * TravelInfoFormSection Component
 * 
 * Reusable form section component for travel information screens.
 * Provides consistent behavior across different destinations with
 * user interaction tracking and smart suggestions.
 * 
 * Features:
 * - Destination-agnostic form field rendering
 * - Integrated user interaction tracking
 * - Smart suggestions for common fields
 * - Consistent validation and error handling
 * - Accessibility support
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import InputWithUserTracking from './InputWithUserTracking';
import { colors, typography, spacing } from '../theme';

const TravelInfoFormSection = ({
  // Field configuration
  fieldName,
  label,
  value,
  onChangeText,
  onUserInteraction,
  
  // Suggestions
  showSuggestions = false,
  suggestions = [],
  suggestionPlaceholder,
  
  // Validation
  error = false,
  errorMessage = '',
  warning = false,
  warningMessage = '',
  
  // UI customization
  placeholder,
  helpText,
  required = false,
  optional = false,
  
  // Tracking
  lastEditedField,
  
  // Other props
  ...inputProps
}) => {
  /**
   * Handle text change with user interaction tracking
   */
  const handleTextChange = useCallback((text) => {
    // Call parent's onChange handler
    if (onChangeText) {
      onChangeText(text);
    }
  }, [onChangeText]);

  /**
   * Handle user interaction
   */
  const handleUserInteraction = useCallback((fieldName, value) => {
    if (onUserInteraction) {
      onUserInteraction(fieldName, value);
    }
  }, [onUserInteraction]);

  // Determine field requirement indicator
  const getFieldRequirementText = () => {
    if (required) {
return <Text style={styles.requiredText}>*</Text>;
}
    if (optional) {
return <Text style={styles.optionalText}>（可选）</Text>;
}
    return null;
  };

  // Check if this field was last edited
  const isLastEdited = fieldName && lastEditedField === fieldName;
  
  // Determine validation state
  const hasError = error && errorMessage;
  const hasWarning = warning && warningMessage && !hasError;

  return (
    <View style={[
      styles.container,
      isLastEdited && styles.lastEditedField
    ]}>
      {/* Field Label with Requirement Indicator */}
      <View style={styles.labelContainer}>
        <View style={styles.labelRow}>
          <Text style={[
            styles.label,
            isLastEdited && styles.lastEditedLabel
          ]}>
            {label}
            {isLastEdited && ' ✨'}
          </Text>
          <View style={styles.requirementIndicator}>
            {getFieldRequirementText()}
          </View>
        </View>
        
        {/* Warning/Error Icon */}
        {hasError && <Text style={styles.fieldErrorIcon}>❌</Text>}
        {hasWarning && !hasError && <Text style={styles.fieldWarningIcon}>⚠️</Text>}
      </View>

      {/* Input Field with User Tracking */}
      <InputWithUserTracking
        fieldName={fieldName}
        value={value}
        onChangeText={handleTextChange}
        onUserInteraction={handleUserInteraction}
        showSuggestions={showSuggestions}
        suggestions={suggestions}
        suggestionPlaceholder={suggestionPlaceholder}
        placeholder={placeholder}
        error={hasError}
        errorMessage={errorMessage}
        helpText={helpText}
        {...inputProps}
      />

      {/* Warning Message */}
      {hasWarning && !hasError && (
        <Text style={styles.warningText}>{warningMessage}</Text>
      )}

      {/* Last Edited Indicator */}
      {isLastEdited && (
        <Text style={styles.lastEditedIndicator}>
          最近编辑
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  lastEditedField: {
    backgroundColor: colors.backgroundHighlight || colors.background,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  lastEditedLabel: {
    color: colors.primary,
  },
  requirementIndicator: {
    marginLeft: spacing.xs,
  },
  requiredText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: 'bold',
  },
  optionalText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  fieldErrorIcon: {
    fontSize: 16,
  },
  fieldWarningIcon: {
    fontSize: 16,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning || colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  lastEditedIndicator: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});

export default TravelInfoFormSection;