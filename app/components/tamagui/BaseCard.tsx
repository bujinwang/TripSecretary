/**
 * BaseCard - Reusable card component built on Tamagui
 *
 * A flexible card component that supports elevation, borders, padding variants,
 * and can be used across all country screens.
 *
 * @example
 * ```tsx
 * <BaseCard variant="elevated" padding="lg">
 *   <Text>Card content</Text>
 * </BaseCard>
 * ```
 */

import React from 'react';
import { Card, CardProps } from 'tamagui';

export interface BaseCardProps extends CardProps {
  /**
   * Visual style variant
   * - elevated: Card with shadow elevation
   * - bordered: Card with border, no elevation
   * - flat: Simple card, no border or elevation
   */
  variant?: 'elevated' | 'bordered' | 'flat';

  /**
   * Padding preset
   * - none: No padding
   * - sm: Small padding (8px)
   * - md: Medium padding (16px)
   * - lg: Large padding (24px)
   * - xl: Extra large padding (32px)
   */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Make the card pressable
   */
  pressable?: boolean;

  /**
   * Handler for press events (if pressable=true)
   */
  onPress?: () => void;
}

// Variant style maps - static and optimizable
const variantStyles = {
  elevated: {
    elevation: 2,
    shadowColor: '$shadowColor',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 0,
  },
  bordered: {
    borderWidth: 1,
    borderColor: '$borderColor',
    elevation: 0,
    shadowOpacity: 0,
  },
  flat: {
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
};

const paddingMap = {
  none: 0,
  sm: '$sm',
  md: '$md',
  lg: '$lg',
  xl: '$xl',
};

/**
 * BaseCard Component
 */
export const BaseCard: React.FC<BaseCardProps> = ({
  variant = 'elevated',
  padding = 'md',
  pressable = false,
  onPress,
  children,
  ...props
}) => {
  const isPressable = pressable || !!onPress;

  return (
    <Card
      backgroundColor="$card"
      borderRadius="$md"
      overflow="hidden"
      padding={paddingMap[padding]}
      animation="quick"
      cursor={isPressable ? 'pointer' : undefined}
      hoverStyle={isPressable ? {
        backgroundColor: '$backgroundHover',
      } : undefined}
      pressStyle={isPressable ? {
        backgroundColor: '$backgroundPress',
        scale: 0.98,
      } : undefined}
      onPress={onPress}
      {...variantStyles[variant]}
      {...props}
    >
      {children}
    </Card>
  );
};

export default BaseCard;
