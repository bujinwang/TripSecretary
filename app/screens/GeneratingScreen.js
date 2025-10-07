// 出国啰 - Generating Screen
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, typography, spacing } from '../theme';
import api from '../services/api';

const GeneratingScreen = ({ navigation, route }) => {
  const { passport, destination, travelInfo, passportId } = route.params || {};
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);

  const steps = [
    { id: 0, text: '识别证件信息', status: 'completed' },
    { id: 1, text: '验证有效期', status: 'completed' },
    { id: 2, text: `生成${destination?.name || ''}入境表格`, status: 'in_progress' },
    { id: 3, text: '生成海关问答卡', status: 'pending' },
    { id: 4, text: '翻译为当地语言', status: 'pending' },
  ];

  useEffect(() => {
    generateEntryForm();
  }, []);

  const generateEntryForm = async () => {
    try {
      // Simulate step-by-step progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 3, 90));
      }, 150);

      const stepInterval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1200);

      // Call API to generate entry form
      const result = await api.generateEntryForm({
        passportId: passportId || 1,
        destination: {
          id: destination?.id || 'th',
          name: destination?.name || '泰国',
        },
        travelInfo: travelInfo || {},
      });

      clearInterval(progressInterval);
      clearInterval(stepInterval);
      
      // Complete progress
      setProgress(100);
      setCurrentStep(steps.length - 1);

      // Navigate to result with generated data
      setTimeout(() => {
        navigation.replace('Result', {
          passport,
          destination,
          travelInfo,
          generationId: result.id,
        });
      }, 500);
    } catch (error) {
      console.error('Generation error:', error);
      setError(error.message);
      Alert.alert(
        '生成失败',
        error.message || '请稍后重试',
        [
          {
            text: '重试',
            onPress: () => generateEntryForm(),
          },
          {
            text: '返回',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    }
  };

  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'in_progress';
    return 'pending';
  };

  const renderStepIcon = (status) => {
    if (status === 'completed') return '✅';
    if (status === 'in_progress') return '🔄';
    return '⏳';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Animation Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconEmoji}>✨</Text>
          <Text style={styles.title}>处理中</Text>
        </View>

        {/* Main Message */}
        <Text style={styles.message}>AI正在生成您的通关包</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        {/* Steps List */}
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>正在做什么:</Text>
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <View key={step.id} style={styles.stepRow}>
                <Text style={styles.stepIcon}>{renderStepIcon(status)}</Text>
                <Text
                  style={[
                    styles.stepText,
                    status === 'in_progress' && styles.stepTextActive,
                  ]}
                >
                  {step.text}
                </Text>
                {status === 'in_progress' && (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                    style={styles.stepLoader}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Estimated Time */}
        <Text style={styles.estimateText}>
          预计还需 {Math.max(0, Math.ceil((100 - progress) / 6))} 秒...
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconEmoji: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  message: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  stepsContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  stepsTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  stepText: {
    ...typography.body1,
    color: colors.textSecondary,
    flex: 1,
  },
  stepTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  stepLoader: {
    marginLeft: spacing.sm,
  },
  estimateText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
});

export default GeneratingScreen;
