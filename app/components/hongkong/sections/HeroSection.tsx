/**
 * HeroSection Component
 *
 * Displays the introductory hero section with gradient background
 * for Hong Kong Travel Info Screen
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../../../theme';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

type HongKongHeroSectionProps = {
  t: TranslationFn;
};

const HeroSection: React.FC<HongKongHeroSectionProps> = ({ t }) => {
  return (
    <LinearGradient
      colors={['#1a3568', '#102347']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroSection as ViewStyle}
    >
      <View style={styles.heroContent as ViewStyle}>
        <Text style={styles.heroFlag as TextStyle}>🇭🇰</Text>
        <View style={styles.heroHeading as ViewStyle}>
          <Text style={styles.heroTitle as TextStyle}>香港入境准备指南</Text>
          <Text style={styles.heroSubtitle as TextStyle}>别担心，我们来帮你！</Text>
        </View>

        {/* Beginner-Friendly Value Proposition */}
        <View style={styles.valueProposition as ViewStyle}>
          <View style={styles.valueItem as ViewStyle}>
            <Text style={styles.valueIcon as TextStyle}>⏱️</Text>
            <Text style={styles.valueText as TextStyle}>3分钟完成</Text>
          </View>
          <View style={styles.valueItem as ViewStyle}>
            <Text style={styles.valueIcon as TextStyle}>🔒</Text>
            <Text style={styles.valueText as TextStyle}>100%隐私保护</Text>
          </View>
          <View style={styles.valueItem as ViewStyle}>
            <Text style={styles.valueIcon as TextStyle}>🎯</Text>
            <Text style={styles.valueText as TextStyle}>避免通关延误</Text>
          </View>
        </View>

        <View style={styles.beginnerTip as ViewStyle}>
          <Text style={styles.tipIcon as TextStyle}>💡</Text>
          <Text style={styles.tipText as TextStyle}>
            第一次过香港海关？我们会一步步教你准备所有必需文件，确保顺利通关！
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  heroSection: {
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroFlag: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  heroHeading: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.white,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.body1,
    color: '#E8F0FF',
    fontSize: 16,
    textAlign: 'center',
  },
  valueProposition: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
  },
  valueItem: {
    alignItems: 'center',
    flex: 1,
  },
  valueIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  valueText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  beginnerTip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  tipText: {
    ...typography.body2,
    color: '#E8F0FF',
    flex: 1,
    lineHeight: 20,
  },
});

export default HeroSection;
