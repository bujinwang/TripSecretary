// ProgressOverviewCard.js
// Progress overview component for Thailand Travel Info Screen
import React from 'react';
import { YStack, XStack, Text as TamaguiText } from '../tamagui';

const ProgressOverviewCard = ({ totalCompletionPercent, styles }) => {
  return (
    <YStack style={styles.progressOverviewCard}>
      <TamaguiText style={styles.progressTitle}>准备进度</TamaguiText>
      <XStack style={styles.progressSteps}>
        <YStack style={[styles.progressStep, totalCompletionPercent >= 25 && styles.progressStepActive]}>
          <TamaguiText style={styles.stepIcon}>👤</TamaguiText>
          <TamaguiText style={[styles.stepText, totalCompletionPercent >= 25 && styles.stepTextActive]}>
            护照信息 {totalCompletionPercent >= 25 ? '✓' : ''}
          </TamaguiText>
        </YStack>
        <YStack style={[styles.progressStep, totalCompletionPercent >= 50 && styles.progressStepActive]}>
          <TamaguiText style={styles.stepIcon}>✈️</TamaguiText>
          <TamaguiText style={[styles.stepText, totalCompletionPercent >= 50 && styles.stepTextActive]}>
            旅行信息 {totalCompletionPercent >= 50 ? '✓' : ''}
          </TamaguiText>
        </YStack>
        <YStack style={[styles.progressStep, totalCompletionPercent >= 75 && styles.progressStepActive]}>
          <TamaguiText style={styles.stepIcon}>🏨</TamaguiText>
          <TamaguiText style={[styles.stepText, totalCompletionPercent >= 75 && styles.stepTextActive]}>
            住宿信息 {totalCompletionPercent >= 75 ? '✓' : ''}
          </TamaguiText>
        </YStack>
        <YStack style={[styles.progressStep, totalCompletionPercent >= 100 && styles.progressStepActive]}>
          <TamaguiText style={styles.stepIcon}>💰</TamaguiText>
          <TamaguiText style={[styles.stepText, totalCompletionPercent >= 100 && styles.stepTextActive]}>
            资金证明 {totalCompletionPercent >= 100 ? '✓' : ''}
          </TamaguiText>
        </YStack>
      </XStack>
    </YStack>
  );
};

export default ProgressOverviewCard;
