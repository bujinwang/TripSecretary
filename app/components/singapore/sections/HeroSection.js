/**
 * HeroSection Component
 *
 * Introductory hero with progress summary for Singapore Travel Info Screen
 */

import React from 'react';
import { View, Text } from 'react-native';

const HeroSection = ({
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

  const filled = completionMetrics?.total?.filled ?? 0;
  const total = completionMetrics?.total?.total ?? 0;
  const percent = Math.min(100, Math.max(0, Math.round(totalCompletionPercent || 0)));

  return (
    <>
      <View style={styles.titleSection}>
        <Text style={styles.flag}>🇸🇬</Text>
        <Text style={styles.title}>
          {t('singapore.travelInfo.title', { defaultValue: '新加坡入境准备' })}
        </Text>
        <Text style={styles.subtitle}>
          {t('singapore.travelInfo.subtitle', { defaultValue: '一步步填写，轻松搞定入境需要的信息' })}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${percent}%`, backgroundColor: progressColor },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{progressText}</Text>
        <Text style={styles.completionHint}>
          {t('singapore.travelInfo.progressSummary', {
            defaultValue: `${filled}/${total} 项信息已完成`,
          })}
        </Text>
      </View>
    </>
  );
};

export default HeroSection;
