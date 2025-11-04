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
import { ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import BackButton from '../components/BackButton';
import { useLocale } from '../i18n/LocaleContext';
import UserDataService from '../services/data/UserDataService';
import EntryCompletionCalculator from '../utils/EntryCompletionCalculator';
import { LinearGradient } from 'expo-linear-gradient';
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

  const destinationName = config.nameZh || config.name || '';

  if (isLoading) {
    return <EntryFlowScreenTemplate.LoadingIndicator />;
  }

  const minPercent = config.completion?.minPercent || 80;
  const isReady = completionPercent >= 100;
  const isAlmost = !isReady && completionPercent >= minPercent;
  const hasSubmitScreen = Boolean(config.screens?.submit);
  const hasEntryGuideScreen = Boolean(config.screens?.entryGuide);
  const useEntryGuideAsPrimary = isReady && !hasSubmitScreen && hasEntryGuideScreen;

  return (
    <EntryFlowScreenTemplate.ScrollContainer>
      <ProgressHeroCard
        percent={completionPercent}
        t={t}
        destination={destinationName}
        status={completionStatus}
        isReady={isReady}
        isAlmost={isAlmost}
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
      />

      {useEntryGuideAsPrimary && (
        <SecondaryEditActionCard
          t={t}
          navigation={navigation}
          route={route}
          config={config}
        />
      )}

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
      />

      <HelpCard t={t} />
    </EntryFlowScreenTemplate.ScrollContainer>
  );
};

function ProgressHeroCard({ percent, t, destination, isReady, isAlmost }) {
  const accentColor = isReady ? '#0AA35C' : isAlmost ? '#FF8C00' : '#1E88E5';
  const backgroundColor = isReady ? '#E5F8EE' : isAlmost ? '#FFF6E6' : '#E6F1FF';
  const remaining = Math.max(0, 100 - percent);

  const headline = isReady
    ? `${destination}准备就绪！🌴`
    : isAlmost
    ? '进展不错！💪'
    : '让我们开始吧！🌺';

  const subtitle = isReady
    ? `太棒了！${destination}之旅准备就绪！🌴`
    : isAlmost
    ? `继续加油！还差 ${remaining}% 就能完成${destination}行程准备！`
    : '继续完善资料，让旅程更顺利。';

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
            准备进度
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

function PrimaryActionCard({
  t,
  navigation,
  route,
  config,
  isReady,
  useEntryGuideAsPrimary,
  destination,
}) {
  const hasSubmitScreen = Boolean(config.screens?.submit);
  const entryGuideScreen = config.screens?.entryGuide;

  const handlePress = () => {
    if (isReady) {
      if (hasSubmitScreen) {
        navigation.navigate(config.screens.submit, route.params);
        return;
      }
      if (useEntryGuideAsPrimary && entryGuideScreen) {
        navigation.navigate(entryGuideScreen, route.params);
        return;
      }
    }
    const travelInfoScreen = config.screens?.travelInfo || 'VietnamTravelInfo';
    navigation.navigate(travelInfoScreen, route.params);
  };

  const gradientColors = useEntryGuideAsPrimary
    ? ['#3B82F6', '#2563EB']
    : isReady && hasSubmitScreen
    ? ['#22C55E', '#16A34A']
    : ['#F97316', '#F59E0B'];
  const icon = useEntryGuideAsPrimary ? '🛂' : isReady && hasSubmitScreen ? '🛫' : '✏️';
  const title = useEntryGuideAsPrimary
    ? t('entryFlow.actions.startEntryGuide', { defaultValue: '开始入境' })
    : isReady && hasSubmitScreen
    ? t('entryFlow.actions.submitThai', { defaultValue: '提交入境卡' })
    : t('entryFlow.actions.editThai', { defaultValue: '修改旅行信息' });
  const subtitle = useEntryGuideAsPrimary
    ? t('entryFlow.actions.entryGuide.subtitle', {
        defaultValue: '查看纸质入境卡与海关申报填写步骤',
      })
    : isReady && hasSubmitScreen
    ? t('entryFlow.actions.submitThai.subtitle', {
        defaultValue: `准备完成！现在可以提交${destination}入境卡了`,
      })
    : t('entryFlow.actions.editThai.subtitle', { defaultValue: '如需修改，返回编辑' });

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

function SecondaryEditActionCard({ t, navigation, route, config }) {
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
              {t('entryFlow.actions.editThai', { defaultValue: '修改旅行信息' })}
            </TamaguiText>
            <TamaguiText
              fontSize="$2"
              color="#475569"
              marginTop="$xs"
              textAlign="center"
            >
              {t('entryFlow.actions.editThai.subtitle', { defaultValue: '如需修改，返回编辑' })}
            </TamaguiText>
          </YStack>
        </XStack>
      </BaseCard>
    </YStack>
  );
}

function CountdownCard({ arrivalDate, t, config }) {
  if (!arrivalDate) {
    return null;
  }

  const arrival = new Date(arrivalDate);
  const now = new Date();
  const diff = arrival - now;

  if (Number.isNaN(diff)) {
    return null;
  }

  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedArrival = arrival.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
              {t('entryFlow.countdown.titleThai', { defaultValue: '距离提交入境卡还有' })}
            </TamaguiText>
          </XStack>

          <TamaguiText fontSize="$2" color="#D97706" textAlign="center">
            {t('entryFlow.countdown.subtitleThai', { defaultValue: '提交窗口已开启，请在倒计时结束前完成提交' })}
          </TamaguiText>

          <TamaguiText fontSize="$6" fontWeight="800" color="#D97706" textAlign="center">
            {t('entryFlow.countdown.timeThai', {
              defaultValue: `${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`,
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
              {t('entryFlow.countdown.arrivalThai', { defaultValue: `抵达日期 ${formattedArrival}` })}
            </TamaguiText>
          </BaseCard>
        </YStack>
      </BaseCard>
    </YStack>
  );
}

function QuickActionsRow({ t, navigation, route, userData, config, useEntryGuideAsPrimary }) {
  const showPreviewQuickAction = config.features?.disablePreviewQuickAction !== true;
  const showEditQuickAction = config.features?.disableEditQuickAction !== true;
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
      userData,
      ...route.params,
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
    navigation.navigate(target, route.params);
  };

  const handleEntryGuide = () => {
    const target =
      config.screens?.entryGuide ||
      route?.params?.entryGuideScreen ||
      'VietnamEntryGuide';
    navigation.navigate(target, route.params);
  };

  return (
    <XStack paddingHorizontal="$md" gap="$md" marginBottom="$lg">
      {showPreviewQuickAction && (
        <BaseCard
          variant="flat"
          padding="lg"
          flex={1}
          pressable
          onPress={handlePreview}
          borderWidth={2}
          borderColor="rgba(11,214,123,0.3)"
        >
          <YStack alignItems="center" gap="$sm">
            <TamaguiText fontSize={26}>👁️</TamaguiText>
            <TamaguiText fontSize="$3" fontWeight="700">
              {t('entryFlow.actions.previewPack', { defaultValue: '预览入境包' })}
            </TamaguiText>
            <TamaguiText fontSize="$2" color="$textSecondary">
              {t('entryFlow.actions.previewPack.subtitle', { defaultValue: '查看已经准备好的资料' })}
            </TamaguiText>
          </YStack>
        </BaseCard>
      )}
      {showEntryGuideQuickAction && (
        <BaseCard
          variant="flat"
          padding="lg"
          flex={1}
          pressable
          onPress={handleEntryGuide}
          borderWidth={2}
          borderColor="rgba(25,118,210,0.3)"
        >
          <YStack alignItems="center" gap="$sm">
            <TamaguiText fontSize={26}>🛂</TamaguiText>
            <TamaguiText fontSize="$3" fontWeight="700">
              {t('entryFlow.actions.entryGuide', { defaultValue: '入境手续指南' })}
            </TamaguiText>
            <TamaguiText fontSize="$2" color="$textSecondary" textAlign="center">
              {t('entryFlow.actions.entryGuide.subtitle', { defaultValue: '查看纸质入境卡与海关申报填写步骤' })}
            </TamaguiText>
          </YStack>
        </BaseCard>
      )}
      {showEditQuickAction && (
        <BaseCard
          variant="flat"
          padding="lg"
          flex={1}
          pressable
          onPress={handleEdit}
          borderWidth={2}
          borderColor="rgba(255,152,0,0.3)"
        >
          <YStack alignItems="center" gap="$sm">
            <TamaguiText fontSize={26}>✏️</TamaguiText>
            <TamaguiText fontSize="$3" fontWeight="700">
              {t('entryFlow.actions.editInfoThai', { defaultValue: '编辑旅行信息' })}
            </TamaguiText>
            <TamaguiText fontSize="$2" color="$textSecondary">
              {t('entryFlow.actions.editInfoThai.subtitle', { defaultValue: '如需修改，返回编辑' })}
            </TamaguiText>
          </YStack>
        </BaseCard>
      )}
    </XStack>
  );
}

function HelpCard({ t }) {
  const handleHelp = () => {
    Alert.alert(
      t('entryFlow.actions.help.title', { defaultValue: '寻求帮助 🤝' }),
      t('entryFlow.actions.help.message', {
        defaultValue: '你可以：\n\n📸 截图分享给亲友检查\n💬 向客服咨询问题\n📖 查看帮助文档',
      }),
      [
        { text: t('entryFlow.actions.help.share', { defaultValue: '截图分享' }) },
        { text: t('entryFlow.actions.help.contact', { defaultValue: '联系客服' }) },
        { text: t('common.cancel', { defaultValue: '取消' }), style: 'cancel' },
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
        borderWidth={1.5}
        borderColor="rgba(38,132,255,0.25)"
      >
        <YStack alignItems="center" gap="$sm">
          <TamaguiText fontSize={24}>🙌</TamaguiText>
          <TamaguiText fontSize="$3" fontWeight="700">
            {t('entryFlow.actions.help.callout', { defaultValue: '寻求帮助' })}
          </TamaguiText>
          <TamaguiText fontSize="$2" color="$textSecondary" textAlign="center">
            {t('entryFlow.actions.help.callout.subtitle', { defaultValue: '遇到问题？点我获取协助' })}
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
  return null;
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
