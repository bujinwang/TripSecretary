/**
 * Vietnam Entry Guide Screen
 * Provides step-by-step guidance similar to the Japan interactive guide,
 * including paper arrival card instructions with visual references.
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocale } from '../../i18n/LocaleContext';
import BackButton from '../../components/BackButton';
import { colors, typography, spacing } from '../../theme';
import { vietnamEntryGuide as vietnamGuideConfig } from '../../config/entryGuide/vietnam';

const VIETNAM_ENTRY_STEPS = vietnamGuideConfig.steps;

const VietnamEntryGuideScreen = ({ navigation }) => {
  const { language } = useLocale();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const scrollViewRef = useRef(null);
  const stepLayouts = useRef({});
  const stepContainerWidth = useRef(0);

  const currentStep = useMemo(
    () => VIETNAM_ENTRY_STEPS[currentStepIndex],
    [currentStepIndex]
  );

  const progress = useMemo(
    () => ((currentStepIndex + 1) / VIETNAM_ENTRY_STEPS.length) * 100,
    [currentStepIndex]
  );

  const isChinese = language?.startsWith('zh');

  const handleStepComplete = (stepId) => {
    setCompletedSteps((prev) => new Set([...prev, stepId]));
  };

  const handleNextStep = () => {
    if (currentStepIndex < VIETNAM_ENTRY_STEPS.length - 1) {
      handleStepComplete(currentStep.id);
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleStepComplete(currentStep.id);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleStepPress = (index) => {
    if (index <= currentStepIndex || completedSteps.has(VIETNAM_ENTRY_STEPS[index].id)) {
      setCurrentStepIndex(index);
    }
  };

  const centerStepInView = useCallback((index) => {
    const layout = stepLayouts.current[index];
    const containerWidth = stepContainerWidth.current;

    if (!layout || !scrollViewRef.current || !containerWidth) {
      return;
    }

    const targetOffset = Math.max(
      0,
      layout.x + layout.width / 2 - containerWidth / 2
    );

    scrollViewRef.current.scrollTo({ x: targetOffset, animated: true });
  }, []);

  const handleStepLayout = useCallback(
    (index, event) => {
      const { x, width } = event.nativeEvent.layout;
      stepLayouts.current[index] = { x, width };

      if (index === currentStepIndex) {
        centerStepInView(index);
      }
    },
    [centerStepInView, currentStepIndex]
  );

  const handleScrollViewLayout = useCallback(
    (event) => {
      stepContainerWidth.current = event.nativeEvent.layout.width;
      centerStepInView(currentStepIndex);
    },
    [centerStepInView, currentStepIndex]
  );

  useEffect(() => {
    centerStepInView(currentStepIndex);
  }, [centerStepInView, currentStepIndex]);

  const getStepStatus = (index) => {
    const step = VIETNAM_ENTRY_STEPS[index];
    if (index < currentStepIndex) {
      return 'completed';
    }
    if (index === currentStepIndex) {
      return 'current';
    }
    if (completedSteps.has(step.id)) {
      return 'completed';
    }
    return 'pending';
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <Text style={styles.stepIndicatorTitle}>
        {isChinese ? '入境步骤进度' : 'Entry Steps Progress'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.stepIndicatorScroll}
        contentContainerStyle={styles.stepIndicatorContent}
        ref={scrollViewRef}
        onLayout={handleScrollViewLayout}
      >
        {VIETNAM_ENTRY_STEPS.map((step, index) => {
          const status = getStepStatus(index);
          const isCompleted = status === 'completed';
          const isCurrent = status === 'current';
          const isPending = status === 'pending';
          const label = isChinese ? step.titleZh || step.title : step.title;

          return (
            <TouchableOpacity
              key={step.id}
              style={[
                styles.stepIndicatorItem,
                isCompleted && styles.stepIndicatorCompleted,
                isCurrent && styles.stepIndicatorCurrent,
                isPending && styles.stepIndicatorPending,
              ]}
              onPress={() => handleStepPress(index)}
              disabled={isPending && index > currentStepIndex}
              onLayout={(event) => handleStepLayout(index, event)}
            >
              <Text
                style={[
                  styles.stepIndicatorIcon,
                  isCompleted && styles.stepIndicatorIconCompleted,
                  isCurrent && styles.stepIndicatorIconCurrent,
                  isPending && styles.stepIndicatorIconPending,
                ]}
              >
                {isCompleted ? '✓' : step.icon}
              </Text>
              <Text
                style={[
                  styles.stepIndicatorText,
                  isCompleted && styles.stepIndicatorTextCompleted,
                  isCurrent && styles.stepIndicatorTextCurrent,
                  isPending && styles.stepIndicatorTextPending,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderMedia = () => {
    if (!currentStep.media || currentStep.media.type !== 'image') {
      return null;
    }

    const caption = isChinese
      ? currentStep.media.captionZh || currentStep.media.caption
      : currentStep.media.caption || currentStep.media.captionZh;

    return (
      <View style={styles.mediaContainer}>
        <Image
          source={currentStep.media.source}
          style={styles.mediaImage}
          resizeMode="contain"
        />
        {caption ? <Text style={styles.mediaCaption}>{caption}</Text> : null}
      </View>
    );
  };

  const renderFormFields = () => {
    if (!Array.isArray(currentStep.formFields) || currentStep.formFields.length === 0) {
      return null;
    }

    return (
      <View style={styles.formFieldsContainer}>
        <Text style={styles.formFieldsTitle}>📝 {isChinese ? '表格填写要点' : 'Form Filling Tips'}</Text>
        {currentStep.formFields.map((field, index) => {
          const label = isChinese ? field.labelZh || field.label : field.label || field.labelZh;
          const guidance = isChinese
            ? field.guidanceZh || field.guidance
            : field.guidance || field.guidanceZh;

          return (
            <View key={`${field.label}-${index}`} style={styles.formFieldRow}>
              <Text style={styles.formFieldLabel}>{label}</Text>
              {guidance ? <Text style={styles.formFieldGuidance}>{guidance}</Text> : null}
            </View>
          );
        })}
      </View>
    );
  };

  const renderCurrentStep = () => {
    const title = isChinese ? currentStep.titleZh || currentStep.title : currentStep.title;
    const description = isChinese
      ? currentStep.descriptionZh || currentStep.description
      : currentStep.description || currentStep.descriptionZh;
    const category = isChinese
      ? currentStep.categoryZh || currentStep.category
      : currentStep.category || currentStep.categoryZh;

    return (
      <View style={styles.currentStepContainer}>
        <View style={styles.stepHeader}>
          <View style={styles.stepCategoryBadge}>
            <Text style={styles.stepCategoryText}>{category || (isChinese ? '步骤' : 'Step')}</Text>
          </View>
          <Text style={styles.stepProgress}>
            {currentStepIndex + 1} / {VIETNAM_ENTRY_STEPS.length}
          </Text>
        </View>

        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>

        <View style={styles.stepMeta}>
          <Text style={styles.stepTime}>⏱️ {currentStep.estimatedTime}</Text>
          <Text
            style={[
              styles.stepRequired,
              currentStep.required ? styles.stepRequiredYes : styles.stepRequiredNo,
            ]}
          >
            {currentStep.required ? (isChinese ? '必做步骤' : 'Required') : (isChinese ? '可选步骤' : 'Optional')}
          </Text>
        </View>

        {renderMedia()}

        {currentStep.warnings && currentStep.warnings.length > 0 && (
          <View style={styles.warningsContainer}>
            <Text style={styles.warningsTitle}>⚠️ {isChinese ? '重要提醒' : 'Important Warnings'}</Text>
            {currentStep.warnings.map((warning, index) => (
              <Text key={`warning-${index}`} style={styles.warningText}>
                • {warning}
              </Text>
            ))}
          </View>
        )}

        {renderFormFields()}

        {currentStep.tips && currentStep.tips.length > 0 && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 {isChinese ? '实用技巧' : 'Pro Tips'}</Text>
            {currentStep.tips.map((tip, index) => (
              <Text key={`tip-${index}`} style={styles.tipText}>
                • {tip}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderNavigationButtons = () => {
    const canGoPrev = currentStepIndex > 0;
    const canGoNext = currentStepIndex < VIETNAM_ENTRY_STEPS.length - 1;
    const isLastStep = currentStepIndex === VIETNAM_ENTRY_STEPS.length - 1;

    return (
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, !canGoPrev && styles.navButtonDisabled]}
          onPress={handlePrevStep}
          disabled={!canGoPrev}
        >
          <Text style={[styles.navButtonText, !canGoPrev && styles.navButtonTextDisabled]}>
            {isChinese ? '← 上一步' : '← Previous'}
          </Text>
        </TouchableOpacity>

        {isLastStep ? (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.completeButtonText}>
              {isChinese ? '完成指引 ✅' : 'Guide Completed ✅'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.navButton} onPress={handleNextStep}>
            <Text style={styles.navButtonText}>
              {isChinese ? '下一步 →' : 'Next →'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} label={isChinese ? '返回' : 'Back'} style={styles.backButton} />
        <Text style={styles.headerTitle}>
          {isChinese ? '越南入境指引 🇻🇳' : 'Vietnam Entry Guide 🇻🇳'}
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
  },
  content: {
    flex: 1,
  },
  stepIndicatorContainer: {
    paddingVertical: spacing.md,
  },
  stepIndicatorTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
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
    width: 120,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  stepIndicatorCompleted: {
    backgroundColor: '#E8F5E9',
    borderColor: '#66BB6A',
  },
  stepIndicatorCurrent: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  stepIndicatorPending: {
    backgroundColor: colors.white,
  },
  stepIndicatorIcon: {
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  stepIndicatorIconCompleted: {
    color: '#388E3C',
  },
  stepIndicatorIconCurrent: {
    color: '#1976D2',
  },
  stepIndicatorIconPending: {
    color: colors.textSecondary,
  },
  stepIndicatorText: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  stepIndicatorTextCompleted: {
    color: '#388E3C',
    fontWeight: '600',
  },
  stepIndicatorTextCurrent: {
    color: '#1976D2',
    fontWeight: '600',
  },
  stepIndicatorTextPending: {
    color: colors.textSecondary,
  },
  currentStepContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepCategoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  stepCategoryText: {
    ...typography.caption,
    color: '#4338CA',
    fontWeight: '600',
  },
  stepProgress: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stepTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stepTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stepRequired: {
    ...typography.caption,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stepRequiredYes: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
  },
  stepRequiredNo: {
    backgroundColor: '#FFF3E0',
    color: '#EF6C00',
  },
  mediaContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  mediaImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  mediaCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  warningsContainer: {
    backgroundColor: '#FFF4E5',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  warningsTitle: {
    ...typography.body2,
    fontWeight: '700',
    color: '#C25E00',
    marginBottom: spacing.xs,
  },
  warningText: {
    ...typography.body2,
    color: '#C25E00',
    marginBottom: spacing.xs,
  },
  formFieldsContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.25)',
  },
  formFieldsTitle: {
    ...typography.body2,
    fontWeight: '700',
    color: '#0B5AAA',
    marginBottom: spacing.sm,
  },
  formFieldRow: {
    marginBottom: spacing.sm,
  },
  formFieldLabel: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  formFieldGuidance: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  tipsContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  tipsTitle: {
    ...typography.body2,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: spacing.xs,
  },
  tipText: {
    ...typography.body2,
    color: '#2E7D32',
    marginBottom: spacing.xs,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    marginHorizontal: spacing.xs,
  },
  navButtonDisabled: {
    backgroundColor: colors.border,
  },
  navButtonText: {
    ...typography.body2,
    textAlign: 'center',
    color: '#1976D2',
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: colors.textSecondary,
  },
  completeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: '#0BD67B',
    marginHorizontal: spacing.xs,
  },
  completeButtonText: {
    ...typography.body2,
    textAlign: 'center',
    color: colors.white,
    fontWeight: '700',
  },
});

export default VietnamEntryGuideScreen;
