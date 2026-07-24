/**
 * HeroSection Component
 *
 * Introductory hero with progress summary for Singapore Travel Info Screen
 */

import React from 'react';
import { View, Text, type TextStyle, type ViewStyle } from 'react-native';

type CompletionTotals = {
  filled: number;
  total: number;
};

type CompletionMetrics = {
  total?: CompletionTotals;
};

export interface SingaporeHeroSectionProps {
  t: (key: string, options?: Record<string, unknown>) => string;
  completionMetrics?: CompletionMetrics;
  totalCompletionPercent?: number;
  progressText: string;
  progressColor: string;
  styles: Record<string, ViewStyle | TextStyle>;
}

const HeroSection: React.FC<SingaporeHeroSectionProps> = ({
  t,
  completionMetrics,
  totalCompletionPercent,
  progressText,
  progressColor,
  styles,
}) => {
  if (!completionMetrics) {
    return null;
  }

  const filled = completionMetrics.total?.filled ?? 0;
  const total = completionMetrics.total?.total ?? 0;
  const percent = Math.min(100, Math.max(0, Math.round(totalCompletionPercent ?? 0)));

  return (
    <>
      <View style={styles.titleSection as ViewStyle}>
        <Text style={styles.flag as TextStyle}>🇸🇬</Text>
        <Text style={styles.title as TextStyle}>
          {t('singapore.travelInfo.title', { defaultValue: '新加坡入境准备' })}
        </Text>
        <Text style={styles.subtitle as TextStyle}>
          {t('singapore.travelInfo.subtitle', { defaultValue: '一步步填写，轻松搞定入境需要的信息' })}
        </Text>
      </View>

      <View style={styles.progressContainer as ViewStyle}>
        <View style={styles.progressBarContainer as ViewStyle}>
          <View
            style={[
              styles.progressBar as ViewStyle,
              { width: `${percent}%`, backgroundColor: progressColor },
            ]}
          />
        </View>
        <Text style={styles.progressText as TextStyle}>{progressText}</Text>
        <Text style={styles.completionHint as TextStyle}>
          {t('singapore.travelInfo.progressSummary', {
            defaultValue: `${filled}/${total} 项信息已完成`,
          })}
        </Text>
      </View>
    </>
  );
};

export default HeroSection;
