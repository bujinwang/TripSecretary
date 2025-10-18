// 入境通 - Country Selection Card Component
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
  visaRequirement = 'unknown',
}) => {
  const getVisaInfo = () => {
    switch (visaRequirement) {
      case 'visa_free':
        return { icon: '✓', text: '免签', color: '#07C160', bgColor: '#07C160' };
      case 'visa_on_arrival':
        return { icon: '🛂', text: '落地签', color: '#FA9D3B', bgColor: '#FA9D3B' };
      case 'visa_required':
        return { icon: '📄', text: '需签证', color: '#F56C6C', bgColor: '#F56C6C' };
      default:
        return { icon: '❓', text: '未知', color: '#999999', bgColor: '#999999' };
    }
  };

  const visaInfo = getVisaInfo();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
        disabled && styles.cardDisabled,
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
    >
      {/* Visa Status Indicator */}
      <View style={[styles.visaIndicator, { backgroundColor: visaInfo.bgColor }]}>
        <Text style={styles.visaIcon}>
          {visaInfo.icon}
        </Text>
      </View>

      <Text style={[styles.flag, disabled && styles.flagDisabled]}>{flag}</Text>
      <Text style={[styles.name, disabled && styles.nameDisabled]}>{name}</Text>

      {disabled ? (
        <Text style={styles.comingSoon}>敬请期待</Text>
      ) : (
        <Text style={styles.flightTime}>{flightTime}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    height: 140, // Increased height for visa indicator
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'flex-start', // Changed to flex-start for better layout
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
  visaIndicator: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  visaIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  flag: {
    fontSize: 48,
    marginBottom: spacing.xs,
    marginTop: spacing.xs, // Added margin for visa indicator
  },
  flagDisabled: {
    opacity: 0.5,
  },
  name: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  nameDisabled: {
    color: colors.textSecondary,
  },
  comingSoon: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
});

export default CountryCard;
