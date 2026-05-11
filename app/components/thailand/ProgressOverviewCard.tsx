// @ts-nocheck

// ProgressOverviewCard.js
// Progress overview component for Thailand Travel Info Screen
import React from 'react';
import { View, Text } from 'react-native';

const ProgressOverviewCard = ({ totalCompletionPercent, styles }) => (
    <View style={styles.progressOverviewCard}>
      <Text style={styles.progressTitle}>准备进度</Text>
      <View style={styles.progressSteps}>
        <View style={[styles.progressStep, totalCompletionPercent >= 25 && styles.progressStepActive]}>
          <Text style={styles.stepIcon}>👤</Text>
          <Text style={[styles.stepText, totalCompletionPercent >= 25 && styles.stepTextActive]}>
            护照信息 {totalCompletionPercent >= 25 ? '✓' : ''}
          </Text>
        </View>
        <View style={[styles.progressStep, totalCompletionPercent >= 50 && styles.progressStepActive]}>
          <Text style={styles.stepIcon}>✈️</Text>
          <Text style={[styles.stepText, totalCompletionPercent >= 50 && styles.stepTextActive]}>
            旅行信息 {totalCompletionPercent >= 50 ? '✓' : ''}
          </Text>
        </View>
        <View style={[styles.progressStep, totalCompletionPercent >= 75 && styles.progressStepActive]}>
          <Text style={styles.stepIcon}>🏨</Text>
          <Text style={[styles.stepText, totalCompletionPercent >= 75 && styles.stepTextActive]}>
            住宿信息 {totalCompletionPercent >= 75 ? '✓' : ''}
          </Text>
        </View>
        <View style={[styles.progressStep, totalCompletionPercent >= 100 && styles.progressStepActive]}>
          <Text style={styles.stepIcon}>💰</Text>
          <Text style={[styles.stepText, totalCompletionPercent >= 100 && styles.stepTextActive]}>
            资金证明 {totalCompletionPercent >= 100 ? '✓' : ''}
          </Text>
        </View>
      </View>
    </View>
  );

export default ProgressOverviewCard;
