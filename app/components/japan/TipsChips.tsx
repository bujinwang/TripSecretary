// @ts-nocheck

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing } from '../../theme';

const TipsChips = ({ tips }) => {
  return (
    <View style={styles.container}>
      {tips.map((tip) => (
        <View key={tip.id} style={styles.tipChip}>
          <Text style={styles.tipChipIcon}>{tip.icon}</Text>
          <Text style={styles.tipChipText}>{tip.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.xs,
  },
  tipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF8F2',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  tipChipIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  tipChipText: {
    ...typography.caption,
  },
});

export default TipsChips;
