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
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import InputWithUserTracking from './InputWithUserTracking';
import { colors, typography, spacing } from '../theme';

type OnChangeText = (text: string) => void;
type OnUserInteraction = (fieldName: string, value: string) => void;

type Suggestion = string;

export interface TravelInfoFormSectionProps extends Record<string, unknown> {
  fieldName: string;
  label: string;
  value?: string | null;
  onChangeText?: OnChangeText;
  onUserInteraction?: OnUserInteraction;
  showSuggestions?: boolean;
  suggestions?: Suggestion[];
  suggestionPlaceholder?: string;
  error?: boolean;
  errorMessage?: string;
  warning?: boolean;
  warningMessage?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  optional?: boolean;
  lastEditedField?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
}

const TravelInfoFormSection: React.FC<TravelInfoFormSectionProps> = (props) => {
  const {
    fieldName,
    label,
    value,
    onChangeText,
    onUserInteraction,
    showSuggestions = false,
    suggestions = [],
    suggestionPlaceholder,
    error = false,
    errorMessage = '',
    warning = false,
    warningMessage = '',
    placeholder,
    helpText,
    required = false,
    optional = false,
    lastEditedField,
    containerStyle,
    ...inputProps
  } = props;

  const handleTextChange = useCallback<OnChangeText>((text) => {
    onChangeText?.(text);
  }, [onChangeText]);

  const handleUserInteraction = useCallback<OnUserInteraction>((field, fieldValue) => {
    onUserInteraction?.(field, fieldValue);
  }, [onUserInteraction]);

  const requirementIndicator = required
    ? <Text style={styles.requiredText}>*</Text>
    : optional
    ? <Text style={styles.optionalText}>（可选）</Text>
    : null;

  const isLastEdited = lastEditedField === fieldName;
  const hasError = Boolean(error && errorMessage);
  const hasWarning = Boolean(warning && warningMessage && !hasError);

  return (
    <View
      style={[
        styles.container,
        containerStyle,
        isLastEdited ? styles.lastEditedField : null,
      ]}
    >
      <View style={styles.labelContainer}>
        <View style={styles.labelRow}>
          <Text
            style={[
              styles.label,
              isLastEdited ? styles.lastEditedLabel : null,
            ]}
          >
            {label}
            {isLastEdited ? ' ✨' : ''}
          </Text>
          <View style={styles.requirementIndicator}>{requirementIndicator}</View>
        </View>

        {hasError ? <Text style={styles.fieldErrorIcon}>❌</Text> : null}
        {hasWarning && !hasError ? <Text style={styles.fieldWarningIcon}>⚠️</Text> : null}
      </View>

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

      {hasWarning && !hasError ? (
        <Text style={styles.warningText}>{warningMessage}</Text>
      ) : null}

      {isLastEdited ? (
        <Text style={styles.lastEditedIndicator}>最近编辑</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  lastEditedField: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
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
    color: colors.warning,
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