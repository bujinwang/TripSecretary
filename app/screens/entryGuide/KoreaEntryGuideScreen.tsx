/**
 * 韩国入境指引屏幕
 * 提供韩国入境完整流程的逐步指导
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
import { koreaEntryGuide as koreaGuideConfig } from '../../config/entryGuide/korea';
import UserDataService from '../../services/data/UserDataService';

// 从统一配置中获取步骤，确保屏幕与服务保持一致
const KOREA_ENTRY_STEPS = koreaGuideConfig.steps;

interface KoreaEntryGuideScreenProps {
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

const KoreaEntryGuideScreen: React.FC<KoreaEntryGuideScreenProps> = ({ navigation, route }) => {
  const { t, language } = useLocale();
  const { passport: rawPassport, destination, completionData } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set<string>());

  const currentStep = KOREA_ENTRY_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / KOREA_ENTRY_STEPS.length) * 100;

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const handleNextStep = () => {
    if (currentStepIndex < KOREA_ENTRY_STEPS.length - 1) {
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
    if (stepIndex <= currentStepIndex || completedSteps.has(KOREA_ENTRY_STEPS[stepIndex].id)) {
      setCurrentStepIndex(stepIndex);
    }
  };

  const getStepStatus = (stepIndex: number) => {
    const step = KOREA_ENTRY_STEPS[stepIndex];
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.stepIndicatorScroll}
          contentContainerStyle={styles.stepIndicatorContent}
        >
          {KOREA_ENTRY_STEPS.map((step: any, index: number) => {
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
        </ScrollView>
      </View>
    );
  };

  const handleOpenEntryPack = () => {
    if (!completionData) {
      Alert.alert(
        t('common.notice', { defaultValue: '提示' }),
        t('korea.entryGuide.missingData', { defaultValue: '请先在入境资料中填写必需信息，再尝试打开通关包。' })
      );
      return;
    }

    navigation.navigate('KoreaEntryPackPreview', {
      userData: completionData,
      passport,
      destination,
      entryPackData: {
        personalInfo: completionData?.personalInfo,
        travelInfo: completionData?.travel,
        funds: completionData?.funds,
        ketaSubmission: completionData?.ketaSubmission || null,
      },
    });
  };

  const renderCurrentStep = () => {
    const title = language?.startsWith('zh') ? currentStep.titleZh : currentStep.title;
    const description = language?.startsWith('zh') ? currentStep.descriptionZh : currentStep.description;
    const category = language?.startsWith('zh') ? (currentStep as any).categoryZh : currentStep.category;

    return (
      <View style={styles.currentStepContainer}>
        <View style={styles.stepHeader}>
          <View style={styles.stepCategoryBadge}>
            <Text style={styles.stepCategoryText}>{category || currentStep.category}</Text>
          </View>
          <Text style={styles.stepProgress}>
            {currentStepIndex + 1} / {KOREA_ENTRY_STEPS.length}
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

        {(currentStep as any).showEntryPack && (
          <View style={styles.entryPackCompactContainer}>
            <Button
              title={`${t('immigrationGuide.openEntryPack', { defaultValue: '打开通关包' })} 📋`}
              onPress={handleOpenEntryPack}
              size="medium"
              style={styles.entryPackButton}
            />
            <Text style={styles.entryPackCompactHint}>
              {t('korea.entryGuide.entryPackHintShort', {
                defaultValue: '护照、K-ETA二维码与资金凭证一键展示给移民官。',
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
            <Text style={styles.tipsTitle}>💡 温馨提示</Text>
            {currentStep.tips.map((tip: string, index: number) => (
              <Text key={index} style={styles.tipText}>• {tip}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>
          韩国入境指引 🇰🇷
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progress)}% {language?.startsWith('zh') ? '完成' : 'Complete'}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Current Step Content */}
        {renderCurrentStep()}

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          <Button
            title={language?.startsWith('zh') ? '上一步' : 'Previous'}
            onPress={handlePrevStep}
            disabled={currentStepIndex === 0}
            variant="secondary"
            style={styles.navButton}
          />
          <Button
            title={currentStepIndex === KOREA_ENTRY_STEPS.length - 1
              ? (language?.startsWith('zh') ? '完成' : 'Done')
              : (language?.startsWith('zh') ? '下一步' : 'Next')
            }
            onPress={handleNextStep}
            variant="primary"
            style={styles.navButton}
          />
        </View>

        {/* Important Notes Section */}
        {currentStepIndex === KOREA_ENTRY_STEPS.length - 1 && (
          <View style={styles.importantNotesSection}>
            <Text style={styles.importantNotesTitle}>
              🌟 韩国入境重要提醒
            </Text>
            {koreaGuideConfig.importantNotes.map((note: string, index: number) => (
              <Text key={index} style={styles.importantNoteText}>
                • {note}
              </Text>
            ))}
          </View>
        )}
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
    color: colors.text,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  progressBarContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepIndicatorContainer: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepIndicatorTitle: {
    ...typography.body2,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  stepIndicatorScroll: {
    paddingHorizontal: spacing.md,
  },
  stepIndicatorContent: {
    gap: spacing.sm,
  },
  stepIndicatorItem: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    minWidth: 80,
  },
  stepIndicatorCompleted: {
    backgroundColor: colors.success + '20',
  },
  stepIndicatorCurrent: {
    backgroundColor: colors.primary + '20',
  },
  stepIndicatorPending: {
    backgroundColor: colors.backgroundLight,
  },
  stepIndicatorIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  stepIndicatorIconCompleted: {
    color: colors.success,
  },
  stepIndicatorIconCurrent: {
    color: colors.primary,
  },
  stepIndicatorIconPending: {
    color: colors.textSecondary,
    opacity: 0.5,
  },
  stepIndicatorText: {
    ...typography.caption,
    textAlign: 'center',
  },
  stepIndicatorTextCompleted: {
    color: colors.success,
  },
  stepIndicatorTextCurrent: {
    color: colors.primary,
    fontWeight: '600',
  },
  stepIndicatorTextPending: {
    color: colors.textSecondary,
    opacity: 0.5,
  },
  currentStepContainer: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 4,
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
    ...typography.h2,
    color: colors.text,
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
    alignItems: 'center',
    gap: spacing.md,
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
    borderRadius: 4,
  },
  stepRequiredYes: {
    backgroundColor: colors.error + '20',
    color: colors.error,
  },
  stepRequiredNo: {
    backgroundColor: colors.backgroundLight,
    color: colors.textSecondary,
  },
  entryPackCompactContainer: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  entryPackButton: {
    marginBottom: spacing.sm,
  },
  entryPackCompactHint: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'center',
  },
  warningsContainer: {
    backgroundColor: '#FFF5F5',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  warningsTitle: {
    ...typography.body1,
    color: colors.error,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  warningText: {
    ...typography.body2,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  tipsContainer: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  tipsTitle: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  tipText: {
    ...typography.body2,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  navButton: {
    flex: 1,
  },
  importantNotesSection: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  importantNotesTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  importantNoteText: {
    ...typography.body1,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
});

export default KoreaEntryGuideScreen;
