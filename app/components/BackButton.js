/* eslint-disable react/prop-types */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

import { colors, spacing, typography, touchable } from '../theme';

const BackButton = ({
  label,
  onPress,
  style,
  labelStyle,
  iconStyle,
  children,
  showLabel = true,
  hitSlop = { top: 8, bottom: 8, left: 8, right: 8 },
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
  },
  icon: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '300',
    marginRight: spacing.xs,
  },
  label: {
    ...typography.body2,
    color: colors.primary,
  },
});

export default BackButton;
