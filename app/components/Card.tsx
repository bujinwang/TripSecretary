import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import type { GestureResponderEvent, StyleProp } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
  pressable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  pressable = false,
}) => {
  const Container = pressable || onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={pressable || onPress ? 0.7 : 1}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.card,
  },
});

export default Card;

