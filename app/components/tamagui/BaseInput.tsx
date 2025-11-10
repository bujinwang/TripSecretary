// @ts-nocheck
/**
 * BaseInput - Reusable input component with validation built on Tamagui
 *
 * A flexible input component with validation, error states, success states,
 * and focus glow effects. Follows the TripSecretary design system.
 *
 * @example
 * ```tsx
 * <BaseInput
 *   label="Email"
 *   value={email}
 *   onChangeText={setEmail}
 *   error="Invalid email"
 *   required
 * />
 * ```
 */

import React, { useState } from 'react';
import { Input, InputProps, Label, YStack, XStack, Text, styled } from 'tamagui';

export interface BaseInputProps extends Omit<InputProps, 'size'> {
  /**
   * Input label
   */
  label?: string;

  /**
   * Helper text shown below input
   */
  helperText?: string;

  /**
   * Error message - when provided, input shows error state
   */
  error?: string | boolean;

  /**
   * Success message - when provided, input shows success state
   */
  success?: string | boolean;

  /**
   * Required field indicator
   */
  required?: boolean;

  /**
   * Input size
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Show character count
   */
  showCount?: boolean;

  /**
   * Maximum character length
   */
  maxLength?: number;

  /**
   * Icon before input
   */
  icon?: React.ReactNode;

  /**
   * Icon after input (e.g., clear button)
   */
  iconAfter?: React.ReactNode;

  /**
   * Full width input
   */
  fullWidth?: boolean;
}

const StyledInput = styled(Input, {
  borderRadius: '$sm',
  borderWidth: 1,
  borderColor: '$borderColor',
  backgroundColor: '$white',
  fontFamily: '$body',
  color: '$text',
  outlineWidth: 0,

  focusStyle: {
    borderColor: '$primary',
    borderWidth: 2,
    shadowColor: '$primary',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  variants: {
    size: {
      sm: {
        height: 36,
        paddingHorizontal: '$sm',
        fontSize: '$1',
      },
      md: {
        height: 44,
        paddingHorizontal: '$md',
        fontSize: '$2',
      },
      lg: {
        height: 52,
        paddingHorizontal: '$lg',
        fontSize: '$3',
      },
    },

    error: {
      true: {
        borderColor: '$danger',
        borderWidth: 2,
        focusStyle: {
          borderColor: '$danger',
          shadowColor: '$danger',
        },
      },
    },

    success: {
      true: {
        borderColor: '$success',
        borderWidth: 2,
        focusStyle: {
          borderColor: '$success',
          shadowColor: '$success',
        },
      },
    },

    disabled: {
      true: {
        backgroundColor: '$backgroundLight',
        color: '$textDisabled',
        cursor: 'not-allowed',
        opacity: 0.6,
      },
    },

    fullWidth: {
      true: {
        width: '100%',
      },
    },
  } as const,

  defaultVariants: {
    size: 'md',
    error: false,
    success: false,
    disabled: false,
    fullWidth: true,
  },
});

const StyledLabel = styled(Label, {
  fontFamily: '$body',
  fontSize: '$2',
  fontWeight: '600',
  color: '$text',
  marginBottom: '$xs',
});

const HelperText = styled(Text, {
  fontFamily: '$body',
  fontSize: '$1',
  color: '$textSecondary',
  marginTop: '$xs',
});

const ErrorText = styled(Text, {
  fontFamily: '$body',
  fontSize: '$1',
  color: '$danger',
  marginTop: '$xs',
  fontWeight: '500',
});

const SuccessText = styled(Text, {
  fontFamily: '$body',
  fontSize: '$1',
  color: '$success',
  marginTop: '$xs',
  fontWeight: '500',
});

const RequiredIndicator = styled(Text, {
  color: '$danger',
  fontSize: '$2',
  marginLeft: 2,
});

const CharCount = styled(Text, {
  fontFamily: '$body',
  fontSize: '$1',
  color: '$textTertiary',
  marginTop: '$xs',
  textAlign: 'right',
});

/**
 * BaseInput Component
 */
export const BaseInput: React.FC<BaseInputProps> = ({
  label,
  helperText,
  error,
  success,
  required = false,
  size = 'md',
  showCount = false,
  maxLength,
  icon,
  iconAfter,
  fullWidth = true,
  value,
  disabled,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputId = React.useId();

  const hasError = !!error;
  const hasSuccess = !!success && !hasError;

  return (
    <YStack width={fullWidth ? '100%' : 'auto'} gap="$xs">
      {/* Label */}
      {label && (
        <XStack alignItems="center">
          <StyledLabel htmlFor={inputId}>
            {label}
            {required && <RequiredIndicator>*</RequiredIndicator>}
          </StyledLabel>
        </XStack>
      )}

      {/* Input Container */}
      <XStack
        alignItems="center"
        gap="$xs"
        width={fullWidth ? '100%' : 'auto'}
      >
        {icon && <YStack>{icon}</YStack>}
        <StyledInput
          id={inputId}
          size={size}
          error={hasError}
          success={hasSuccess}
          disabled={disabled}
          fullWidth={fullWidth}
          value={value}
          maxLength={maxLength}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {iconAfter && <YStack>{iconAfter}</YStack>}
      </XStack>

      {/* Helper/Error/Success Text */}
      {hasError && <ErrorText>{error}</ErrorText>}
      {hasSuccess && <SuccessText>{success}</SuccessText>}
      {!hasError && !hasSuccess && helperText && (
        <HelperText>{helperText}</HelperText>
      )}

      {/* Character Count */}
      {showCount && maxLength && (
        <CharCount>
          {(value?.toString().length || 0)}/{maxLength}
        </CharCount>
      )}
    </YStack>
  );
};

export default BaseInput;
