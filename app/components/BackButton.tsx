/* eslint-disable react/prop-types */
import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
  Insets,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { colors, spacing, typography, touchable } from '../theme';

const defaultHitSlop: Insets = { top: 16, bottom: 16, left: 16, right: 16 };

export interface BackButtonProps extends TouchableOpacityProps {
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  iconStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  showLabel?: boolean;
  hitSlop?: Insets;
}

const BackButton: React.FC<BackButtonProps> = ({
  label,
  onPress,
  style,
  labelStyle,
  iconStyle,
  children,
  showLabel = true,
  hitSlop = defaultHitSlop,
  ...props
}) => {
  const resolvedLabel =
    typeof label === 'string' && label.trim().length > 0 ? label.trim() : 'Back';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, style]}
      hitSlop={hitSlop}
      {...props}
    >
      <Text style={[styles.icon, iconStyle]} accessibilityRole="button">
        ‹
      </Text>
      {children
        ? children
        : showLabel && resolvedLabel ? (
          <Text style={[styles.label, labelStyle]}>{resolvedLabel}</Text>
        ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchable.minHeight,
    paddingVertical: spacing.xs,
  } as ViewStyle,
  icon: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '300',
    marginRight: spacing.xs,
  } as TextStyle,
  label: {
    ...typography.body2,
    color: colors.primary,
  } as TextStyle,
});

export default BackButton;
