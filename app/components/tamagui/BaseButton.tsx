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
import { Button, ButtonProps, styled, Text, Spinner } from 'tamagui';

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

const StyledButton = styled(Button, {
  borderRadius: '$md',
  fontFamily: '$body',
  fontWeight: '600',
  cursor: 'pointer',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$xs',

  variants: {
    variant: {
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
    },

    size: {
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
    },

    fullWidth: {
      true: {
        width: '100%',
      },
    },

    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
        hoverStyle: {
          opacity: 0.5,
        },
        pressStyle: {
          scale: 1,
        },
      },
    },

    loading: {
      true: {
        cursor: 'not-allowed',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
    fullWidth: false,
    disabled: false,
    loading: false,
  },
});

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

  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      loading={loading}
      onPress={handlePress}
      {...props}
    >
      {loading ? (
        <Spinner size="small" color={variant === 'outlined' || variant === 'ghost' ? '$primary' : '$white'} />
      ) : (
        <>
          {icon}
          {typeof children === 'string' ? (
            <Text
              fontSize={size === 'sm' ? '$1' : size === 'md' ? '$2' : '$3'}
              fontWeight="600"
              color={
                variant === 'outlined' || variant === 'ghost'
                  ? variant === 'ghost'
                    ? '$text'
                    : '$primary'
                  : '$white'
              }
            >
              {children}
            </Text>
          ) : (
            children
          )}
          {iconAfter}
        </>
      )}
    </StyledButton>
  );
};

export default BaseButton;
