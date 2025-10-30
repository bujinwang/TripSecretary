/**
 * BaseButton - Reusable button component built on Tamagui
 *
 * A flexible button component with multiple variants, sizes, and states.
 * Follows the TripSecretary design system.
 *
 * @example
 * ```tsx
 * <BaseButton variant="primary" size="lg" onPress={handleSubmit}>
 *   Submit
 * </BaseButton>
 * ```
 */

import React from 'react';
import { Button, ButtonProps, Text, Spinner } from 'tamagui';

export interface BaseButtonProps extends Omit<ButtonProps, 'size'> {
  /**
   * Visual style variant
   * - primary: Green WeChat-style button (default)
   * - secondary: Blue secondary button
   * - outlined: Outlined button with border
   * - ghost: Transparent button
   * - danger: Red destructive button
   */
  variant?: 'primary' | 'secondary' | 'outlined' | 'ghost' | 'danger';

  /**
   * Button size
   * - sm: Small (32px height)
   * - md: Medium (44px height - default)
   * - lg: Large (52px height)
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Full width button
   */
  fullWidth?: boolean;

  /**
   * Loading state - shows spinner
   */
  loading?: boolean;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Icon before text
   */
  icon?: React.ReactNode;

  /**
   * Icon after text
   */
  iconAfter?: React.ReactNode;
}

// Variant style maps - static and optimizable
const variantStyles = {
  primary: {
    backgroundColor: '$primary',
    color: '$white',
    borderWidth: 0,
    hoverStyle: {
      backgroundColor: '$primaryHover',
    },
    pressStyle: {
      backgroundColor: '$primaryPress',
      scale: 0.97,
    },
  },
  secondary: {
    backgroundColor: '$secondary',
    color: '$white',
    borderWidth: 0,
    hoverStyle: {
      opacity: 0.9,
    },
    pressStyle: {
      opacity: 0.8,
      scale: 0.97,
    },
  },
  outlined: {
    backgroundColor: 'transparent',
    color: '$primary',
    borderWidth: 2,
    borderColor: '$primary',
    hoverStyle: {
      backgroundColor: '$primaryLight',
    },
    pressStyle: {
      backgroundColor: '$primaryLight',
      scale: 0.97,
    },
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '$text',
    borderWidth: 0,
    hoverStyle: {
      backgroundColor: '$backgroundHover',
    },
    pressStyle: {
      backgroundColor: '$backgroundPress',
      scale: 0.97,
    },
  },
  danger: {
    backgroundColor: '$danger',
    color: '$white',
    borderWidth: 0,
    hoverStyle: {
      opacity: 0.9,
    },
    pressStyle: {
      opacity: 0.8,
      scale: 0.97,
    },
  },
};

const sizeStyles = {
  sm: {
    height: 32,
    paddingHorizontal: '$md',
    fontSize: '$1',
  },
  md: {
    height: 44,
    paddingHorizontal: '$lg',
    fontSize: '$2',
  },
  lg: {
    height: 52,
    paddingHorizontal: '$xl',
    fontSize: '$3',
  },
};

// Text colors per variant - static lookup
const textColors = {
  primary: '$white',
  secondary: '$white',
  outlined: '$primary',
  ghost: '$text',
  danger: '$white',
};

// Spinner colors per variant
const spinnerColors = {
  primary: '$white',
  secondary: '$white',
  outlined: '$primary',
  ghost: '$primary',
  danger: '$white',
};

/**
 * BaseButton Component
 */
export const BaseButton: React.FC<BaseButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconAfter,
  children,
  onPress,
  ...props
}) => {
  const handlePress = (e: any) => {
    if (loading || disabled) {
      return;
    }
    onPress?.(e);
  };

  const isDisabled = disabled || loading;

  return (
    <Button
      borderRadius="$md"
      fontFamily="$body"
      fontWeight="600"
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      gap="$xs"
      animation="quick"
      width={fullWidth ? '100%' : undefined}
      opacity={isDisabled ? 0.5 : 1}
      onPress={handlePress}
      {...sizeStyles[size]}
      {...variantStyles[variant]}
      {...props}
    >
      {loading ? (
        <Spinner size="small" color={spinnerColors[variant]} />
      ) : (
        <>
          {icon}
          {typeof children === 'string' ? (
            <Text
              fontSize={sizeStyles[size].fontSize}
              fontWeight="600"
              color={textColors[variant]}
            >
              {children}
            </Text>
          ) : (
            children
          )}
          {iconAfter}
        </>
      )}
    </Button>
  );
};

export default BaseButton;
