// @ts-nocheck
/**
 * 香港入境指引屏幕
 * 提供香港入境完整流程的逐步指导
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
import UserDataService from '../../services/data/UserDataService';

// 从统一配置中获取步骤，确保屏幕与服务保持一致
// const HONGKONG_ENTRY_STEPS = hongkongGuideConfig.steps;
const HONGKONG_ENTRY_STEPS: any[] = []; // Placeholder

interface HongKongEntryGuideScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (route: string, params?: any) => void;
  };
  route: {
    params?: {
      passport?: any;
      destination?: string;
      completionData?: any;
    };
  };
}

const HongKongEntryGuideScreen: React.FC<HongKongEntryGuideScreenProps> = ({ navigation, route }) => {
  const { t, language } = useLocale();
  const { passport: rawPassport, destination, completionData } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set<string>());

  const currentStep = HONGKONG_ENTRY_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / HONGKONG_ENTRY_STEPS.length) * 100;

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const handleNextStep = () => {
    if (currentStepIndex < HONGKONG_ENTRY_STEPS.length - 1) {
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

  const handleStepPress = (stepIndex: number) => {
    // 允许跳转到已完成的步骤或当前步骤的前一个步骤
    if (stepIndex <= currentStepIndex || completedSteps.has(HONGKONG_ENTRY_STEPS[stepIndex].id)) {
      setCurrentStepIndex(stepIndex);
    }
  };

  const getStepStatus = (stepIndex: number) => {
    const step = HONGKONG_ENTRY_STEPS[stepIndex];
    if (stepIndex < currentStepIndex) {
      return 'completed';
    } else if (stepIndex === currentStepIndex) {
      return 'current';
    } else if (completedSteps.has(step.id)) {
      return 'completed';
    } else {
      return 'pending';
    }
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicatorContainer}>
        <Text style={styles.stepIndicatorTitle}>
          {language?.startsWith('zh') ? '入境步骤进度' : 'Entry Steps Progress'}
        </Text>
        <View style={styles.stepIndicatorGrid}>
          {HONGKONG_ENTRY_STEPS.map((step: any, index: number) => {
            const status = getStepStatus(index);
            return (
              <TouchableOpacity
                key={step.id}
                style={[
                  styles.stepIndicatorItem,
                  status === 'completed' && styles.stepIndicatorCompleted,
                  status === 'current' && styles.stepIndicatorCurrent,
                  status === 'pending' && styles.stepIndicatorPending
                ]}
                onPress={() => handleStepPress(index)}
                disabled={status === 'pending' && index > currentStepIndex}
              >
                <Text style={[
                  styles.stepIndicatorIcon,
                  status === 'completed' && styles.stepIndicatorIconCompleted,
                  status === 'current' && styles.stepIndicatorIconCurrent,
                  status === 'pending' && styles.stepIndicatorIconPending
                ]}>
                  {status === 'completed' ? '✓' : step.icon}
                </Text>
                <Text style={[
                  styles.stepIndicatorText,
                  status === 'completed' && styles.stepIndicatorTextCompleted,
                  status === 'current' && styles.stepIndicatorTextCurrent,
                  status === 'pending' && styles.stepIndicatorTextPending
                ]} numberOfLines={1}>
                  {language?.startsWith('zh') ? step.titleZh : step.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const handleOpenEntryPack = () => {
    if (!completionData) {
      Alert.alert(
        t('common.notice', { defaultValue: '提示' }),
        t('hongkong.entryGuide.missingData', { defaultValue: '请先在入境资料中填写必需信息，再尝试打开通关包。' })
      );
      return;
    }

    navigation.navigate('HongKongEntryPackPreview', {
      userData: completionData,
      passport,
      destination,
      entryPackData: {
        personalInfo: completionData?.personalInfo,
        travelInfo: completionData?.travel,
        funds: completionData?.funds,
        hdacSubmission: completionData?.hdacSubmission || null,
      },
    });
  };

  const renderCurrentStep = () => {
    const title = language?.startsWith('zh') ? currentStep.titleZh : currentStep.title;
    const description = language?.startsWith('zh') ? currentStep.descriptionZh : currentStep.description;
    const category = language?.startsWith('zh') ? currentStep.categoryZh : currentStep.category;

    return (
      <View style={styles.currentStepContainer}>
        <View style={styles.stepHeader}>
          <View style={styles.stepCategoryBadge}>
            <Text style={styles.stepCategoryText}>{category}</Text>
          </View>
          <Text style={styles.stepProgress}>
            {currentStepIndex + 1} / {HONGKONG_ENTRY_STEPS.length}
          </Text>
        </View>

        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>

        <View style={styles.stepMeta}>
          <Text style={styles.stepTime}>⏱️ {currentStep.estimatedTime}</Text>
          <Text style={[
            styles.stepRequired,
            currentStep.required ? styles.stepRequiredYes : styles.stepRequiredNo
          ]}>
            {currentStep.required ? '必做步骤' : '可选步骤'}
          </Text>
        </View>

        {currentStep.showEntryPack && (
          <View style={styles.entryPackCompactContainer}>
            <Button
              title={`${t('immigrationGuide.openEntryPack', { defaultValue: '打开通关包' })} 📋`}
              onPress={handleOpenEntryPack}
              size="medium"
              style={styles.entryPackButton}
            />
            <Text style={styles.entryPackCompactHint}>
              {t('hongkong.entryGuide.entryPackHintShort', {
                defaultValue: '护照、港澳通行证与资金凭证一键展示给移民官。',
              })}
            </Text>
          </View>
        )}

        {currentStep.warnings && currentStep.warnings.length > 0 && (
          <View style={styles.warningsContainer}>
            <Text style={styles.warningsTitle}>⚠️ 重要提醒</Text>
            {currentStep.warnings.map((warning: string, index: number) => (
              <Text key={index} style={styles.warningText}>• {warning}</Text>
            ))}
          </View>
        )}

        {currentStep.tips && currentStep.tips.length > 0 && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 实用技巧</Text>
            {currentStep.tips.map((tip: string, index: number) => (
              <Text key={index} style={styles.tipText}>• {tip}</Text>
            ))}
          </View>
        )}

      </View>
    );
  };

  const renderNavigationButtons = () => {
    const canGoPrev = currentStepIndex > 0;
    const canGoNext = currentStepIndex < HONGKONG_ENTRY_STEPS.length - 1;
    const isLastStep = currentStepIndex === HONGKONG_ENTRY_STEPS.length - 1;

    return (
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, !canGoPrev && styles.navButtonDisabled]}
          onPress={handlePrevStep}
          disabled={!canGoPrev}
        >
          <Text style={[styles.navButtonText, !canGoPrev && styles.navButtonTextDisabled]}>
            ← 上一步
          </Text>
        </TouchableOpacity>

        {isLastStep ? (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => Alert.alert('恭喜！', '您已完成香港入境指引！')}
          >
            <Text style={styles.completeButtonText}>完成入境指引 ✅</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextStep}
          >
            <Text style={styles.navButtonText}>下一步 →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>
          香港入境指引 (HDAC) 🇭🇰
        </Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepIndicator()}
        {renderCurrentStep()}
      </ScrollView>

      {renderNavigationButtons()}
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
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  stepIndicatorContainer: {
    backgroundColor: colors.white,
    marginTop: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stepIndicatorTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  stepIndicatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  stepIndicatorItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    width: '30%',
    marginBottom: spacing.sm,
    marginHorizontal: '1%',
  },
  stepIndicatorCompleted: {
    backgroundColor: colors.success + '20',
  },
  stepIndicatorCurrent: {
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  stepIndicatorPending: {
    backgroundColor: colors.border,
  },
  stepIndicatorIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  stepIndicatorIconCompleted: {
    color: colors.success,
  },
  stepIndicatorIconCurrent: {
    color: colors.primary,
  },
  stepIndicatorIconPending: {
    color: colors.textSecondary,
  },
  stepIndicatorText: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  stepIndicatorTextCompleted: {
    color: colors.success,
  },
  stepIndicatorTextCurrent: {
    color: colors.primary,
  },
  stepIndicatorTextPending: {
    color: colors.textSecondary,
  },
  currentStepContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepCategoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  stepCategoryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  stepProgress: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stepTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  stepDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  stepMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepTime: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  stepRequired: {
    ...typography.caption,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    fontWeight: '600',
  },
  stepRequiredYes: {
    backgroundColor: '#FFEAA7',
    color: '#856404',
  },
  stepRequiredNo: {
    backgroundColor: '#D4EDDA',
    color: '#155724',
  },
  warningsContainer: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warningsTitle: {
    ...typography.body2,
    color: colors.error,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  warningText: {
    ...typography.body2,
    color: colors.error,
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  tipsTitle: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tipText: {
    ...typography.body2,
    color: colors.primary,
    lineHeight: 20,
  },
  entryPackCompactContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  entryPackButton: {
    width: '100%',
  },
  entryPackCompactHint: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  navButtonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  navButtonText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: colors.textSecondary,
  },
  completeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.success,
  },
  completeButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '600',
  },
});

export default HongKongEntryGuideScreen;