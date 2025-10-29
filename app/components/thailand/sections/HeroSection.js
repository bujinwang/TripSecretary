/**
 * HeroSection Component
 *
 * Displays the introductory hero section with gradient background
 * for Thailand Travel Info Screen
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../../../theme';

const HeroSection = ({ t }) => {
  return (
    <LinearGradient
      colors={['#1a3568', '#102347']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroSection}
    >
      <View style={styles.heroContent}>
        <Text style={styles.heroFlag}>🇹🇭</Text>
        <View style={styles.heroHeading}>
          <Text style={styles.heroTitle}>泰国入境准备指南</Text>
          <Text style={styles.heroSubtitle}>别担心，我们来帮你！</Text>
        </View>

        {/* Beginner-Friendly Value Proposition */}
        <View style={styles.valueProposition}>
          <View style={styles.valueItem}>
            <Text style={styles.valueIcon}>⏱️</Text>
            <Text style={styles.valueText}>3分钟完成</Text>
          </View>
          <View style={styles.valueItem}>
            <Text style={styles.valueIcon}>🔒</Text>
            <Text style={styles.valueText}>100%隐私保护</Text>
          </View>
          <View style={styles.valueItem}>
            <Text style={styles.valueIcon}>🎯</Text>
            <Text style={styles.valueText}>避免通关延误</Text>
          </View>
        </View>

        <View style={styles.beginnerTip}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            第一次过泰国海关？我们会一步步教你准备所有必需文件，确保顺利通关！
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  heroSection: {
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroFlag: {
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  heroHeading: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.body1,
    color: '#E8F0FF',
    fontSize: 13,
    textAlign: 'center',
  },
  valueProposition: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  valueItem: {
    alignItems: 'center',
    flex: 1,
  },
  valueIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  valueText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  beginnerTip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  tipText: {
    ...typography.body2,
    color: '#E8F0FF',
    flex: 1,
    lineHeight: 18,
    fontSize: 12,
  },
});

export default HeroSection;
