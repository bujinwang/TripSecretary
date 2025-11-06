/**
 * EntryGuideTemplate
 *
 * Reusable template for interactive entry guides.
 * Extracted from VietnamEntryGuideScreen to enable config-driven implementations.
 */

/* eslint-disable react/prop-types */

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import { useLocale } from '../i18n/LocaleContext';
import { colors, typography, spacing } from '../theme';
import { Alert } from 'react-native';

const EntryGuideTemplateContext = createContext(null);

const useEntryGuideTemplate = () => {
  const context = useContext(EntryGuideTemplateContext);
  if (!context) {
    throw new Error('useEntryGuideTemplate must be used within EntryGuideTemplate');
  }
  return context;
};

const resolveLabel = (label, isChinese, fallbackZh, fallbackEn) => {
  if (!label) {
    return isChinese ? fallbackZh : fallbackEn;
  }

  if (typeof label === 'string') {
    return label;
  }

  if (isChinese) {
    return (
      label.zh ||
      label.cn ||
      label.zhHans ||
      label.zhCN ||
      label['zh-CN'] ||
      label.default ||
      label.en ||
      fallbackZh
    );
  }

  return (
    label.en ||
    label.us ||
    label.default ||
    label.zh ||
    label.zhCN ||
    label['zh-CN'] ||
    fallbackEn
  );
};

const EntryGuideTemplate = ({
  children,
  config,
  navigation,
  route,
  onComplete,
}) => {
  const { language, t } = useLocale();
  const configSteps = config?.steps;
  const steps = useMemo(
    () => (Array.isArray(configSteps) ? configSteps : []),
    [configSteps]
  );
  const isChinese = language?.startsWith('zh');

  const [currentStepIndex, setCurrentStepIndex] = useState(() =>
    Math.min(Math.max(config?.initialStepIndex || 0, 0), Math.max(steps.length - 1, 0))
  );
  const [completedSteps, setCompletedSteps] = useState(
    () => new Set(config?.completedStepIds || [])
  );

  const currentStep = useMemo(
    () => steps[currentStepIndex] || null,
    [steps, currentStepIndex]
  );

  const progress = useMemo(() => {
    if (!steps.length) {
      return 0;
    }
    return ((currentStepIndex + 1) / steps.length) * 100;
  }, [currentStepIndex, steps.length]);

  const markStepComplete = useCallback((stepId) => {
    if (!stepId) {
      return;
    }
    setCompletedSteps((prev) => {
      if (prev.has(stepId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(stepId);
      return next;
    });
  }, []);

  const handleNextStep = useCallback(() => {
    if (!steps.length) {
      return;
    }
    const step = steps[currentStepIndex];
    if (step?.id) {
      markStepComplete(step.id);
    }
    setCurrentStepIndex((prev) =>
      prev >= steps.length - 1 ? prev : prev + 1
    );
  }, [currentStepIndex, steps, markStepComplete]);

  const handlePrevStep = useCallback(() => {
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleStepPress = useCallback(
    (index) => {
      if (index < 0 || index >= steps.length) {
        return;
      }
      if (index <= currentStepIndex) {
        setCurrentStepIndex(index);
        return;
      }
      const targetStep = steps[index];
      if (targetStep?.id && completedSteps.has(targetStep.id)) {
        setCurrentStepIndex(index);
      }
    },
    [steps, currentStepIndex, completedSteps]
  );

  const handleCompleteGuide = useCallback(() => {
    if (typeof onComplete === 'function') {
      onComplete({
        steps,
        currentStep,
        completedSteps: Array.from(completedSteps),
      });
      return;
    }

    if (navigation?.goBack) {
      navigation.goBack();
    }
  }, [onComplete, steps, currentStep, completedSteps, navigation]);

  const contextValue = useMemo(
    () => ({
      config,
      steps,
      currentStep,
      currentStepIndex,
      setCurrentStepIndex,
      completedSteps,
      markStepComplete,
      handleNextStep,
      handlePrevStep,
      handleStepPress,
      progress,
      isChinese,
      t,
      language,
      navigation,
      route,
      handleCompleteGuide,
    }),
    [
      config,
      steps,
      currentStep,
      currentStepIndex,
      completedSteps,
      markStepComplete,
      handleNextStep,
      handlePrevStep,
      handleStepPress,
      progress,
      isChinese,
      t,
      language,
      navigation,
      route,
      handleCompleteGuide,
    ]
  );

  return (
    <EntryGuideTemplateContext.Provider value={contextValue}>
      <SafeAreaView style={styles.container}>{children}</SafeAreaView>
    </EntryGuideTemplateContext.Provider>
  );
};

EntryGuideTemplate.useTemplate = useEntryGuideTemplate;

const EntryGuideTemplateHeader = ({
  title,
  titleEn,
  titleZh,
  backLabel,
  backLabelEn,
  backLabelZh,
  rightComponent = null,
}) => {
  const { isChinese, navigation } = useEntryGuideTemplate();

  const resolvedTitle = title
    ? title
    : resolveLabel(
        { zh: titleZh, en: titleEn },
        isChinese,
        '越南入境指引 🇻🇳',
        'Entry Guide'
      );

  const resolvedBackLabel = backLabel
    ? backLabel
    : resolveLabel(
        { zh: backLabelZh, en: backLabelEn },
        isChinese,
        '返回',
        'Back'
      );

  return (
    <View style={styles.header}>
      <BackButton
        onPress={() => navigation?.goBack?.()}
        label={resolvedBackLabel}
        style={styles.backButton}
      />
      <Text style={styles.headerTitle}>{resolvedTitle}</Text>
      <View style={styles.headerRight}>{rightComponent}</View>
    </View>
  );
};

const EntryGuideTemplateProgressBar = ({ color }) => {
  const { progress, config } = useEntryGuideTemplate();
  const progressColor =
    color ||
    config?.theme?.progressColor ||
    colors.primary;

  return (
    <View style={styles.progressBar}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${progress}%`,
            backgroundColor: progressColor,
          },
        ]}
      />
    </View>
  );
};

const EntryGuideTemplateStepIndicator = () => {
  const {
    steps,
    currentStepIndex,
    handleStepPress,
    completedSteps,
    isChinese,
  } = useEntryGuideTemplate();

  const scrollViewRef = useRef(null);
  const stepLayoutsRef = useRef({});
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  const centerStepInView = useCallback(
    (index) => {
      const layout = stepLayoutsRef.current[index];
      if (
        !layout ||
        !scrollViewRef.current ||
        containerWidth <= 0
      ) {
        return;
      }

      const targetOffset = Math.max(
        0,
        layout.x + layout.width / 2 - containerWidth / 2
      );
      const maxOffset = Math.max(0, contentWidth - containerWidth);
      const clampedOffset = Math.min(targetOffset, maxOffset);

      scrollViewRef.current.scrollTo({
        x: clampedOffset,
        animated: true,
      });
    },
    [containerWidth, contentWidth]
  );

  useEffect(() => {
    centerStepInView(currentStepIndex);
  }, [centerStepInView, currentStepIndex]);

  const getStepStatus = useCallback(
    (index) => {
      const step = steps[index];
      if (!step) {
        return 'pending';
      }

      if (index < currentStepIndex) {
        return 'completed';
      }

      if (index === currentStepIndex) {
        return 'current';
      }

      if (step.id && completedSteps.has(step.id)) {
        return 'completed';
      }

      return 'pending';
    },
    [steps, currentStepIndex, completedSteps]
  );

  const getStepLabel = useCallback(
    (step) => {
      if (!step) {
        return '';
      }
      return resolveLabel(
        { zh: step.titleZh, en: step.title },
        isChinese,
        step.titleZh || step.title,
        step.title || step.titleZh
      );
    },
    [isChinese]
  );

  if (!steps.length) {
    return null;
  }

  const { t } = useEntryGuideTemplate();
  
  return (
    <View style={styles.stepIndicatorContainer}>
      <Text style={styles.stepIndicatorTitle}>
        {t('entryGuide.stepProgress.title', { defaultValue: isChinese ? '入境步骤进度' : 'Entry Steps Progress' })}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.stepIndicatorScroll}
        contentContainerStyle={styles.stepIndicatorContent}
        ref={scrollViewRef}
        onLayout={(event) => {
          setContainerWidth(event.nativeEvent.layout.width);
        }}
        onContentSizeChange={(width) => {
          setContentWidth(width);
        }}
      >
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isCompleted = status === 'completed';
          const isCurrent = status === 'current';
          const isPending = status === 'pending';
          const label = getStepLabel(step);

          return (
            <TouchableOpacity
              key={step.id || index}
              style={[
                styles.stepIndicatorItem,
                isCompleted && styles.stepIndicatorCompleted,
                isCurrent && styles.stepIndicatorCurrent,
                isPending && styles.stepIndicatorPending,
              ]}
              onPress={() => handleStepPress(index)}
              disabled={isPending && index > currentStepIndex}
              onLayout={(event) => {
                stepLayoutsRef.current[index] = {
                  x: event.nativeEvent.layout.x,
                  width: event.nativeEvent.layout.width,
                };
              }}
            >
              <Text
                style={[
                  styles.stepIndicatorIcon,
                  isCompleted && styles.stepIndicatorIconCompleted,
                  isCurrent && styles.stepIndicatorIconCurrent,
                  isPending && styles.stepIndicatorIconPending,
                ]}
              >
                {isCompleted ? '✓' : step.icon || '⬤'}
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
};

const EntryGuideTemplateCurrentStep = () => {
  const { currentStep, currentStepIndex, steps, isChinese, navigation, route, config, t } =
    useEntryGuideTemplate();

  if (!currentStep) {
    return (
      <View style={styles.currentStepContainer}>
        <Text style={styles.stepTitle}>
          {t('entryGuide.stepProgress.noSteps', { defaultValue: isChinese ? '暂无步骤' : 'No steps configured' })}
        </Text>
        <Text style={styles.stepDescription}>
          {t('entryGuide.stepProgress.noStepsDescription', { 
            defaultValue: isChinese
              ? '请检查配置文件是否正确提供步骤数据。'
              : 'Please ensure the configuration supplies the expected steps.' 
          })}
        </Text>
      </View>
    );
  }

  const title = resolveLabel(
    { zh: currentStep.titleZh, en: currentStep.title },
    isChinese,
    currentStep.titleZh || currentStep.title,
    currentStep.title || currentStep.titleZh
  );

  const description = resolveLabel(
    { zh: currentStep.descriptionZh, en: currentStep.description },
    isChinese,
    currentStep.descriptionZh || currentStep.description,
    currentStep.description || currentStep.descriptionZh
  );

  // Resolve category with i18n support
  const categoryKey = currentStep.category || '';
  // Map common category values to translation keys
  const categoryKeyMap = {
    'pre-arrival': 'preArrival',
    'pre_arrival': 'preArrival',
    'prearrival': 'preArrival',
    'pre-flight': 'preFlight',
    'pre_flight': 'preFlight',
    'preflight': 'preFlight',
    'in-flight': 'inFlight',
    'in_flight': 'inFlight',
    'inflight': 'inFlight',
    'post-landing': 'postLanding',
    'post_landing': 'postLanding',
    'postlanding': 'postLanding',
    'immigration': 'immigration',
    'baggage': 'baggage',
    'customs': 'customs',
  };
  const mappedCategoryKey = categoryKeyMap[categoryKey.toLowerCase()] || categoryKey.toLowerCase().replace(/[-\s]/g, '');
  const categoryTranslationKey = `entryGuide.category.${mappedCategoryKey}`;
  const categoryFallback = resolveLabel(
    { zh: currentStep.categoryZh, en: currentStep.category },
    isChinese,
    currentStep.categoryZh || currentStep.category,
    currentStep.category || currentStep.categoryZh || ''
  );
  
  const category = categoryFallback 
    ? t(categoryTranslationKey, { defaultValue: categoryFallback })
    : t('entryGuide.category.default', { defaultValue: isChinese ? '步骤' : 'Step' });

  const renderMedia = () => {
    if (!currentStep.media || currentStep.media.type !== 'image') {
      return null;
    }

    const caption = resolveLabel(
      { zh: currentStep.media.captionZh, en: currentStep.media.caption },
      isChinese,
      currentStep.media.captionZh || currentStep.media.caption,
      currentStep.media.caption || currentStep.media.captionZh
    );

    return (
      <View style={styles.mediaContainer}>
        <Image
          source={currentStep.media.source}
          style={styles.mediaImage}
          resizeMode="contain"
        />
        {caption ? (
          <Text style={styles.mediaCaption}>{caption}</Text>
        ) : null}
      </View>
    );
  };

  const renderFormFields = () => {
    if (!Array.isArray(currentStep.formFields) || !currentStep.formFields.length) {
      return null;
    }
    
    return (
      <View style={styles.formFieldsContainer}>
        <Text style={styles.formFieldsTitle}>
          {t('entryGuide.sections.formFields', { defaultValue: isChinese ? '📝 表格填写要点' : '📝 Form Filling Tips' })}
        </Text>
        {currentStep.formFields.map((field, index) => {
          const label = resolveLabel(
            { zh: field.labelZh, en: field.label },
            isChinese,
            field.labelZh || field.label,
            field.label || field.labelZh
          );
          const guidance = resolveLabel(
            { zh: field.guidanceZh, en: field.guidance },
            isChinese,
            field.guidanceZh || field.guidance,
            field.guidance || field.guidanceZh
          );

          return (
            <View
              key={`${field.label || field.labelZh || 'field'}-${index}`}
              style={styles.formFieldRow}
            >
              <Text style={styles.formFieldLabel}>{label}</Text>
              {guidance ? (
                <Text style={styles.formFieldGuidance}>{guidance}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  };

  const renderWarnings = () => {
    if (!Array.isArray(currentStep.warnings) || !currentStep.warnings.length) {
      return null;
    }
    
    return (
      <View style={styles.warningsContainer}>
        <Text style={styles.warningsTitle}>
          {t('entryGuide.sections.warnings', { defaultValue: isChinese ? '⚠️ 重要提醒' : '⚠️ Important Warnings' })}
        </Text>
        {currentStep.warnings.map((warning, index) => (
          <Text key={`warning-${index}`} style={styles.warningText}>
            • {warning}
          </Text>
        ))}
      </View>
    );
  };

  const renderTips = () => {
    if (!Array.isArray(currentStep.tips) || !currentStep.tips.length) {
      return null;
    }
    
    return (
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>
          {t('entryGuide.sections.tips', { defaultValue: isChinese ? '💡 实用技巧' : '💡 Pro Tips' })}
        </Text>
        {currentStep.tips.map((tip, index) => (
          <Text key={`tip-${index}`} style={styles.tipText}>
            • {tip}
          </Text>
        ))}
      </View>
    );
  };

  const renderEntryPackButton = () => {
    if (!currentStep.showEntryPack) {
      return null;
    }

    const handleOpenEntryPack = () => {
      const userData = route?.params?.userData;
      const passport = route?.params?.passport;
      const destination = route?.params?.destination;

      // Get entry pack preview screen name from config or route params
      const entryPackPreviewScreen =
        config?.screens?.entryPackPreview ||
        route?.params?.entryPackPreviewScreen ||
        'USAEntryPackPreview';

      navigation?.navigate(entryPackPreviewScreen, {
        userData: userData || {},
        passport,
        destination,
        entryPackData: {
          personalInfo: userData?.personalInfo || {},
          travelInfo: userData?.travel || {},
          funds: userData?.funds || [],
        },
      });
    };

    const buttonTitle = t('entryGuide.entryPack.openButton', { 
      defaultValue: isChinese ? '打开通关包 📋' : 'Open Entry Pack 📋' 
    });

    return (
      <View style={styles.entryPackButtonContainer}>
        <Button
          title={buttonTitle}
          onPress={handleOpenEntryPack}
          size="medium"
          variant="primary"
          style={styles.entryPackButton}
        />
        {currentStep.entryPackHint ? (
          <Text style={styles.entryPackButtonHint}>
            {currentStep.entryPackHint}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.currentStepContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.stepCategoryBadge}>
          <Text style={styles.stepCategoryText}>{category}</Text>
        </View>
        <Text style={styles.stepProgress}>
          {currentStepIndex + 1} / {steps.length}
        </Text>
      </View>

      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>

      <View style={styles.stepMeta}>
        {currentStep.estimatedTime ? (
          <Text style={styles.stepTime}>⏱️ {currentStep.estimatedTime}</Text>
        ) : null}
        <Text
          style={[
            styles.stepRequired,
            currentStep.required
              ? styles.stepRequiredYes
              : styles.stepRequiredNo,
          ]}
        >
          {currentStep.required
            ? t('entryGuide.step.requiredLabel', { defaultValue: isChinese ? '必做步骤' : 'Mandatory Step' })
            : t('entryGuide.step.optionalLabel', { defaultValue: isChinese ? '可选步骤' : 'Optional Step' })}
        </Text>
      </View>

      {currentStep.entryPackHint ? (
        <View style={styles.entryPackHint}>
          <Text style={styles.entryPackHintText}>
            {currentStep.entryPackHint}
          </Text>
        </View>
      ) : null}

      {renderEntryPackButton()}

      {renderMedia()}
      {renderWarnings()}
      {renderFormFields()}
      {renderTips()}
    </View>
  );
};

const EntryGuideTemplateNavigation = () => {
  const {
    currentStepIndex,
    steps,
    handlePrevStep,
    handleNextStep,
    handleCompleteGuide,
    isChinese,
    config,
    t,
  } = useEntryGuideTemplate();

  if (!steps.length) {
    return null;
  }

  const canGoPrev = currentStepIndex > 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const canGoNext = !isLastStep;

  const navigationLabels = config?.labels?.navigation || {};

  const prevLabel = resolveLabel(
    {
      zh: navigationLabels.previousZh,
      en: navigationLabels.previousEn,
      default: navigationLabels.previous,
    },
    isChinese,
    t('entryGuide.navigation.previous', { defaultValue: '← 上一步' }),
    t('entryGuide.navigation.previous', { defaultValue: '← Previous' })
  );

  const nextLabel = resolveLabel(
    {
      zh: navigationLabels.nextZh,
      en: navigationLabels.nextEn,
      default: navigationLabels.next,
    },
    isChinese,
    t('entryGuide.navigation.next', { defaultValue: '下一步 →' }),
    t('entryGuide.navigation.next', { defaultValue: 'Next →' })
  );

  const completeLabel = resolveLabel(
    {
      zh: navigationLabels.completeZh,
      en: navigationLabels.completeEn,
      default: navigationLabels.complete,
    },
    isChinese,
    t('entryGuide.navigation.complete', { defaultValue: '完成指引 ✅' }),
    t('entryGuide.navigation.complete', { defaultValue: 'Guide Completed ✅' })
  );

  return (
    <View style={styles.navigationContainer}>
      <TouchableOpacity
        style={[styles.navButton, !canGoPrev && styles.navButtonDisabled]}
        onPress={handlePrevStep}
        disabled={!canGoPrev}
      >
        <Text
          style={[
            styles.navButtonText,
            !canGoPrev && styles.navButtonTextDisabled,
          ]}
        >
          {prevLabel}
        </Text>
      </TouchableOpacity>

      {canGoNext ? (
        <TouchableOpacity style={styles.navButton} onPress={handleNextStep}>
          <Text style={styles.navButtonText}>{nextLabel}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleCompleteGuide}
        >
          <Text style={styles.completeButtonText}>{completeLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const EntryGuideTemplateAutoContent = () => {
  const { steps } = useEntryGuideTemplate();

  if (!steps.length) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateTitle}>No entry guide data</Text>
        <Text style={styles.emptyStateSubtitle}>
          Provide steps in the configuration to render the guide.
        </Text>
      </View>
    );
  }

  return (
    <>
      <EntryGuideTemplateProgressBar />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <EntryGuideTemplateStepIndicator />
        <EntryGuideTemplateCurrentStep />
        <View style={styles.scrollContentSpacing} />
      </ScrollView>
      <EntryGuideTemplateNavigation />
    </>
  );
};

EntryGuideTemplate.Header = EntryGuideTemplateHeader;
EntryGuideTemplate.ProgressBar = EntryGuideTemplateProgressBar;
EntryGuideTemplate.StepIndicator = EntryGuideTemplateStepIndicator;
EntryGuideTemplate.CurrentStep = EntryGuideTemplateCurrentStep;
EntryGuideTemplate.Navigation = EntryGuideTemplateNavigation;
EntryGuideTemplate.AutoContent = EntryGuideTemplateAutoContent;

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
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  stepIndicatorScroll: {
    paddingHorizontal: spacing.md,
  },
  stepIndicatorContent: {
    flexGrow: 1,
    gap: spacing.sm,
  },
  stepIndicatorItem: {
    width: 120,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  stepIndicatorCompleted: {
    backgroundColor: '#E6F7EA',
    borderColor: '#0BD67B',
  },
  stepIndicatorCurrent: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  stepIndicatorPending: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  stepIndicatorIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  stepIndicatorIconCompleted: {
    color: '#0B7A4B',
  },
  stepIndicatorIconCurrent: {
    color: '#1976D2',
  },
  stepIndicatorIconPending: {
    color: colors.textSecondary,
  },
  stepIndicatorText: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepIndicatorTextCompleted: {
    color: '#0B7A4B',
  },
  stepIndicatorTextCurrent: {
    color: '#1976D2',
  },
  stepIndicatorTextPending: {
    color: colors.textSecondary,
  },
  currentStepContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepCategoryBadge: {
    backgroundColor: '#FFF5E6',
    borderRadius: 12,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  stepCategoryText: {
    ...typography.caption,
    color: '#FF8A00',
    fontWeight: '600',
  },
  stepProgress: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stepTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  stepDescription: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  stepTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stepRequired: {
    ...typography.caption,
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    fontWeight: '600',
  },
  stepRequiredYes: {
    backgroundColor: '#FFE2E2',
    color: '#D32F2F',
  },
  stepRequiredNo: {
    backgroundColor: '#E6F7EA',
    color: '#0B7A4B',
  },
  mediaContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  mediaImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#F5F5F5',
  },
  mediaCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    padding: spacing.sm,
    textAlign: 'center',
  },
  warningsContainer: {
    marginBottom: spacing.md,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FFC1C1',
  },
  warningsTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: spacing.xs,
  },
  warningText: {
    ...typography.body2,
    color: '#B71C1C',
    marginBottom: spacing.xs,
  },
  formFieldsContainer: {
    marginBottom: spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  formFieldsTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  formFieldRow: {
    marginBottom: spacing.sm,
  },
  formFieldLabel: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  formFieldGuidance: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tipsContainer: {
    backgroundColor: '#EEF7FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    padding: spacing.md,
  },
  tipsTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: spacing.xs,
  },
  tipText: {
    ...typography.body2,
    color: '#0D47A1',
    marginBottom: spacing.xs,
  },
  entryPackHint: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#D1C4E9',
    marginBottom: spacing.md,
  },
  entryPackHintText: {
    ...typography.body2,
    color: '#512DA8',
    lineHeight: 18,
  },
  entryPackButtonContainer: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  entryPackButton: {
    marginBottom: spacing.sm,
  },
  entryPackButtonHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 16,
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
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: colors.background,
  },
  navButtonText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.primary,
  },
  navButtonTextDisabled: {
    color: colors.textSecondary,
  },
  completeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: '#0BD67B',
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  completeButtonText: {
    ...typography.body2,
    fontWeight: '700',
    color: colors.white,
  },
  scrollContentSpacing: {
    height: spacing.xl,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyStateSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EntryGuideTemplate;
