import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ProgressRing from './ProgressRing';
import { colors, typography, spacing } from '../../theme';

const HeroCard = ({
  completionPercent,
  nextActionLabel,
  summaryLabel,
  metaLabel,
  progressLabel,
  onPress,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.progressButton}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <ProgressRing progress={completionPercent}>
          <Text style={styles.progressValue}>{completionPercent}%</Text>
          <Text style={styles.progressLabel}>{progressLabel}</Text>
        </ProgressRing>
      </TouchableOpacity>
      <View style={styles.textBlock}>
        <Text style={styles.nextAction}>{nextActionLabel}</Text>
        <Text style={styles.summary}>{summaryLabel}</Text>
        <Text style={styles.meta}>{metaLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#0000001A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  progressButton: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  textBlock: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  nextAction: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  summary: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

export default HeroCard;
