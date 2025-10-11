// 出境通 - Country Selection Card Component
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const CountryCard = ({
  flag,
  name,
  flightTime,
  onPress,
  selected = false,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
        disabled && styles.cardDisabled,
      ]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <Text style={[styles.flag, disabled && styles.flagDisabled]}>{flag}</Text>
      <Text style={[styles.name, disabled && styles.nameDisabled]}>{name}</Text>
      <Text style={[styles.flightTime, disabled && styles.flightTimeDisabled]}>{flightTime}</Text>
      {disabled && <Text style={styles.comingSoon}>敬请期待</Text>}
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
  cardDisabled: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    opacity: 0.6,
  },
  flag: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  flagDisabled: {
    opacity: 0.5,
  },
  name: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  nameDisabled: {
    color: colors.textSecondary,
  },
  flightTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  flightTimeDisabled: {
    color: colors.textTertiary,
  },
  comingSoon: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
});

export default CountryCard;
