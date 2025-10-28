/**
 * CollapsibleSection - Expandable/collapsible section component
 *
 * A flexible section component that can expand/collapse with smooth animations.
 * Used extensively in forms and info screens across all countries.
 *
 * @example
 * ```tsx
 * <CollapsibleSection
 *   title="Personal Information"
 *   icon="👤"
 *   defaultExpanded={true}
 * >
 *   <Text>Section content here</Text>
 * </CollapsibleSection>
 * ```
 */

import React, { useState } from 'react';
import {
  YStack,
  XStack,
  Text,
  styled,
  AnimatePresence,
} from 'tamagui';
import { TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';

export interface CollapsibleSectionProps {
  /**
   * Section title
   */
  title: string;

  /**
   * Section subtitle (optional)
   */
  subtitle?: string;

  /**
   * Icon emoji or component
   */
  icon?: React.ReactNode;

  /**
   * Badge to show on the right (e.g., "3/5")
   */
  badge?: string;

  /**
   * Badge color variant
   */
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger';

  /**
   * Whether the section is expanded by default
   */
  defaultExpanded?: boolean;

  /**
   * Controlled expanded state
   */
  expanded?: boolean;

  /**
   * Callback when expansion state changes
   */
  onToggle?: (expanded: boolean) => void;

  /**
   * Content to show when collapsed
   */
  collapsedContent?: React.ReactNode;

  /**
   * Section content (shown when expanded)
   */
  children: React.ReactNode;

  /**
   * Disable the section (non-interactive)
   */
  disabled?: boolean;

  /**
   * Variant style
   */
  variant?: 'default' | 'card' | 'minimal';
}

const Container = styled(YStack, {
  width: '100%',

  variants: {
    variant: {
      default: {
        backgroundColor: '$card',
        borderRadius: '$md',
        borderWidth: 1,
        borderColor: '$borderColor',
        overflow: 'hidden',
      },
      card: {
        backgroundColor: '$card',
        borderRadius: '$md',
        padding: '$md',
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      minimal: {
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: '$borderColor',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
});

const Header = styled(XStack, {
  alignItems: 'center',
  padding: '$md',
  cursor: 'pointer',
  gap: '$sm',

  hoverStyle: {
    backgroundColor: '$backgroundHover',
  },

  pressStyle: {
    backgroundColor: '$backgroundPress',
  },

  variants: {
    disabled: {
      true: {
        cursor: 'default',
        opacity: 0.6,
        hoverStyle: {
          backgroundColor: 'transparent',
        },
      },
    },
  } as const,
});

const IconContainer = styled(YStack, {
  fontSize: 24,
  justifyContent: 'center',
  alignItems: 'center',
  minWidth: 32,
});

const TitleContainer = styled(YStack, {
  flex: 1,
  gap: 2,
});

const Title = styled(Text, {
  fontFamily: '$body',
  fontSize: '$3',
  fontWeight: '600',
  color: '$text',
});

const Subtitle = styled(Text, {
  fontFamily: '$body',
  fontSize: '$1',
  color: '$textSecondary',
});

const Badge = styled(YStack, {
  paddingHorizontal: '$xs',
  paddingVertical: 2,
  borderRadius: '$sm',
  minWidth: 40,
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    variant: {
      default: {
        backgroundColor: '$backgroundLight',
      },
      success: {
        backgroundColor: '#d4edda',
      },
      warning: {
        backgroundColor: '#fff3cd',
      },
      danger: {
        backgroundColor: '#f8d7da',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
});

const BadgeText = styled(Text, {
  fontFamily: '$body',
  fontSize: '$1',
  fontWeight: '600',

  variants: {
    variant: {
      default: {
        color: '$textSecondary',
      },
      success: {
        color: '#155724',
      },
      warning: {
        color: '#856404',
      },
      danger: {
        color: '#721c24',
      },
    },
  } as const,
});

const Arrow = styled(Text, {
  fontSize: '$3',
  color: '$textTertiary',
  transition: 'transform 0.2s',
});

const Content = styled(YStack, {
  padding: '$md',
  borderTopWidth: 1,
  borderTopColor: '$borderColor',
});

const CollapsedContent = styled(YStack, {
  padding: '$md',
  paddingTop: 0,
});

/**
 * CollapsibleSection Component
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  icon,
  badge,
  badgeVariant = 'default',
  defaultExpanded = false,
  expanded: controlledExpanded,
  onToggle,
  collapsedContent,
  children,
  disabled = false,
  variant = 'default',
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const rotation = useSharedValue(isExpanded ? 180 : 0);

  const arrowStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withTiming(`${rotation.value}deg`, {
            duration: 200,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          }),
        },
      ],
    };
  });

  const handleToggle = () => {
    if (disabled) return;

    const newExpanded = !isExpanded;

    // Update rotation animation
    rotation.value = newExpanded ? 180 : 0;

    // Update state
    if (controlledExpanded === undefined) {
      setInternalExpanded(newExpanded);
    }

    // Notify parent
    onToggle?.(newExpanded);
  };

  return (
    <Container variant={variant}>
      {/* Header */}
      <TouchableOpacity onPress={handleToggle} disabled={disabled} activeOpacity={0.7}>
        <Header disabled={disabled}>
          {/* Icon */}
          {icon && (
            <IconContainer>
              {typeof icon === 'string' ? <Text fontSize={24}>{icon}</Text> : icon}
            </IconContainer>
          )}

          {/* Title & Subtitle */}
          <TitleContainer>
            <Title>{title}</Title>
            {subtitle && <Subtitle>{subtitle}</Subtitle>}
          </TitleContainer>

          {/* Badge */}
          {badge && (
            <Badge variant={badgeVariant}>
              <BadgeText variant={badgeVariant}>{badge}</BadgeText>
            </Badge>
          )}

          {/* Arrow */}
          <Animated.View style={arrowStyle}>
            <Arrow>▼</Arrow>
          </Animated.View>
        </Header>
      </TouchableOpacity>

      {/* Content */}
      {isExpanded ? (
        <Content>{children}</Content>
      ) : (
        collapsedContent && <CollapsedContent>{collapsedContent}</CollapsedContent>
      )}
    </Container>
  );
};

export default CollapsibleSection;
