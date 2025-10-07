// 出国啰 - Country Selection Card Component
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const CountryCard = ({ 
  flag, 
  name, 
  flightTime, 
  onPress,
  selected = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.flag}>{flag}</Text>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.flightTime}>{flightTime}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    height: 120,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  flag: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  flightTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

export default CountryCard;
