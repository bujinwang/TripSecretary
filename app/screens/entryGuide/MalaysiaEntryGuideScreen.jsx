/**
 * 马来西亚入境指引屏幕
 * 提供马来西亚入境完整流程的逐步指导
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocale } from '../../i18n/LocaleContext';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import { colors, typography, spacing } from '../../theme';
import { malaysiaEntryGuide as malaysiaGuideConfig } from '../../config/entryGuide/malaysia';
import UserDataService from '../../services/data/UserDataService';

// 从统一配置中获取步骤，确保屏幕与服务保持一致
const MALAYSIA_ENTRY_STEPS = malaysiaGuideConfig.steps;

const MalaysiaEntryGuideScreen = ({ navigation, route }) => {
  const { t, language } = useLocale();
  const { passport: rawPassport, destination, completionData } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const currentStep = MALAYSIA_ENTRY_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / MALAYSIA_ENTRY_STEPS.length) * 100;

  const handleStepComplete = (stepId) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const handleNextStep = () => {
    if (currentStepIndex < MALAYSIA_ENTRY_STEPS.length - 1) {
      handleStepComplete(currentStep.id);
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleStepComplete(currentStep.id);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleStepNavigation = (index) => {
    setCurrentStepIndex(index);
  };

  const isStepCompleted = (stepId) => {
    return completedSteps.has(stepId);
  };

  const isLastStep = currentStepIndex === MALAYSIA_ENTRY_STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>马来西亚入境指引</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          第 {currentStepIndex + 1} 步 / 共 {MALAYSIA_ENTRY_STEPS.length} 步
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Step Content */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepIcon}>{currentStep.icon}</Text>
            <View style={styles.stepHeaderText}>
              <Text style={styles.stepCategory}>{currentStep.category}</Text>
              <Text style={styles.stepTitle}>{currentStep.titleZh || currentStep.title}</Text>
            </View>
          </View>

          <Text style={styles.stepDescription}>
            {currentStep.descriptionZh || currentStep.description}
          </Text>

          {currentStep.estimatedTime && (
            <View style={styles.timeEstimate}>
              <Text style={styles.timeIcon}>⏱️</Text>
              <Text style={styles.timeText}>预计时间: {currentStep.estimatedTime}</Text>
            </View>
          )}

          {/* Warnings */}
          {currentStep.warnings && currentStep.warnings.length > 0 && (
            <View style={styles.warningsSection}>
              <Text style={styles.sectionTitle}>⚠️ 重要提醒</Text>
              {currentStep.warnings.map((warning, index) => (
                <View key={index} style={styles.warningItem}>
                  <Text style={styles.warningBullet}>•</Text>
                  <Text style={styles.warningText}>{warning}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tips */}
          {currentStep.tips && currentStep.tips.length > 0 && (
            <View style={styles.tipsSection}>
              <Text style={styles.sectionTitle}>💡 实用建议</Text>
              {currentStep.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Step Navigation Dots */}
        <View style={styles.stepsNavigation}>
          {MALAYSIA_ENTRY_STEPS.map((step, index) => (
            <TouchableOpacity
              key={step.id}
              style={[
                styles.stepDot,
                index === currentStepIndex && styles.stepDotActive,
                isStepCompleted(step.id) && styles.stepDotCompleted,
              ]}
              onPress={() => handleStepNavigation(index)}
            >
              <Text style={styles.stepDotText}>{index + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <View style={styles.navigationButtons}>
            <Button
              title="上一步"
              onPress={handlePrevStep}
              variant="secondary"
              disabled={isFirstStep}
              style={styles.navButton}
            />
            <Button
              title={isLastStep ? '完成' : '下一步'}
              onPress={() => {
                if (isLastStep) {
                  handleStepComplete(currentStep.id);
                  Alert.alert(
                    '恭喜！',
                    '你已完成马来西亚入境指引。祝你旅途愉快！🎉',
                    [
                      {
                        text: '返回',
                        onPress: () => navigation.goBack()
                      }
                    ]
                  );
                } else {
                  handleNextStep();
                }
              }}
              variant="primary"
              style={styles.navButton}
            />
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesSectionTitle}>📌 重要提醒</Text>
          {malaysiaGuideConfig.importantNotes.map((note, index) => (
            <View key={index} style={styles.noteItem}>
              <Text style={styles.noteBullet}>•</Text>
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ))}
        </View>

        {/* Emergency Contacts */}
        <View style={styles.emergencySection}>
          <Text style={styles.emergencySectionTitle}>🆘 紧急联系方式</Text>
          <View style={styles.emergencyItem}>
            <Text style={styles.emergencyLabel}>警察/救护车:</Text>
            <Text style={styles.emergencyValue}>{malaysiaGuideConfig.emergency.police}</Text>
          </View>
          <View style={styles.emergencyItem}>
            <Text style={styles.emergencyLabel}>旅游警察:</Text>
            <Text style={styles.emergencyValue}>{malaysiaGuideConfig.emergency.touristPolice}</Text>
          </View>
          <View style={styles.emergencyItem}>
            <Text style={styles.emergencyLabel}>移民局:</Text>
            <Text style={styles.emergencyValue}>{malaysiaGuideConfig.emergency.immigration}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  stepCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepIcon: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  stepHeaderText: {
    flex: 1,
  },
  stepCategory: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  stepTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  stepDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  timeIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  timeText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  warningsSection: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  tipsSection: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  sectionTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  warningItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  warningBullet: {
    ...typography.body2,
    color: '#FF9500',
    marginRight: spacing.xs,
    fontWeight: '700',
  },
  warningText: {
    ...typography.body2,
    color: '#D97706',
    flex: 1,
    lineHeight: 20,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  tipBullet: {
    ...typography.body2,
    color: '#34C759',
    marginRight: spacing.xs,
    fontWeight: '700',
  },
  tipText: {
    ...typography.body2,
    color: '#059669',
    flex: 1,
    lineHeight: 20,
  },
  stepsNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginVertical: spacing.lg,
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.xs,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotCompleted: {
    backgroundColor: colors.success,
  },
  stepDotText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '700',
  },
  actionsContainer: {
    marginBottom: spacing.lg,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  notesSection: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
  },
  notesSectionTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  noteItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  noteBullet: {
    ...typography.body2,
    color: '#F59E0B',
    marginRight: spacing.xs,
    fontWeight: '700',
  },
  noteText: {
    ...typography.body2,
    color: '#D97706',
    flex: 1,
    lineHeight: 20,
  },
  emergencySection: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  emergencySectionTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emergencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.1)',
  },
  emergencyLabel: {
    ...typography.body2,
    color: '#DC2626',
    fontWeight: '600',
  },
  emergencyValue: {
    ...typography.body2,
    color: '#DC2626',
    fontWeight: '700',
  },
});

export default MalaysiaEntryGuideScreen;
