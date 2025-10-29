/**
 * Thailand Travel Screen Helper Components
 * Reusable UI components for Thailand travel info screen
 */

import React from 'react';
import { LayoutAnimation } from 'react-native';
import { YStack, XStack, Text as TamaguiText } from '../tamagui';
import Input from '../Input';

/**
 * FieldWarningIcon - Shows warning/error icon for form fields
 */
export const FieldWarningIcon = ({ hasWarning, hasError }) => {
  if (hasError) {
    return <TamaguiText fontSize={18} marginLeft={8}>❌</TamaguiText>;
  }
  if (hasWarning) {
    return <TamaguiText fontSize={18} marginLeft={8}>⚠️</TamaguiText>;
  }
  return null;
};

/**
 * InputWithValidation - Enhanced input with validation UI
 */
export const InputWithValidation = ({
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
  ...props
}) => {
  const hasError = error && errorMessage;
  const hasWarning = warning && warningMessage && !hasError;
  const isLastEdited = fieldName && lastEditedField === fieldName;

  const getFieldRequirementText = () => {
    if (required) return <TamaguiText color="#e74c3c" fontSize={14}>*</TamaguiText>;
    if (optional) return <TamaguiText color="#95a5a6" fontSize={12}>（可选）</TamaguiText>;
    return null;
  };

  return (
    <YStack
      marginBottom={16}
      backgroundColor={isLastEdited ? '#f0f8ff' : 'transparent'}
      borderRadius={8}
      padding={isLastEdited ? 8 : 0}
      marginHorizontal={isLastEdited ? -8 : 0}
    >
      <XStack justifyContent="space-between" alignItems="center" marginBottom={4}>
        <XStack alignItems="center">
          <TamaguiText
            fontSize={14}
            fontWeight="600"
            color={isLastEdited ? '#1a73e8' : '#333'}
          >
            {label}
            {isLastEdited && ' ✨'}
          </TamaguiText>
          <YStack marginLeft={4}>
            {getFieldRequirementText()}
          </YStack>
        </XStack>
        <FieldWarningIcon hasWarning={hasWarning} hasError={hasError} />
      </XStack>
      <Input
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        error={hasError}
        errorMessage={errorMessage}
        {...props}
      />
      {hasWarning && !hasError && (
        <TamaguiText marginTop={4} fontSize={12} color="#ff9500">{warningMessage}</TamaguiText>
      )}
      {isLastEdited && t && (
        <TamaguiText marginTop={4} fontSize={11} color="#1a73e8" fontStyle="italic">
          {t('thailand.travelInfo.lastEdited', { defaultValue: '最近编辑' })}
        </TamaguiText>
      )}
    </YStack>
  );
};

/**
 * CollapsibleSection - Expandable section with field count badge
 */
export const CollapsibleSection = ({ title, subtitle, children, onScan, isExpanded, onToggle, fieldCount }) => {
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  const isComplete = fieldCount && fieldCount.filled === fieldCount.total;

  return (
    <YStack
      backgroundColor="white"
      borderRadius={12}
      marginBottom={16}
      overflow="hidden"
      shadowColor="#000"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={4}
      elevation={3}
    >
      <XStack
        justifyContent="space-between"
        alignItems="center"
        padding={16}
        backgroundColor="#f8f9fa"
        onPress={handleToggle}
        pressStyle={{ opacity: 0.8 }}
        cursor="pointer"
      >
        <XStack flex={1} justifyContent="space-between" alignItems="center" marginRight={12}>
          <YStack>
            <TamaguiText fontSize={18} fontWeight="700" color="#1a3568">{title}</TamaguiText>
            {subtitle && <TamaguiText fontSize={13} color="#6c757d" marginTop={2}>{subtitle}</TamaguiText>}
          </YStack>
          {fieldCount && (
            <YStack
              paddingHorizontal={10}
              paddingVertical={4}
              borderRadius={12}
              backgroundColor={isComplete ? '#d4edda' : '#fff3cd'}
            >
              <TamaguiText
                fontSize={12}
                fontWeight="600"
                color={isComplete ? '#155724' : '#856404'}
              >
                {`${fieldCount.filled}/${fieldCount.total}`}
              </TamaguiText>
            </YStack>
          )}
        </XStack>
        <XStack alignItems="center">
          <TamaguiText fontSize={16} color="#6c757d">{isExpanded ? '▲' : '▼'}</TamaguiText>
        </XStack>
      </XStack>
      {isExpanded && <YStack padding={16} paddingTop={8}>{children}</YStack>}
    </YStack>
  );
};
