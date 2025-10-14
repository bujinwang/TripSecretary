// 入境通 - Card Component
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../theme';

const Card = ({
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
