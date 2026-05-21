/**
 * EntryFlowScreenTemplate
 *
 * Reusable template for country-specific entry preparation status screens.
 * Config-driven via EntryFlowConfig. Shows completion progress,
 * missing fields, and submission readiness.
 */

import { EntryFlowConfig } from '../config/destinations/types';
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import BackButton from '../components/BackButton';
import { useLocale } from '../i18n/LocaleContext';
import UserDataService from '../services/data/UserDataService';
import EntryCompletionCalculator from '../utils/EntryCompletionCalculator';
import { getDefaultArrivalDate } from '../utils/defaultTravelDates';
import LoggingService from '../services/LoggingService';
import { LinearGradient } from 'expo-linear-gradient';
import {
  YStack,
  XStack,
  BaseCard,
  BaseButton,
  Text as TamaguiText,
} from '../components/tamagui';

const mapDestinationId = (id: string): string => {
  if (id === 'us') {
return 'usa';
}
  if (id === 'malaysia') {
return 'my';
}
  if (id === 'singapore') {
return 'sg';
}
  if (id === 'hongkong') {
return 'hk';
}
  if (id === 'japan') {
return 'jp';
}
  if (id === 'korea') {
return 'kr';
}
  if (id === 'taiwan') {
return 'tw';
}
  return id;
};

// Context value type
interface EntryFlowTemplateContextValue {
  config: EntryFlowConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, options?: any) => any;
  navigation: { goBack: () => void; navigate: (screen: string, params?: unknown) => void } | null;
  route: { params?: Record<string, unknown> } | null;
  passport: Record<string, unknown> | null;
  destination: Record<string, unknown> | null;
  userId: string | null;
  isLoading: boolean;
  refreshing: boolean;
  completionPercent: number;
  completionStatus: string;
  categories: Array<Record<string, unknown>>;
  userData: Record<string, unknown> | null;
  arrivalDate: string | null;
  loadData: () => void;
  onRefresh: () => void;
}

// Provide a resilient default context so dependent components don't crash
const defaultEntryFlowContextValue: EntryFlowTemplateContextValue = {
  config: {} as EntryFlowConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, options: any = {}) => options?.defaultValue ?? key,
  navigation: {
    goBack: () => {},
    navigate: () => {},
  },
  route: null,
  passport: null,
  destination: null,
  userId: null,
  isLoading: true,
  refreshing: false,
  completionPercent: 0,
  completionStatus: 'needs_improvement',
  categories: [],
  userData: null,
  arrivalDate: null,
  loadData: () => {},
  onRefresh: () => {},
};

// Template Context
const EntryFlowTemplateContext = createContext<EntryFlowTemplateContextValue>(defaultEntryFlowContextValue);

const useEntryFlowTemplate = () => {
  const context = useContext<EntryFlowTemplateContextValue>(EntryFlowTemplateContext);
  if (!context) {
    if (__DEV__) {
      LoggingService.warn('EntryFlowScreenTemplate', 'useEntryFlowTemplate accessed outside provider. Returning default context to prevent crash.'
      );
    }
    return defaultEntryFlowContextValue;
  }
  return context;
};

/**
 * Main Template Component
 */
interface EntryFlowScreenTemplateProps {
  children?: React.ReactNode;
  config: EntryFlowConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  useDataLoaderHook?: never;
}

const EntryFlowScreenTemplate = ({
  children,
  config,
  route,
  navigation,
  useDataLoaderHook,
}: EntryFlowScreenTemplateProps) => {
  // Get translation function early - needed for context value
  const { t } = useLocale();

  // Hooks must be called unconditionally (before any early returns)
  const routeParams = route?.params;
  const routeUserId = routeParams?.userId;
  const routeEntryInfo = routeParams?.entryInfo;
  const routeTravelInfo = routeParams?.travelInfo;
  const routePersonalInfo = routeParams?.personalInfo;
  const routeUser = routeParams?.user;
  const routeUserData = routeParams?.userData;
  const passportParam = routeParams?.passport;
  const destination = routeParams?.destination;
  const passport = useMemo(
    () => (passportParam ? UserDataService.toSerializablePassport(passportParam) : null),
    [passportParam?.id],
  );
  const userId = useMemo(() => {
    const candidateIds = [
      typeof routeUserId === 'string' ? routeUserId : null,
      typeof routeUserData?.userId === 'string' ? routeUserData.userId : null,
      typeof routeUser?.id === 'string' ? routeUser.id : null,
      typeof routeUser?.userId === 'string' ? routeUser.userId : null,
      typeof routeEntryInfo?.userId === 'string' ? routeEntryInfo.userId : null,
      typeof routeEntryInfo?.user_id === 'string' ? routeEntryInfo.user_id : null,
      typeof routeTravelInfo?.userId === 'string' ? routeTravelInfo.userId : null,
      typeof routePersonalInfo?.userId === 'string' ? routePersonalInfo.userId : null,
      typeof passport?.userId === 'string' ? passport.userId : null,
      typeof passport?.id === 'string' ? passport.id : null,
      typeof passportParam?.userId === 'string' ? passportParam.userId : null,
      typeof passportParam?.id === 'string' ? passportParam.id : null,
    ];

    const resolvedId =
      candidateIds.find((value) => value && value.trim().length > 0) || 'user_001';

    if (__DEV__ && (!resolvedId || resolvedId === 'user_001')) {
      LoggingService.debug('EntryFlowScreenTemplate', 'userId fallback applied', { resolvedId,
        routeUserId,
        routeUserDataUserId: routeUserData?.userId,
        routeUserIdField: routeUser?.id,
        routeUserUserId: routeUser?.userId,
        entryInfoUserId: routeEntryInfo?.userId ?? routeEntryInfo?.user_id,
        travelInfoUserId: routeTravelInfo?.userId,
        personalInfoUserId: routePersonalInfo?.userId,
        passportId: passport?.id,
        passportUserId: passport?.userId,
        passportParamId: passportParam?.id,
        passportParamUserId: passportParam?.userId,
      });
    }

    return resolvedId;
  }, [
    routeUserId,
    routeUserData?.userId,
    routeUser?.id,
    routeUser?.userId,
    routeEntryInfo?.userId,
    routeEntryInfo?.user_id,
    routeTravelInfo?.userId,
    routePersonalInfo?.userId,
    passport?.id,
    passport?.userId,
    passportParam?.id,
    passportParam?.userId,
  ]);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [completionStatus, setCompletionStatus] = useState('incomplete');
  const [categories, setCategories] = useState([]);
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [arrivalDate, setArrivalDate] = useState(null);

  // Load data function
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      await UserDataService.initialize(userId);

      const allUserData = await UserDataService.getAllUserData(userId);
      const fundItems = await UserDataService.getFundItems(userId);
      const destinationId = destination?.id || config?.destinationId;
      const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

      const entryInfo = {
        passport: allUserData?.passport || {},
        personalInfo: allUserData?.personalInfo || {},
        funds: fundItems || [],
        travel: travelInfo || {},
        lastUpdatedAt: new Date().toISOString(),
      };

      setUserData(entryInfo);

      const arrivalDateFromTravel = travelInfo?.arrivalArrivalDate || travelInfo?.arrivalDate;
      const resolvedArrivalDate = arrivalDateFromTravel || getDefaultArrivalDate();
      setArrivalDate(resolvedArrivalDate);

      const completionSummary = EntryCompletionCalculator.getCompletionSummary(entryInfo);

      setCompletionPercent(completionSummary.totalPercent);

      if (completionSummary.totalPercent === 100) {
        setCompletionStatus('ready');
      } else if (completionSummary.totalPercent >= 50) {
        setCompletionStatus('mostly_complete');
      } else {
        setCompletionStatus('needs_improvement');
      }

      if (config?.categories) {
        const categoryData = config.categories.map((category: any) => {
          const summaryKey: string = category.id === 'personal' ? 'personalInfo' : category.id;
          const summary = (completionSummary.categorySummary as any)[summaryKey];
          if (!summary) {
            return null;
          }

          return {
            id: category.id,
            name: t(category.nameKey, { defaultValue: category.name }),
            icon: category.icon,
            status: summary.state,
            completedCount: summary.completed || summary.validFunds || 0,
            totalCount: summary.total || 1,
            missingFields: (completionSummary.missingFields as any)[summaryKey] || [],
          };
        }).filter(Boolean);

        setCategories(categoryData);
      }
    } catch (error) {
      LoggingService.error('EntryFlowScreenTemplate', 'Failed to load entry flow data', { error });
      Alert.alert('Error', 'Failed to load entry preparation status. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [userId, destination, config, t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const contextValue = useMemo(
    () => ({
      config,
      t,
      navigation,
      route,
      passport,
      destination,
      userId,
      isLoading,
      refreshing,
      completionPercent,
      completionStatus,
      categories,
      userData,
      arrivalDate,
      loadData,
      onRefresh,
    }),
    [
      config, t, navigation, route, passport, destination, userId,
      isLoading, refreshing, completionPercent, completionStatus,
      categories, userData, arrivalDate, loadData, onRefresh,
    ],
  );

  // Validate required props AFTER hooks — render fallback UI when missing
  if (!config) {
    LoggingService.error('EntryFlowScreenTemplate', 'config is required');
    return (
      <EntryFlowTemplateContext.Provider value={{ ...defaultEntryFlowContextValue, t, navigation: null, route: null }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          {children}
        </SafeAreaView>
      </EntryFlowTemplateContext.Provider>
    );
  }

  if (!route) {
    LoggingService.error('EntryFlowScreenTemplate', 'route is required');
    return (
      <EntryFlowTemplateContext.Provider value={{ ...defaultEntryFlowContextValue, config, t, navigation: null, route: null }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: config.colors?.background || '#F9FAFB' }}>
          {children}
        </SafeAreaView>
      </EntryFlowTemplateContext.Provider>
    );
  }

  if (!navigation) {
    LoggingService.error('EntryFlowScreenTemplate', 'navigation is required');
    return (
      <EntryFlowTemplateContext.Provider value={{ ...defaultEntryFlowContextValue, config, t, navigation: null, route }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: config.colors?.background || '#F9FAFB' }}>
          {children}
        </SafeAreaView>
      </EntryFlowTemplateContext.Provider>
    );
  }

  return (
    <EntryFlowTemplateContext.Provider value={contextValue}>
      <SafeAreaView style={{ flex: 1, backgroundColor: config.colors?.background || '#F9FAFB' }}>
        {children}
      </SafeAreaView>
    </EntryFlowTemplateContext.Provider>
  );
};

/* eslint-disable react/prop-types, react/display-name, react-hooks/rules-of-hooks */
/**
 * Header Component
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
EntryFlowScreenTemplate.Header = ({ title, titleKey, onBackPress, rightComponent }: any) => {
  const { t, navigation, config } = useEntryFlowTemplate();

  const translationKey =
    titleKey ||
    config.entryFlow?.titleKey ||
    (config.destinationId ? `${config.destinationId}.entryFlow.title` : null);

  const fallbackDestinationName =
    config?.name ||
    config?.nameEn ||
    config?.nameZh ||
    (config?.destinationId ? config.destinationId.toUpperCase() : '');

  const fallbackTitle = fallbackDestinationName
    ? `${fallbackDestinationName} Entry Preparation`
    : 'Entry Preparation';

  const headerTitle =
    title ||
    (translationKey
      ? t(translationKey, { defaultValue: fallbackTitle })
      : fallbackTitle);

  return (
    <XStack
      paddingHorizontal="$md"
      paddingVertical="$sm"
      alignItems="center"
      justifyContent="space-between"
      backgroundColor="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      zIndex={10}
      elevation={10}
    >
      <BackButton
        onPress={onBackPress || (() => navigation?.goBack())}
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
  
  // Map 'us' to 'usa' for translation keys
  const rawDestinationId = config.destinationId || 'japan';
  const destinationId = mapDestinationId(rawDestinationId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = config.status as any;

  const statusConfig = {
    ready: {
      color: '#E6F9E6',
      icon: '✅',
      title: t(
        s?.ready?.titleKey || `${destinationId}.entryFlow.status.ready.title`,
        {
          defaultValue: s?.ready?.defaultTitle || 'Ready to Submit!'
        }
      ),
      subtitle: t(
        s?.ready?.subtitleKey || `${destinationId}.entryFlow.status.ready.subtitle`,
        {
          defaultValue: s?.ready?.defaultSubtitle || 'All information complete'
        }
      ),
    },
    mostly_complete: {
      color: '#FFF9E6',
      icon: '⏳',
      title: t(
        s?.mostly_complete?.titleKey || `${destinationId}.entryFlow.status.mostlyComplete.title`,
        {
          defaultValue: s?.mostly_complete?.defaultTitle || 'Almost There'
        }
      ),
      subtitle: t(
        s?.mostly_complete?.subtitleKey || `${destinationId}.entryFlow.status.mostlyComplete.subtitle`,
        {
          defaultValue: s?.mostly_complete?.defaultSubtitle || `${completionPercent}% complete`,
          percent: completionPercent
        }
      ),
    },
    needs_improvement: {
      color: '#FFE6E6',
      icon: '📝',
      title: t(
        s?.needs_improvement?.titleKey || `${destinationId}.entryFlow.status.needsImprovement.title`,
        {
          defaultValue: s?.needs_improvement?.defaultTitle || 'Please Complete'
        }
      ),
      subtitle: t(
        s?.needs_improvement?.subtitleKey || `${destinationId}.entryFlow.status.needsImprovement.subtitle`,
        {
          defaultValue: s?.needs_improvement?.defaultSubtitle || 'More information needed'
        }
      ),
    },
  };

  const status = (statusConfig as any)[completionStatus] || statusConfig.needs_improvement;

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
EntryFlowScreenTemplate.ScrollContainer = ({ children }: any) => {
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
 * Auto Content - Thai-style layout (progress hero, countdown, actions)
 */
EntryFlowScreenTemplate.AutoContent = () => {
  const {
    isLoading,
    completionPercent,
    completionStatus,
    t,
    navigation,
    route,
    config,
    arrivalDate,
    userData,
  } = useEntryFlowTemplate();

  // Get destination name from translation system based on locale
  // Map 'us' to 'usa' for translation keys
  const rawDestinationId = config.destinationId || 'japan';
  const destinationId = mapDestinationId(rawDestinationId);
  const destinationNameKey = `${destinationId}.name`;
  const destinationName = t(destinationNameKey, {
    defaultValue: config.name || config.nameZh || ''
  });

  if (isLoading) {
    return <EntryFlowScreenTemplate.LoadingIndicator />;
  }

  const minPercent = (config.completion?.minPercent as number) || 80;
  const isReady = completionPercent >= 100;
  const isAlmost = !isReady && completionPercent >= minPercent;
  const hasSubmitScreen = Boolean(config.screens?.submit);
  const hasEntryGuideScreen = Boolean(config.screens?.entryGuide);
  const useEntryGuideAsPrimary = isReady && !hasSubmitScreen && hasEntryGuideScreen;
  
  // Determine if primary action is showing "edit travel info"
  // PrimaryActionCard shows "edit travel info" when:
  // - NOT useEntryGuideAsPrimary (not showing "开始入境")
  // - AND NOT (isReady && hasSubmitScreen) (not showing "提交入境卡")
  // This matches the exact logic in PrimaryActionCard's title assignment
  const primaryActionIsEdit = !useEntryGuideAsPrimary && !(isReady && hasSubmitScreen);

  return (
    <EntryFlowScreenTemplate.ScrollContainer>
      <ProgressHeroCard
        percent={completionPercent}
        t={t}
        destination={destinationName}
        status={completionStatus}
        isReady={isReady}
        isAlmost={isAlmost}
        config={config}
      />

      <PrimaryActionCard
        t={t}
        navigation={navigation}
        route={route}
        config={config}
        isReady={isReady}
        useEntryGuideAsPrimary={useEntryGuideAsPrimary}
        completionStatus={completionStatus}
        userData={userData}
        destination={destinationName}
        primaryActionIsEdit={primaryActionIsEdit}
      />

      {/* SecondaryEditActionCard removed - edit functionality is handled by QuickActionsRow */}

      {arrivalDate && config.features?.submissionCountdown !== false && (
        <CountdownCard
          arrivalDate={arrivalDate}
          t={t}
          config={config}
        />
      )}

      <QuickActionsRow
        t={t}
        navigation={navigation}
        route={route}
        userData={userData}
        config={config}
        useEntryGuideAsPrimary={useEntryGuideAsPrimary}
        primaryActionIsEdit={primaryActionIsEdit}
      />

      <HelpCard />
    </EntryFlowScreenTemplate.ScrollContainer>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProgressHeroCard({ percent, t, destination, isReady, isAlmost, config }: any) {
  const accentColor = isReady ? '#0AA35C' : isAlmost ? '#FF8C00' : '#1E88E5';
  const backgroundColor = isReady ? '#E5F8EE' : isAlmost ? '#FFF6E6' : '#E6F1FF';
  const remaining = Math.max(0, 100 - percent);
  // Map 'us' to 'usa' for translation keys
  const rawDestinationId = config.destinationId || 'japan';
  const destinationId = mapDestinationId(rawDestinationId);

  // Build destination-specific translation keys
  const headlineKey = isReady
    ? `${destinationId}.entryFlow.progress.headline.ready`
    : isAlmost
    ? `${destinationId}.entryFlow.progress.headline.almost`
    : `${destinationId}.entryFlow.progress.headline.start`;

  const subtitleKey = isReady
    ? `${destinationId}.entryFlow.progress.subtitle.ready`
    : isAlmost
    ? `${destinationId}.entryFlow.progress.subtitle.almost`
    : `${destinationId}.entryFlow.progress.subtitle.start`;

  // Get translated destination name for use in translations
  const translatedDestinationName = t(`${destinationId}.name`, {
    defaultValue: destination || config.name || ''
  });

  const headline = isReady
    ? t(headlineKey, {
        defaultValue: config.entryFlow?.progress?.headline?.ready || `${translatedDestinationName} Ready! 🌴`,
        destination: translatedDestinationName
      })
    : isAlmost
    ? t(headlineKey, {
        defaultValue: config.entryFlow?.progress?.headline?.almost || 'Almost There',
      })
    : t(headlineKey, {
        defaultValue: config.entryFlow?.progress?.headline?.start || "Let's get started! 🌺"
      });

  const subtitle = isReady
    ? t(subtitleKey, {
        defaultValue: config.entryFlow?.progress?.subtitle?.ready || `Awesome! Your ${translatedDestinationName} trip is ready! 🌴`,
        destination: translatedDestinationName
      })
    : isAlmost
    ? t(subtitleKey, {
        defaultValue: config.entryFlow?.progress?.subtitle?.almost || `Keep it up! Just ${remaining}% left to complete your ${translatedDestinationName} trip preparation!`,
        remaining,
        destination: translatedDestinationName
      })
    : t(subtitleKey, {
        defaultValue: config.entryFlow?.progress?.subtitle?.start || 'Continue filling out your information to make the journey smoother.'
      });

  const progressLabelKey = `${destinationId}.entryFlow.progress.label`;

  return (
    <YStack paddingHorizontal="$md" marginBottom="$lg">
      <BaseCard
        variant="flat"
        padding="lg"
        backgroundColor={backgroundColor}
        borderRadius="$lg"
        borderWidth={1.5}
        borderColor="rgba(0,0,0,0.05)"
      >
        <YStack gap="$sm" alignItems="center">
          <TamaguiText fontSize="$9" fontWeight="800" color={accentColor}>
            {percent}%
          </TamaguiText>
          <TamaguiText fontSize="$3" color={accentColor}>
            {t(progressLabelKey, {
              defaultValue: config.entryFlow?.progress?.label || 'Preparation progress'
            })}
          </TamaguiText>
          <YStack
            width="100%"
            height={10}
            borderRadius={5}
            backgroundColor="rgba(0,0,0,0.08)"
            overflow="hidden"
            marginTop="$md"
          >
            <YStack
              height="100%"
              width={`${Math.min(percent, 100)}%`}
              backgroundColor={accentColor}
            />
          </YStack>
          <TamaguiText fontSize="$4" fontWeight="700" color={accentColor} marginTop="$md" textAlign="center">
            {headline}
          </TamaguiText>
          <TamaguiText fontSize="$3" color="$textSecondary" textAlign="center">
            {subtitle}
          </TamaguiText>
        </YStack>
      </BaseCard>
    </YStack>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PrimaryActionCard({
  t,
  navigation,
  route,
  config,
  isReady,
  useEntryGuideAsPrimary,
  destination,
  userData,
  primaryActionIsEdit, // eslint-disable-line @typescript-eslint/no-unused-vars
}: any) {
  const hasSubmitScreen = Boolean(config.screens?.submit);
  const entryGuideScreen = config.screens?.entryGuide;

  // Map 'us' to 'usa' for translation keys
  const rawDestinationId = config.destinationId || 'japan';
  const destinationId = mapDestinationId(rawDestinationId);

  const handlePress = () => {
    if (isReady) {
      if (hasSubmitScreen) {
        navigation?.navigate(config.screens?.submit, route?.params);
        return;
      }
      if (useEntryGuideAsPrimary && entryGuideScreen) {
        navigation?.navigate(entryGuideScreen, {
          ...route?.params,
          userData,
        });
        return;
      }
    }
    const travelInfoScreen = config.screens?.travelInfo || 'VietnamTravelInfo';
    navigation?.navigate(travelInfoScreen, route?.params);
  };

  const gradientColors = useEntryGuideAsPrimary
    ? ['#3B82F6', '#2563EB']
    : isReady && hasSubmitScreen
    ? ['#22C55E', '#16A34A']
    : ['#F97316', '#F59E0B'];
  const icon = useEntryGuideAsPrimary ? '🛂' : isReady && hasSubmitScreen ? '🛫' : '✏️';
  const title = useEntryGuideAsPrimary
    ? t(`${destinationId}.entryFlow.actions.startEntryGuide`, { defaultValue: 'Start entry guide' })
    : isReady && hasSubmitScreen
    ? t(`${destinationId}.entryFlow.actions.submit`, { defaultValue: 'Submit Entry Card' })
    : t(`${destinationId}.entryFlow.actions.edit`, { defaultValue: 'Edit travel information' });
  const subtitle = useEntryGuideAsPrimary
    ? t(`${destinationId}.entryFlow.actions.entryGuideSubtitle`, {
        defaultValue: 'View the paper card & customs walkthrough',
      })
    : isReady && hasSubmitScreen
    ? t(`${destinationId}.entryFlow.actions.submitSubtitle`, {
        defaultValue: `All set! Submit your ${destination} entry card now.`,
      })
    : t(`${destinationId}.entryFlow.actions.editSubtitle`, { defaultValue: 'Review or update any details before submitting.' });

  return (
    <YStack paddingHorizontal="$md" marginBottom="$lg">
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={{ borderRadius: 24, overflow: 'hidden' }}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            paddingVertical: 22,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <YStack
            width={52}
            height={52}
            borderRadius={26}
            backgroundColor="rgba(255,255,255,0.25)"
            alignItems="center"
            justifyContent="center"
            marginRight="$md"
          >
            <TamaguiText fontSize={26} color="$white">
              {icon}
            </TamaguiText>
          </YStack>
          <YStack
            flex={1}
            alignItems={useEntryGuideAsPrimary ? 'center' : 'flex-start'}
          >
            <TamaguiText
              fontSize="$4"
              fontWeight="700"
              color="$white"
              textAlign={useEntryGuideAsPrimary ? 'center' : 'left'}
            >
              {title}
            </TamaguiText>
            <TamaguiText
              fontSize="$2"
              color="rgba(255,255,255,0.9)"
              marginTop="$xs"
              textAlign={useEntryGuideAsPrimary ? 'center' : 'left'}
            >
              {subtitle}
            </TamaguiText>
          </YStack>
          <YStack
            width={36}
            height={36}
            borderRadius={18}
            backgroundColor="rgba(255,255,255,0.25)"
            alignItems="center"
            justifyContent="center"
          >
            <TamaguiText fontSize={20} fontWeight="700" color="$white">
              ›
            </TamaguiText>
          </YStack>
        </LinearGradient>
      </TouchableOpacity>
    </YStack>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SecondaryEditActionCard({ t, navigation, route, config }: any) {
  // Map 'us' to 'usa' for translation keys
  const rawDestinationId = config.destinationId || 'japan';
  const destinationId = mapDestinationId(rawDestinationId);

  const handlePress = () => {
    const travelInfoScreen =
      config.screens?.travelInfo || route?.params?.travelInfoScreen || 'VietnamTravelInfo';
    navigation.navigate(travelInfoScreen, route.params);
  };

  return (
    <YStack paddingHorizontal="$md" marginBottom="$lg">
      <BaseCard
        variant="flat"
        padding="md"
        pressable
        onPress={handlePress}
        borderWidth={1.5}
        borderColor="rgba(37,99,235,0.15)"
        backgroundColor="#FFFFFF"
      >
        <XStack alignItems="center" justifyContent="center" gap="$sm">
          <YStack
            width={40}
            height={40}
            borderRadius={20}
            backgroundColor="rgba(37,99,235,0.12)"
            alignItems="center"
            justifyContent="center"
          >
            <TamaguiText fontSize={22}>✏️</TamaguiText>
          </YStack>
          <YStack alignItems="center">
            <TamaguiText fontSize="$3" fontWeight="700" color="#1D4ED8">
              {t(`${destinationId}.entryFlow.actions.edit`, { defaultValue: 'Edit travel information' })}
            </TamaguiText>
            <TamaguiText
              fontSize="$2"
              color="#475569"
              marginTop="$xs"
              textAlign="center"
            >
              {t(`${destinationId}.entryFlow.actions.editSubtitle`, { defaultValue: 'Review or update any details before submitting.' })}
            </TamaguiText>
          </YStack>
        </XStack>
      </BaseCard>
    </YStack>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CountdownCard({ arrivalDate, t, config }: any) {
  const { language } = useLocale();

  if (!arrivalDate) {
    return null;
  }

  // Map 'us' to 'usa' for translation keys
  const rawDestinationId = config.destinationId || 'japan';
  const destinationId = rawDestinationId === 'us' ? 'usa' : rawDestinationId;

  const arrival = new Date(arrivalDate as string);
  const now = new Date();
  const diff = arrival.getTime() - now.getTime();

  if (Number.isNaN(diff)) {
    return null;
  }

  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  let formattedArrival = arrivalDate;
  try {
    formattedArrival = arrival.toLocaleDateString(language || undefined, dateFormatOptions);
  } catch (_error) {
    formattedArrival = arrival.toLocaleDateString(undefined, dateFormatOptions);
  }

  return (
    <YStack paddingHorizontal="$md" marginBottom="$lg">
      <BaseCard
        variant="flat"
        padding="lg"
        borderRadius="$lg"
        backgroundColor="#FFF3E0"
        borderWidth={2}
        borderColor="#FF9800"
      >
        <YStack gap="$md">
          <XStack alignItems="center" gap="$sm">
            <YStack
              width={32}
              height={32}
              borderRadius={16}
              backgroundColor="#FFE0B2"
              alignItems="center"
              justifyContent="center"
            >
              <TamaguiText fontSize={18}>🛂</TamaguiText>
            </YStack>
          <TamaguiText fontSize="$3" fontWeight="700" color="#D97706">
              {t(`${destinationId}.entryFlow.countdown.title`, { defaultValue: 'Submission Window' })}
            </TamaguiText>
          </XStack>

          <TamaguiText fontSize="$2" color="#D97706" textAlign="center">
            {t(`${destinationId}.entryFlow.countdown.subtitle`, { defaultValue: 'Submission window is open. Please submit before it ends.' })}
          </TamaguiText>

          <TamaguiText fontSize="$6" fontWeight="800" color="#D97706" textAlign="center">
            {t(`${destinationId}.entryFlow.countdown.time`, {
              defaultValue: `${days}d ${hours}h ${minutes}m ${seconds}s`,
              days,
              hours,
              minutes,
              seconds,
            })}
          </TamaguiText>

          <BaseCard
            variant="flat"
            padding="md"
            backgroundColor="#FFFFFF"
            borderRadius="$md"
            borderWidth={1}
            borderColor="rgba(255,152,0,0.25)"
          >
          <TamaguiText fontSize="$3" color="#D97706" textAlign="center">
            {t(`${destinationId}.entryFlow.countdown.arrival`, {
                defaultValue: `Arrival date ${formattedArrival}`,
                date: formattedArrival,
              })}
            </TamaguiText>
          </BaseCard>
        </YStack>
      </BaseCard>
    </YStack>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function QuickActionsRow({
  t,
  navigation,
  route,
  userData,
  config,
  useEntryGuideAsPrimary,
  primaryActionIsEdit,
}: any) {
  const rawDestinationId = config.destinationId || 'japan';
  const destinationId = mapDestinationId(rawDestinationId);
  const showPreviewQuickAction = config.features?.disablePreviewQuickAction !== true;
  // Hide edit quick action if:
  // 1. Primary action is already showing "edit travel info" (when incomplete)
  // This prevents duplicate edit buttons
  // Note: SecondaryEditActionCard has been removed, so edit button is always available in QuickActionsRow when primary is not editing
  const showEditQuickAction = config.features?.disableEditQuickAction !== true && !primaryActionIsEdit;
  const showEntryGuideQuickAction =
    config.features?.entryGuideQuickAction === true && !useEntryGuideAsPrimary;

  if (!showPreviewQuickAction && !showEditQuickAction && !showEntryGuideQuickAction) {
    return null;
  }

  const handlePreview = () => {
    const previewScreen =
      config.screens?.entryPackPreview ||
      route?.params?.entryPackPreviewScreen ||
      'EntryPackPreview';

    navigation.navigate(previewScreen, {
      ...route.params,
      userData,
      entryPackData: {
        personalInfo: userData?.personalInfo,
        travelInfo: userData?.travel,
        funds: userData?.funds,
      },
    });
  };

  const handleEdit = () => {
    const target =
      config.screens?.travelInfo ||
      route?.params?.travelInfoScreen ||
      route?.params?.nextScreen ||
      'VietnamTravelInfo';
    navigation.navigate(target, {
      ...route.params,
      userData,
    });
  };

  const handleEntryGuide = () => {
    const target =
      config.screens?.entryGuide ||
      route?.params?.entryGuideScreen ||
      'VietnamEntryGuide';
    navigation.navigate(target, {
      ...route.params,
      userData,
    });
  };

  const actionCards = [];

  if (showPreviewQuickAction) {
    actionCards.push({
      key: 'preview',
      icon: '👁️',
      title: t(`${destinationId}.entryFlow.actions.previewPack`, { defaultValue: 'Preview entry pack' }),
      subtitle: t(`${destinationId}.entryFlow.actions.previewPackSubtitle`, {
        defaultValue: "See everything you've already prepared",
      }),
      borderColor: 'rgba(11,214,123,0.35)',
      iconBackground: 'rgba(11,214,123,0.12)',
      onPress: handlePreview,
    });
  }

  if (showEntryGuideQuickAction) {
    actionCards.push({
      key: 'entryGuide',
      icon: '🛂',
      title: t(`${destinationId}.entryFlow.actions.entryGuide`, { defaultValue: 'Entry guide' }),
      subtitle: t(`${destinationId}.entryFlow.actions.entryGuideSubtitle`, {
        defaultValue: 'View the paper card & customs walkthrough',
      }),
      borderColor: 'rgba(37,99,235,0.3)',
      iconBackground: 'rgba(37,99,235,0.12)',
      onPress: handleEntryGuide,
    });
  }

  if (showEditQuickAction) {
    actionCards.push({
      key: 'edit',
      icon: '✏️',
      title: t(`${destinationId}.entryFlow.actions.editThai`, { defaultValue: 'Edit travel information' }),
      subtitle: t(`${destinationId}.entryFlow.actions.editThaiSubtitle`, {
        defaultValue: 'Jump back to make changes',
      }),
      borderColor: 'rgba(255,152,0,0.35)',
      iconBackground: 'rgba(255,152,0,0.12)',
      onPress: handleEdit,
    });
  }

  return (
    <YStack paddingHorizontal="$md" marginBottom="$xl" gap="$md">
      {actionCards.map(({ key, icon, title, subtitle, borderColor, iconBackground, onPress }) => (
        <BaseCard
          key={key}
          variant="flat"
          padding="lg"
          pressable
          onPress={onPress}
          borderWidth={2}
          borderColor={borderColor}
        >
          <XStack alignItems="center" gap="$md">
            <YStack
              width={48}
              height={48}
              borderRadius={24}
              backgroundColor={iconBackground}
              alignItems="center"
              justifyContent="center"
            >
              <TamaguiText fontSize={24}>{icon}</TamaguiText>
            </YStack>
            <YStack flex={1} gap="$xs">
              <TamaguiText fontSize="$3" fontWeight="700" color="$text">
                {title}
              </TamaguiText>
              <TamaguiText fontSize="$2" color="$textSecondary">
                {subtitle}
              </TamaguiText>
            </YStack>
            <TamaguiText fontSize="$5" color="$textSecondary">
              ›
            </TamaguiText>
          </XStack>
        </BaseCard>
      ))}
    </YStack>
  );
}

function HelpCard() {
  const { t, config } = useEntryFlowTemplate();
  const destinationId = mapDestinationId(config.destinationId || 'japan');
  
  const handleHelp = () => {
    Alert.alert(
      t(`${destinationId}.entryFlow.actions.help.title`, { defaultValue: 'Need help? 🤝' }),
      t(`${destinationId}.entryFlow.actions.help.message`, {
        defaultValue: "Run into an issue? Share a screenshot and we'll help.",
      }),
      [
        { text: t(`${destinationId}.entryFlow.actions.help.share`, { defaultValue: 'Share screenshot' }) },
        { text: t(`${destinationId}.entryFlow.actions.help.contact`, { defaultValue: 'Contact support' }) },
        { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
      ]
    );
  };

  return (
    <YStack paddingHorizontal="$md" marginBottom="$xl">
      <BaseCard
        variant="flat"
        padding="lg"
        pressable
        onPress={handleHelp}
        borderWidth={2}
        borderColor="rgba(38,132,255,0.3)"
      >
        <YStack alignItems="center" gap="$sm">
          <TamaguiText fontSize={26}>🙌</TamaguiText>
          <TamaguiText fontSize="$3" fontWeight="700">
            {t(`${destinationId}.entryFlow.actions.help.callout`, { defaultValue: 'Need assistance?' })}
          </TamaguiText>
          <TamaguiText fontSize="$2" color="$textSecondary" textAlign="center">
            {t(`${destinationId}.entryFlow.actions.help.calloutSubtitle`, { defaultValue: 'Tap to get help' })}
          </TamaguiText>
        </YStack>
      </BaseCard>
    </YStack>
  );
}

/**
 * Completion Card Component
 */
EntryFlowScreenTemplate.CompletionCard = () => {
  const { completionPercent, categories, t, config } = useEntryFlowTemplate();

  const completedCategories = categories.filter((c) => c.status === 'completed').length;
  const totalCategories = categories.length;

  return (
    <YStack paddingHorizontal="$md" marginBottom="$md">
      <BaseCard variant="elevated" padding="lg">
        <TamaguiText fontSize="$5" fontWeight="bold" marginBottom="$md">
          {t(`${config.destinationId}.entryFlow.completionCard.title`, { defaultValue: 'Completion Progress' })}
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
          {t(`${config.destinationId}.entryFlow.completionCard.summary`, {
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
 *
 * Renders each category as a card with icon, name, completion status badge,
 * and a list of missing fields when the category is not yet complete.
 * Data is derived from the template context's categories array,
 * which is populated by loadData() using EntryCompletionCalculator
 * and the config's category definitions.
 */
EntryFlowScreenTemplate.Categories = () => {
  const { categories, t, config } = useEntryFlowTemplate();

  if (!categories || categories.length === 0) {
    return null;
  }

  const destinationId = mapDestinationId(config.destinationId || 'japan');

  return (
    <YStack paddingHorizontal="$md" marginTop="$lg" gap="$md">
      <TamaguiText fontSize="$4" fontWeight="700">
        {t(`${destinationId}.entryFlow.categories.title`, { defaultValue: 'Preparation Categories' })}
      </TamaguiText>

      {categories.map((cat: any) => {
        const isComplete = cat.status === 'completed';
        const isPartiallyComplete = cat.status === 'partially_complete';

        return (
          <BaseCard
            key={cat.id}
            variant="flat"
            borderWidth={1}
            borderColor={isComplete ? '#C8E6C9' : isPartiallyComplete ? '#FFF9C4' : '#FFCDD2'}
            padding="md"
          >
            <XStack alignItems="center" gap="$md" marginBottom={cat.missingFields.length > 0 ? '$sm' : 0}>
              {/* Icon */}
              <TamaguiText fontSize={28}>{cat.icon}</TamaguiText>

              {/* Name + counts */}
              <YStack flex={1}>
                <TamaguiText fontSize="$4" fontWeight="600">
                  {cat.name}
                </TamaguiText>
                <TamaguiText fontSize="$2" color="$textSecondary">
                  {cat.completedCount} / {cat.totalCount}
                </TamaguiText>
              </YStack>

              {/* Status badge */}
              <XStack
                backgroundColor={isComplete ? '#E8F5E9' : isPartiallyComplete ? '#FFF8E1' : '#FFEBEE'}
                paddingHorizontal="$sm"
                paddingVertical={4}
                borderRadius={12}
                alignItems="center"
                gap={4}
              >
                <TamaguiText fontSize={14}>
                  {isComplete ? '✅' : isPartiallyComplete ? '⏳' : '📝'}
                </TamaguiText>
                <TamaguiText
                  fontSize="$1"
                  fontWeight="600"
                  color={isComplete ? '#2E7D32' : isPartiallyComplete ? '#F57F17' : '#C62828'}
                >
                  {isComplete
                    ? t(`${destinationId}.entryFlow.categories.complete`, { defaultValue: 'Complete' })
                    : isPartiallyComplete
                    ? t(`${destinationId}.entryFlow.categories.partial`, { defaultValue: 'Partial' })
                    : t(`${destinationId}.entryFlow.categories.incomplete`, { defaultValue: 'Incomplete' })}
                </TamaguiText>
              </XStack>
            </XStack>

            {/* Missing fields */}
            {cat.missingFields.length > 0 && (
              <YStack marginTop="$sm" paddingLeft={44}>
                <TamaguiText fontSize="$2" color="$danger" fontWeight="500" marginBottom={4}>
                  {t(`${destinationId}.entryFlow.categories.missingFields`, { defaultValue: 'Missing:' })}
                </TamaguiText>
                {cat.missingFields.map((field: string, idx: number) => (
                  <TamaguiText key={idx} fontSize="$2" color="$textSecondary" marginBottom={2}>
                    · {field}
                  </TamaguiText>
                ))}
              </YStack>
            )}
          </BaseCard>
        );
      })}
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
  const arrival = new Date(arrivalDate as string);
  const now = new Date();
  const daysUntilArrival = Math.ceil((arrival.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

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
              {t(`${config.destinationId}.entryFlow.countdown.title`, { defaultValue: 'Submission Window' })}
            </TamaguiText>
            <TamaguiText fontSize="$2" color="$textSecondary">
              {t(`${config.destinationId}.entryFlow.countdown.days`, {
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
  const destinationId = mapDestinationId(config.destinationId || 'japan');

  const handleContinueEditing = () => {
    const travelInfoScreen = config.screens?.travelInfo || 'VietnamTravelInfo';
    navigation?.navigate(travelInfoScreen, route?.params);
  };

  const handleSubmit = () => {
    if (completionPercent < ((config.completion?.minPercent as number) || 80)) {
      Alert.alert(
        t(`${config.destinationId}.entryFlow.actions.incomplete.title`, { defaultValue: 'Incomplete Information' }),
        t(`${config.destinationId}.entryFlow.actions.incomplete.message`, {
          defaultValue: 'Please complete at least 80% of the information before submitting.',
        })
      );
      return;
    }

    // Navigate to submission screen if exists
    if (config.screens?.submit) {
      navigation?.navigate(config.screens?.submit, route?.params);
    } else {
      Alert.alert(
        t(`${config.destinationId}.entryFlow.actions.success.title`, { defaultValue: 'Ready!' }),
        t(`${config.destinationId}.entryFlow.actions.success.message`, {
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
        disabled={completionPercent < ((config.completion?.minPercent as number) || 80)}
      >
        {completionPercent >= 100
          ? t(`${destinationId}.entryFlow.actions.submit`, { defaultValue: 'Submit Entry Card' })
          : t(`${destinationId}.entryFlow.actions.continue`, { defaultValue: 'Continue Editing' })
        }
      </BaseButton>

      <BaseButton
        variant="outlined"
        size="lg"
        onPress={handleContinueEditing}
        fullWidth
      >
        {t(`${destinationId}.entryFlow.actions.edit`, { defaultValue: 'Edit Information' })}
      </BaseButton>
    </YStack>
  );
};

/**
 * Loading Indicator Component
 */
EntryFlowScreenTemplate.LoadingIndicator = ({ message }: any) => {
  const { t, isLoading } = useEntryFlowTemplate();

  if (!isLoading) {
    return null;
  }

  return (
    <YStack padding="$md" alignItems="center" pointerEvents="none">
      <TamaguiText fontSize="$3" color="$textSecondary">
        {message || t('common.loading', { defaultValue: 'Loading...' })}
      </TamaguiText>
    </YStack>
  );
};

/* eslint-enable react/prop-types, react/display-name, react-hooks/rules-of-hooks */

// Export hook for advanced usage
EntryFlowScreenTemplate.useTemplate = useEntryFlowTemplate;

export default EntryFlowScreenTemplate;
