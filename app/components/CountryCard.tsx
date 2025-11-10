// @ts-nocheck

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
  const badgeConfig = {
    visa_free: {
      icon: '✅',
      label: '免签',
      textColor: '#0E9F61',
      backgroundColor: 'rgba(7, 193, 96, 0.12)',
      borderColor: 'rgba(7, 193, 96, 0.28)',
    },
    visa_on_arrival: {
      icon: '🛄',
      label: '落地签',
      textColor: '#C8781F',
      backgroundColor: 'rgba(250, 157, 59, 0.12)',
      borderColor: 'rgba(250, 157, 59, 0.28)',
    },
    evisa: {
      icon: '💻',
      label: '电子签',
      textColor: colors.secondary,
      backgroundColor: 'rgba(87, 107, 149, 0.12)',
      borderColor: 'rgba(87, 107, 149, 0.24)',
    },
    eta: {
      icon: '🌐',
      label: 'ETA',
      textColor: colors.secondary,
      backgroundColor: 'rgba(87, 107, 149, 0.12)',
      borderColor: 'rgba(87, 107, 149, 0.24)',
    },
    hk_permit: {
      icon: '🛃',
      label: '港澳证',
      textColor: '#0F91C7',
      backgroundColor: 'rgba(15, 145, 199, 0.12)',
      borderColor: 'rgba(15, 145, 199, 0.26)',
    },
    tw_entry_permit: {
      icon: '📄',
      label: '入台证',
      textColor: '#7A5AF5',
      backgroundColor: 'rgba(122, 90, 245, 0.12)',
      borderColor: 'rgba(122, 90, 245, 0.26)',
    },
    visa_required: {
      icon: '🛂',
      label: '需签证',
      textColor: '#D64545',
      backgroundColor: 'rgba(245, 108, 108, 0.12)',
      borderColor: 'rgba(245, 108, 108, 0.28)',
    },
    unknown: {
      icon: '❓',
      label: '待确认',
      textColor: colors.textSecondary,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      borderColor: 'rgba(0, 0, 0, 0.08)',
    },
  };

  const visaBadge = badgeConfig[visaRequirement] || badgeConfig.unknown;

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
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: visaBadge.backgroundColor,
            borderColor: visaBadge.borderColor,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Text style={[styles.statusIcon, { color: visaBadge.textColor }]}>
          {visaBadge.icon}
        </Text>
        <Text style={[styles.statusText, { color: visaBadge.textColor }]}>
          {visaBadge.label}
        </Text>
      </View>

      <View style={styles.flagContainer}>
        <Text style={[styles.flag, disabled && styles.flagDisabled]}>{flag}</Text>
      </View>

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
    minHeight: 150,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'flex-start',
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
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  flagContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  flag: {
    fontSize: 48,
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
  flightTime: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  comingSoon: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default CountryCard;
