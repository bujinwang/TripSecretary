// @ts-nocheck

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';

const ActionBar = ({ onEdit, onShare, onPrint, editLabel, shareLabel, printLabel }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.actionButton, styles.actionButtonSecondary]}
        onPress={onEdit}
        activeOpacity={0.85}
      >
        <Text style={styles.actionButtonIcon}>✏️</Text>
        <Text style={styles.actionButtonLabel}>{editLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, styles.actionButtonSecondary]}
        onPress={onShare}
        activeOpacity={0.85}
      >
        <Text style={styles.actionButtonIcon}>🤝</Text>
        <Text style={styles.actionButtonLabel}>{shareLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, styles.actionButtonPrimary]}
        onPress={onPrint}
        activeOpacity={0.9}
      >
        <Text style={styles.actionButtonIconPrimary}>🖨️</Text>
        <Text style={styles.actionButtonPrimaryLabel}>{printLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 16,
    marginHorizontal: spacing.xs,
  },
  actionButtonSecondary: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionButtonIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  actionButtonIconPrimary: {
    fontSize: 18,
    marginRight: spacing.xs,
    color: colors.white,
  },
  actionButtonLabel: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  actionButtonPrimaryLabel: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '700',
  },
});

export default ActionBar;
