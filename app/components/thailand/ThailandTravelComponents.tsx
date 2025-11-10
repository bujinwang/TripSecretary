import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Input, { type InputProps } from '../Input';

export interface FieldWarningIconProps {
  hasWarning?: boolean;
  hasError?: boolean;
}

export const FieldWarningIcon: React.FC<FieldWarningIconProps> = ({
  hasWarning,
  hasError,
}) => {
  if (hasError) {
    return <Text style={styles.fieldErrorIcon}>❌</Text>;
  }
  if (hasWarning) {
    return <Text style={styles.fieldWarningIcon}>⚠️</Text>;
  }
  return null;
};

export type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export interface InputWithValidationProps
  extends Omit<InputProps, 'onBlur'> {
  onBlur?: (value: string) => void;
  warning?: boolean;
  warningMessage?: string;
  fieldName?: string;
  lastEditedField?: string | null;
  required?: boolean;
  optional?: boolean;
  t?: TranslationFn;
  containerStyle?: StyleProp<ViewStyle>;
}

export const InputWithValidation: React.FC<InputWithValidationProps> = ({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  errorMessage,
  warning,
  warningMessage,
  fieldName,
  lastEditedField,
  required = false,
  optional = false,
  t,
  style,
  containerStyle,
  ...rest
}) => {
  const hasError = Boolean(error && errorMessage);
  const hasWarning = Boolean(warning && warningMessage && !hasError);
  const isLastEdited = Boolean(fieldName && lastEditedField === fieldName);

  const getFieldRequirement = () => {
    if (required) {
      return <Text style={styles.requiredText}>*</Text>;
    }
    if (optional) {
      return <Text style={styles.optionalText}>（可选）</Text>;
    }
    return null;
  };

  const handleBlur = () => {
    onBlur?.(value);
  };

  return (
    <View
      style={[
        styles.inputWithValidationContainer,
        isLastEdited && styles.lastEditedField,
        containerStyle,
      ]}
    >
      <View style={styles.inputLabelContainer}>
        <View style={styles.labelRow}>
          <Text
            style={[
              styles.inputLabel,
              isLastEdited && styles.lastEditedLabel,
            ]}
          >
            {label}
            {isLastEdited && ' ✨'}
          </Text>
          <View style={styles.requirementIndicator}>{getFieldRequirement()}</View>
        </View>
        <FieldWarningIcon hasWarning={hasWarning} hasError={hasError} />
      </View>
      <Input
        label={undefined}
        value={value}
        onChangeText={onChangeText}
        onBlur={handleBlur}
        error={hasError}
        errorMessage={errorMessage}
        style={style}
        {...rest}
      />
      {hasWarning && !hasError && (
        <Text style={styles.warningText}>{warningMessage}</Text>
      )}
      {isLastEdited && t && (
        <Text style={styles.lastEditedIndicator}>
          {t('thailand.travelInfo.lastEdited', { defaultValue: '最近编辑' })}
        </Text>
      )}
    </View>
  );
};

export interface FieldCount {
  filled: number;
  total: number;
}

export interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  containerStyle?: StyleProp<ViewStyle>;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  children,
  isExpanded,
  onToggle,
  fieldCount,
  containerStyle,
}) => {
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  const isComplete = Boolean(
    fieldCount && fieldCount.filled === fieldCount.total,
  );

  return (
    <View style={[styles.sectionContainer, containerStyle]}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <View style={styles.sectionTitleContainer}>
          <View>
            <Text style={styles.sectionTitle}>{title}</Text>
            {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
          </View>
          {fieldCount && (
            <View
              style={[
                styles.fieldCountBadge,
                isComplete
                  ? styles.fieldCountBadgeComplete
                  : styles.fieldCountBadgeIncomplete,
              ]}
            >
              <Text
                style={[
                  styles.fieldCountText,
                  isComplete
                    ? styles.fieldCountTextComplete
                    : styles.fieldCountTextIncomplete,
                ]}
              >
                {`${fieldCount.filled}/${fieldCount.total}`}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.sectionIconContainer}>
          <Text style={styles.sectionIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  fieldErrorIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  fieldWarningIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  inputWithValidationContainer: {
    marginBottom: 16,
  },
  lastEditedField: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: -8,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  lastEditedLabel: {
    color: '#1a73e8',
  },
  requirementIndicator: {
    marginLeft: 4,
  },
  requiredText: {
    color: '#e74c3c',
    fontSize: 14,
  },
  optionalText: {
    color: '#95a5a6',
    fontSize: 12,
  },
  warningText: {
    marginTop: 4,
    fontSize: 12,
    color: '#ff9500',
  },
  lastEditedIndicator: {
    marginTop: 4,
    fontSize: 11,
    color: '#1a73e8',
    fontStyle: 'italic',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  sectionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a3568',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  fieldCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fieldCountBadgeComplete: {
    backgroundColor: '#d4edda',
  },
  fieldCountBadgeIncomplete: {
    backgroundColor: '#fff3cd',
  },
  fieldCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldCountTextComplete: {
    color: '#155724',
  },
  fieldCountTextIncomplete: {
    color: '#856404',
  },
  sectionIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: 16,
    color: '#6c757d',
  },
  sectionContent: {
    padding: 16,
    paddingTop: 8,
  },
});
