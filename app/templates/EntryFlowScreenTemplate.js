/**
 * EntryFlowScreenTemplate
 *
 * Reusable template for country-specific entry preparation status screens.
 * Shows completion progress, missing fields, and submission readiness.
 *
 * Extracts common patterns from ThailandEntryFlowScreen (1196 lines → ~200 lines per country).
 *
 * Usage:
 *   <EntryFlowScreenTemplate config={vietnamEntryFlowConfig}>
 *     <EntryFlowScreenTemplate.StatusBanner />
 *     <EntryFlowScreenTemplate.CompletionCard />
 *     <EntryFlowScreenTemplate.Categories />
 *     <EntryFlowScreenTemplate.ActionButtons />
 *   </EntryFlowScreenTemplate>
 *
 * @example
 * // Vietnam implementation (< 150 lines)
 * import { EntryFlowScreenTemplate } from '../../templates';
 * import { vietnamEntryFlowConfig } from '../../config/destinations/vietnam';
 *
 * const VietnamEntryFlowScreen = ({ route, navigation }) => (
 *   <EntryFlowScreenTemplate
 *     config={vietnamEntryFlowConfig}
 *     route={route}
 *     navigation={navigation}
 *   >
 *     <EntryFlowScreenTemplate.Header />
 *     <EntryFlowScreenTemplate.StatusBanner />
 *     <EntryFlowScreenTemplate.ScrollContainer>
 *       <EntryFlowScreenTemplate.CompletionCard />
 *       <EntryFlowScreenTemplate.Categories />
 *       <EntryFlowScreenTemplate.SubmissionCountdown />
 *       <EntryFlowScreenTemplate.ActionButtons />
 *     </EntryFlowScreenTemplate.ScrollContainer>
 *   </EntryFlowScreenTemplate>
 * );
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import BackButton from '../components/BackButton';
import { useLocale } from '../i18n/LocaleContext';
import UserDataService from '../services/data/UserDataService';
import EntryCompletionCalculator from '../utils/EntryCompletionCalculator';
import {
  YStack,
  XStack,
  BaseCard,
  BaseButton,
  Text as TamaguiText,
} from '../components/tamagui';

// Template Context
const EntryFlowTemplateContext = createContext(null);

const useEntryFlowTemplate = () => {
  const context = useContext(EntryFlowTemplateContext);
  if (!context) {
    throw new Error('useEntryFlowTemplate must be used within EntryFlowScreenTemplate');
  }
  return context;
};

/**
 * Main Template Component
 */
const EntryFlowScreenTemplate = ({
  children,
  config,
  route,
  navigation,
  // Optional custom data loader
  useDataLoaderHook,
}) => {
  const { t } = useLocale();
  const passportParam = route.params?.passport;
  const destination = route.params?.destination;
  const passport = useMemo(() => UserDataService.toSerializablePassport(passportParam), [passportParam?.id]);
  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [completionStatus, setCompletionStatus] = useState('incomplete');
  const [categories, setCategories] = useState([]);
  const [userData, setUserData] = useState(null);
  const [arrivalDate, setArrivalDate] = useState(null);

  // Load data function
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Initialize UserDataService
      await UserDataService.initialize(userId);

      // Load all user data
      const allUserData = await UserDataService.getAllUserData(userId);
      const fundItems = await UserDataService.getFundItems(userId);
      const destinationId = destination?.id || config.destinationId;
      const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

      // Prepare entry info for completion calculation
      const entryInfo = {
        passport: allUserData?.passport || {},
        personalInfo: allUserData?.personalInfo || {},
        funds: fundItems || [],
        travel: travelInfo || {},
        lastUpdatedAt: new Date().toISOString(),
      };

      setUserData(entryInfo);

      // Extract arrival date
      const arrivalDateFromTravel = travelInfo?.arrivalArrivalDate || travelInfo?.arrivalDate;
      setArrivalDate(arrivalDateFromTravel);

      // Calculate completion using EntryCompletionCalculator
      const completionSummary = EntryCompletionCalculator.getCompletionSummary(entryInfo);

      // Update completion state
      setCompletionPercent(completionSummary.totalPercent);

      if (completionSummary.totalPercent === 100) {
        setCompletionStatus('ready');
      } else if (completionSummary.totalPercent >= 50) {
        setCompletionStatus('mostly_complete');
      } else {
        setCompletionStatus('needs_improvement');
      }

      // Create category data
      const categoryData = [
        {
          id: 'passport',
          name: t('progressiveEntryFlow.categories.passport', { defaultValue: 'Passport Information' }),
          icon: '📘',
          status: completionSummary.categorySummary.passport.state,
          completedCount: completionSummary.categorySummary.passport.completed,
          totalCount: completionSummary.categorySummary.passport.total,
          missingFields: completionSummary.missingFields.passport || [],
        },
        {
          id: 'personal',
          name: t('progressiveEntryFlow.categories.personal', { defaultValue: 'Personal Information' }),
          icon: '👤',
          status: completionSummary.categorySummary.personalInfo.state,
          completedCount: completionSummary.categorySummary.personalInfo.completed,
          totalCount: completionSummary.categorySummary.personalInfo.total,
          missingFields: completionSummary.missingFields.personalInfo || [],
        },
        {
          id: 'funds',
          name: t('progressiveEntryFlow.categories.funds', { defaultValue: 'Proof of Funds' }),
          icon: '💰',
          status: completionSummary.categorySummary.funds.state,
          completedCount: completionSummary.categorySummary.funds.validFunds,
          totalCount: 1,
          missingFields: completionSummary.missingFields.funds || [],
        },
        {
          id: 'travel',
          name: t('progressiveEntryFlow.categories.travel', { defaultValue: 'Travel Information' }),
          icon: '✈️',
          status: completionSummary.categorySummary.travel.state,
          completedCount: completionSummary.categorySummary.travel.completed,
          totalCount: completionSummary.categorySummary.travel.total,
          missingFields: completionSummary.missingFields.travel || [],
        },
      ];

      setCategories(categoryData);
    } catch (error) {
      console.error('Failed to load entry flow data:', error);
      Alert.alert('Error', 'Failed to load entry preparation status. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [userId, destination, config, t]);

  // Load data on mount and when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Context value
  const contextValue = {
    // Config
    config,
    t,

    // Navigation
    navigation,
    route,
    passport,
    destination,
    userId,

    // State
    isLoading,
    refreshing,
    completionPercent,
    completionStatus,
    categories,
    userData,
    arrivalDate,

    // Actions
    loadData,
    onRefresh,
  };

  return (
    <EntryFlowTemplateContext.Provider value={contextValue}>
      <SafeAreaView style={{ flex: 1, backgroundColor: config.colors?.background || '#F9FAFB' }}>
        {children}
      </SafeAreaView>
    </EntryFlowTemplateContext.Provider>
  );
};

/**
 * Header Component
 */
EntryFlowScreenTemplate.Header = ({ title, titleKey, onBackPress, rightComponent }) => {
  const { t, navigation, config } = useEntryFlowTemplate();

  const headerTitle = title || t(
    titleKey || `${config.destinationId}.entryFlow.title`,
    { defaultValue: `${config.name} Entry Preparation` }
  );

  return (
    <XStack
      paddingHorizontal="$md"
      paddingVertical="$sm"
      alignItems="center"
      justifyContent="space-between"
      backgroundColor="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
    >
      <BackButton
        onPress={onBackPress || (() => navigation.goBack())}
        label={t('common.back', { defaultValue: 'Back' })}
      />
      <TamaguiText fontSize="$5" fontWeight="600" color="$textPrimary" flex={1} textAlign="center">
        {headerTitle}
      </TamaguiText>
      {rightComponent || <YStack width={60} />}
    </XStack>
  );
};

/**
 * Status Banner Component
 */
EntryFlowScreenTemplate.StatusBanner = () => {
  const { completionStatus, completionPercent, t, config } = useEntryFlowTemplate();

  const statusConfig = {
    ready: {
      color: '#E6F9E6',
      icon: '✅',
      title: t('entryFlow.status.ready.title', { defaultValue: 'Ready to Submit!' }),
      subtitle: t('entryFlow.status.ready.subtitle', { defaultValue: 'All information complete' }),
    },
    mostly_complete: {
      color: '#FFF9E6',
      icon: '⏳',
      title: t('entryFlow.status.mostlyComplete.title', { defaultValue: 'Almost There' }),
      subtitle: t('entryFlow.status.mostlyComplete.subtitle', { defaultValue: `${completionPercent}% complete` }),
    },
    needs_improvement: {
      color: '#FFE6E6',
      icon: '📝',
      title: t('entryFlow.status.needsImprovement.title', { defaultValue: 'Please Complete' }),
      subtitle: t('entryFlow.status.needsImprovement.subtitle', { defaultValue: 'More information needed' }),
    },
  };

  const status = statusConfig[completionStatus] || statusConfig.needs_improvement;

  return (
    <YStack paddingHorizontal="$md" paddingTop="$md">
      <BaseCard variant="flat" backgroundColor={status.color} padding="md">
        <XStack gap="$md" alignItems="center">
          <TamaguiText fontSize={40}>{status.icon}</TamaguiText>
          <YStack flex={1}>
            <TamaguiText fontSize="$5" fontWeight="bold" color="$text">
              {status.title}
            </TamaguiText>
            <TamaguiText fontSize="$3" color="$textSecondary">
              {status.subtitle}
            </TamaguiText>
          </YStack>
        </XStack>
      </BaseCard>
    </YStack>
  );
};

/**
 * Scrollable Content Container
 */
EntryFlowScreenTemplate.ScrollContainer = ({ children }) => {
  const { refreshing, onRefresh } = useEntryFlowTemplate();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {children}
    </ScrollView>
  );
};

/**
 * Completion Card Component
 */
EntryFlowScreenTemplate.CompletionCard = () => {
  const { completionPercent, categories, t } = useEntryFlowTemplate();

  const completedCategories = categories.filter((c) => c.status === 'completed').length;
  const totalCategories = categories.length;

  return (
    <YStack paddingHorizontal="$md" marginBottom="$md">
      <BaseCard variant="elevated" padding="lg">
        <TamaguiText fontSize="$5" fontWeight="bold" marginBottom="$md">
          {t('entryFlow.completionCard.title', { defaultValue: 'Completion Progress' })}
        </TamaguiText>

        {/* Progress Bar */}
        <YStack marginBottom="$md">
          <YStack
            height={8}
            backgroundColor="$gray200"
            borderRadius={4}
            overflow="hidden"
          >
            <YStack
              height="100%"
              width={`${completionPercent}%`}
              backgroundColor="$primary"
            />
          </YStack>
          <TamaguiText fontSize="$6" fontWeight="bold" color="$primary" marginTop="$sm">
            {completionPercent}%
          </TamaguiText>
        </YStack>

        {/* Category Summary */}
        <TamaguiText fontSize="$3" color="$textSecondary">
          {t('entryFlow.completionCard.summary', {
            defaultValue: `${completedCategories} of ${totalCategories} sections complete`,
            completedCategories,
            totalCategories,
          })}
        </TamaguiText>
      </BaseCard>
    </YStack>
  );
};

/**
 * Categories Component
 */
EntryFlowScreenTemplate.Categories = () => {
  const { categories, navigation, route, t } = useEntryFlowTemplate();

  const handleCategoryPress = (category) => {
    // Navigate to travel info screen to edit
    navigation.navigate('VietnamTravelInfo', route.params);
  };

  return (
    <YStack paddingHorizontal="$md" gap="$md">
      <TamaguiText fontSize="$5" fontWeight="bold">
        {t('entryFlow.categories.title', { defaultValue: 'Information Categories' })}
      </TamaguiText>

      {categories.map((category) => (
        <BaseCard
          key={category.id}
          variant="elevated"
          padding="md"
          onPress={() => handleCategoryPress(category)}
          cursor="pointer"
        >
          <XStack alignItems="center" gap="$md">
            <TamaguiText fontSize={32}>{category.icon}</TamaguiText>
            <YStack flex={1}>
              <TamaguiText fontSize="$4" fontWeight="600">
                {category.name}
              </TamaguiText>
              <TamaguiText fontSize="$2" color="$textSecondary">
                {category.completedCount}/{category.totalCount} {t('entryFlow.categories.fieldsComplete', { defaultValue: 'fields complete' })}
              </TamaguiText>
              {category.missingFields.length > 0 && (
                <TamaguiText fontSize="$2" color="$warning" marginTop="$xs">
                  {t('entryFlow.categories.missingFields', {
                    defaultValue: 'Missing: {{fields}}',
                    fields: category.missingFields.slice(0, 3).join(', '),
                  })}
                </TamaguiText>
              )}
            </YStack>
            <YStack
              width={20}
              height={20}
              borderRadius={10}
              backgroundColor={category.status === 'completed' ? '$success' : '$gray300'}
              alignItems="center"
              justifyContent="center"
            >
              {category.status === 'completed' && (
                <TamaguiText color="$white" fontSize={12}>✓</TamaguiText>
              )}
            </YStack>
          </XStack>
        </BaseCard>
      ))}
    </YStack>
  );
};

/**
 * Submission Countdown Component (optional - for countries with submission windows)
 */
EntryFlowScreenTemplate.SubmissionCountdown = () => {
  const { config, arrivalDate, t } = useEntryFlowTemplate();

  // Only show if country has submission window
  if (!config.submission?.hasWindow || !arrivalDate) {
    return null;
  }

  // Calculate days until arrival
  const arrival = new Date(arrivalDate);
  const now = new Date();
  const daysUntilArrival = Math.ceil((arrival - now) / (1000 * 60 * 60 * 24));

  if (daysUntilArrival < 0) {
    return null; // Already arrived
  }

  return (
    <YStack paddingHorizontal="$md" marginTop="$md">
      <BaseCard variant="flat" backgroundColor="#E6F2FF" padding="md">
        <XStack alignItems="center" gap="$md">
          <TamaguiText fontSize={32}>⏰</TamaguiText>
          <YStack flex={1}>
            <TamaguiText fontSize="$4" fontWeight="600">
              {t('entryFlow.countdown.title', { defaultValue: 'Submission Window' })}
            </TamaguiText>
            <TamaguiText fontSize="$2" color="$textSecondary">
              {t('entryFlow.countdown.days', {
                defaultValue: `${daysUntilArrival} days until arrival`,
                days: daysUntilArrival,
              })}
            </TamaguiText>
          </YStack>
        </XStack>
      </BaseCard>
    </YStack>
  );
};

/**
 * Action Buttons Component
 */
EntryFlowScreenTemplate.ActionButtons = () => {
  const { navigation, route, completionPercent, t, config } = useEntryFlowTemplate();

  const handleContinueEditing = () => {
    const travelInfoScreen = config.screens?.travelInfo || 'VietnamTravelInfo';
    navigation.navigate(travelInfoScreen, route.params);
  };

  const handleSubmit = () => {
    if (completionPercent < (config.completion?.minPercent || 80)) {
      Alert.alert(
        t('entryFlow.actions.incomplete.title', { defaultValue: 'Incomplete Information' }),
        t('entryFlow.actions.incomplete.message', {
          defaultValue: 'Please complete at least 80% of the information before submitting.',
        })
      );
      return;
    }

    // Navigate to submission screen if exists
    if (config.screens?.submit) {
      navigation.navigate(config.screens.submit, route.params);
    } else {
      Alert.alert(
        t('entryFlow.actions.success.title', { defaultValue: 'Ready!' }),
        t('entryFlow.actions.success.message', {
          defaultValue: 'Your information is complete and ready for entry.',
        })
      );
    }
  };

  return (
    <YStack paddingHorizontal="$md" marginTop="$lg" gap="$md">
      <BaseButton
        variant="primary"
        size="lg"
        onPress={handleSubmit}
        fullWidth
        disabled={completionPercent < (config.completion?.minPercent || 80)}
      >
        {completionPercent >= 100
          ? t('entryFlow.actions.submit', { defaultValue: 'Submit Entry Card' })
          : t('entryFlow.actions.continue', { defaultValue: 'Continue Editing' })
        }
      </BaseButton>

      <BaseButton
        variant="outline"
        size="lg"
        onPress={handleContinueEditing}
        fullWidth
      >
        {t('entryFlow.actions.edit', { defaultValue: 'Edit Information' })}
      </BaseButton>
    </YStack>
  );
};

/**
 * Loading Indicator Component
 */
EntryFlowScreenTemplate.LoadingIndicator = ({ message }) => {
  const { t, isLoading } = useEntryFlowTemplate();

  if (!isLoading) return null;

  return (
    <YStack padding="$md" alignItems="center">
      <TamaguiText fontSize="$3" color="$textSecondary">
        {message || t('common.loading', { defaultValue: 'Loading...' })}
      </TamaguiText>
    </YStack>
  );
};

// Export hook for advanced usage
EntryFlowScreenTemplate.useTemplate = useEntryFlowTemplate;

export default EntryFlowScreenTemplate;
