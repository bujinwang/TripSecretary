// @ts-nocheck

/**
 * TravelInfoScreenTemplate
 *
 * Reusable template for country-specific travel information screens.
 * Extracts common patterns from Thailand/Malaysia/Singapore screens.
 *
 * Usage:
 *   <TravelInfoScreenTemplate config={vietnamConfig}>
 *     <TravelInfoScreenTemplate.Section name="passport">
 *       <PassportFields />
 *     </TravelInfoScreenTemplate.Section>
 *   </TravelInfoScreenTemplate>
 *
 * @example
 * // Vietnam implementation (< 100 lines)
 * import { TravelInfoScreenTemplate } from '../../templates';
 * import { vietnamConfig } from '../../config/destinations/vietnam';
 *
 * const VietnamTravelInfoScreen = ({ route, navigation }) => (
 *   <TravelInfoScreenTemplate
 *     config={vietnamConfig}
 *     route={route}
 *     navigation={navigation}
 *   >
 *     <TravelInfoScreenTemplate.PassportSection />
 *     <TravelInfoScreenTemplate.PersonalSection />
 *     <TravelInfoScreenTemplate.FundsSection />
 *     <TravelInfoScreenTemplate.TravelSection />
 *   </TravelInfoScreenTemplate>
 * );
 */

import React, { createContext, useContext, useState, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../components/BackButton';
import { useLocale } from '../i18n/LocaleContext';
import {
  YStack,
  XStack,
  BaseCard,
  BaseButton,
  Text as TamaguiText,
} from '../components/tamagui';

// Template Context - shares state between template and children
const TravelInfoTemplateContext = createContext(null);

const useTravelInfoTemplate = () => {
  const context = useContext(TravelInfoTemplateContext);
  if (!context) {
    throw new Error('useTravelInfoTemplate must be used within TravelInfoScreenTemplate');
  }
  return context;
};

/**
 * Main Template Component
 */
const TravelInfoScreenTemplate = ({
  children,
  config,
  route,
  navigation,
  // Optional hooks for custom behavior
  useFormStateHook,
  useValidationHook,
  usePersistenceHook,
}) => {
  const { t } = useLocale();
  const { passport, destination } = route.params || {};

  // State
  const [expandedSection, setExpandedSection] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollViewRef = useRef(null);

  // Allow custom hooks or use defaults
  const formState = useFormStateHook ? useFormStateHook(passport) : null;
  const validation = useValidationHook ? useValidationHook(formState) : null;
  const persistence = usePersistenceHook ? usePersistenceHook({ passport, destination, formState }) : null;

  // Context value shared with children
  const contextValue = {
    // Config
    config,
    t,

    // Navigation
    navigation,
    route,
    passport,
    destination,

    // State
    expandedSection,
    setExpandedSection,
    saveStatus,
    setSaveStatus,
    isLoading,
    setIsLoading,
    scrollPosition,
    setScrollPosition,
    scrollViewRef,

    // Hooks (can be null if not provided)
    formState,
    validation,
    persistence,
  };

  return (
    <TravelInfoTemplateContext.Provider value={contextValue}>
      <SafeAreaView style={{ flex: 1, backgroundColor: config.colors?.background || '#F9FAFB' }}>
        {children}
      </SafeAreaView>
    </TravelInfoTemplateContext.Provider>
  );
};

/**
 * Header Component
 */
TravelInfoScreenTemplate.Header = ({
  title,
  titleKey,
  onBackPress,
  rightComponent,
}) => {
  const { t, navigation, config } = useTravelInfoTemplate();

  const headerTitle = title || t(titleKey || `${config.destinationId}.travelInfo.headerTitle`, {
    defaultValue: `${config.name} Entry Info`
  });

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
 * Hero Section Component
 */
TravelInfoScreenTemplate.HeroSection = ({ flag, title, subtitle }) => {
  const { t, config } = useTravelInfoTemplate();

  return (
    <YStack paddingHorizontal="$md" paddingVertical="$lg" alignItems="center">
      <TamaguiText fontSize={64} marginBottom="$md">
        {flag || config.flag || '🌍'}
      </TamaguiText>
      <TamaguiText fontSize="$7" fontWeight="bold" color="$primary" marginBottom="$xs" textAlign="center">
        {title || config.name}
      </TamaguiText>
      {subtitle && (
        <TamaguiText fontSize="$4" color="$textSecondary" textAlign="center">
          {subtitle}
        </TamaguiText>
      )}
    </YStack>
  );
};

/**
 * Status Indicator Component
 */
TravelInfoScreenTemplate.StatusIndicator = () => {
  const { t, saveStatus, setSaveStatus } = useTravelInfoTemplate();

  if (!saveStatus) {
return null;
}

  const statusConfig = {
    pending: { icon: '⏳', color: '#FFF9E6', textKey: 'saveStatus.pending', defaultText: 'Waiting to save...' },
    saving: { icon: '💾', color: '#E6F2FF', textKey: 'saveStatus.saving', defaultText: 'Saving...' },
    saved: { icon: '✅', color: '#E6F9E6', textKey: 'saveStatus.saved', defaultText: 'Saved' },
    error: { icon: '❌', color: '#FFE6E6', textKey: 'saveStatus.error', defaultText: 'Save failed' },
  };

  const status = statusConfig[saveStatus];

  return (
    <XStack
      paddingHorizontal="$md"
      paddingVertical="$sm"
      alignItems="center"
      gap="$sm"
      backgroundColor={status.color}
      marginHorizontal="$md"
      marginVertical="$sm"
      borderRadius="$md"
    >
      <TamaguiText fontSize={16}>{status.icon}</TamaguiText>
      <TamaguiText fontSize="$2" color="$textSecondary" flex={1}>
        {t(status.textKey, { defaultValue: status.defaultText })}
      </TamaguiText>
      {saveStatus === 'error' && (
        <BaseButton
          variant="outline"
          size="sm"
          onPress={() => setSaveStatus('saving')}
        >
          {t('common.retry', { defaultValue: 'Retry' })}
        </BaseButton>
      )}
    </XStack>
  );
};

/**
 * Privacy Notice Component
 */
TravelInfoScreenTemplate.PrivacyNotice = ({ message }) => {
  const { t } = useTravelInfoTemplate();

  return (
    <YStack paddingHorizontal="$md" marginBottom="$md">
      <BaseCard variant="flat" padding="md">
        <XStack gap="$sm" alignItems="center">
          <TamaguiText fontSize={20}>💾</TamaguiText>
          <TamaguiText fontSize="$2" color="$textSecondary" flex={1}>
            {message || t('common.privacyNotice', {
              defaultValue: 'All information is stored locally on your device'
            })}
          </TamaguiText>
        </XStack>
      </BaseCard>
    </YStack>
  );
};

/**
 * Scrollable Content Container
 */
TravelInfoScreenTemplate.ScrollContainer = ({ children }) => {
  const { scrollViewRef, setScrollPosition } = useTravelInfoTemplate();

  return (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
      onScroll={(event) => {
        const currentScrollPosition = event.nativeEvent.contentOffset.y;
        setScrollPosition(currentScrollPosition);
      }}
      scrollEventThrottle={100}
    >
      {children}
    </ScrollView>
  );
};

/**
 * Collapsible Section Component
 */
TravelInfoScreenTemplate.Section = ({
  name,
  title,
  titleKey,
  icon,
  fieldCount,
  children,
  defaultExpanded = false,
}) => {
  const { t, config, expandedSection, setExpandedSection } = useTravelInfoTemplate();

  const isExpanded = expandedSection === name;

  const sectionTitle = title || t(
    titleKey || `${config.destinationId}.travelInfo.sections.${name}.title`,
    { defaultValue: name.charAt(0).toUpperCase() + name.slice(1) }
  );

  const handleToggle = () => {
    setExpandedSection(isExpanded ? null : name);
  };

  return (
    <YStack paddingHorizontal="$md" marginBottom="$md">
      <BaseCard variant="elevated" padding="none">
        {/* Section Header */}
        <XStack
          padding="$md"
          alignItems="center"
          justifyContent="space-between"
          onPress={handleToggle}
          cursor="pointer"
        >
          <XStack gap="$sm" alignItems="center" flex={1}>
            {icon && <TamaguiText fontSize={20}>{icon}</TamaguiText>}
            <TamaguiText fontSize="$5" fontWeight="600" color="$textPrimary">
              {sectionTitle}
            </TamaguiText>
            {fieldCount !== undefined && fieldCount !== null && (
              <BaseCard variant="flat" paddingHorizontal="$sm" paddingVertical="$xs">
                <TamaguiText fontSize="$2" color="$primary">
                  {fieldCount.completed || 0}/{fieldCount.total || 0}
                </TamaguiText>
              </BaseCard>
            )}
          </XStack>
          <TamaguiText fontSize={20}>{isExpanded ? '▼' : '▶'}</TamaguiText>
        </XStack>

        {/* Section Content */}
        {isExpanded && (
          <YStack padding="$md" paddingTop="$none">
            {children}
          </YStack>
        )}
      </BaseCard>
    </YStack>
  );
};

/**
 * Submit Button Component
 */
TravelInfoScreenTemplate.SubmitButton = ({
  label,
  labelKey,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
}) => {
  const { t, config, navigation, route } = useTravelInfoTemplate();

  const buttonLabel = label || t(
    labelKey || `${config.destinationId}.travelInfo.continueButton`,
    { defaultValue: 'Continue' }
  );

  const handlePress = onPress || (() => {
    // Default: navigate to next screen if defined in config
    if (config.screens?.next) {
      navigation.navigate(config.screens.next, route.params);
    }
  });

  const renderedIcon = icon
    ? (typeof icon === 'string' ? <TamaguiText>{icon}</TamaguiText> : icon)
    : undefined;

  return (
    <YStack paddingHorizontal="$md" paddingVertical="$lg">
      <BaseButton
        variant={variant}
        size="lg"
        onPress={handlePress}
        fullWidth
        disabled={disabled}
        icon={renderedIcon}
      >
        {typeof buttonLabel === 'string' ? (
          <TamaguiText>{buttonLabel}</TamaguiText>
        ) : (
          buttonLabel
        )}
      </BaseButton>
    </YStack>
  );
};

/**
 * Loading Indicator Component
 */
TravelInfoScreenTemplate.LoadingIndicator = ({ message }) => {
  const { t, isLoading } = useTravelInfoTemplate();

  if (!isLoading) {
return null;
}

  return (
    <YStack padding="$md" alignItems="center">
      <TamaguiText fontSize="$3" color="$textSecondary">
        {message || t('common.loading', { defaultValue: 'Loading...' })}
      </TamaguiText>
    </YStack>
  );
};

// Export hook for advanced usage
TravelInfoScreenTemplate.useTemplate = useTravelInfoTemplate;

TravelInfoScreenTemplate.propTypes = {
  children: PropTypes.node,
  config: PropTypes.shape({
    country: PropTypes.string.isRequired,
    fields: PropTypes.object,
    colors: PropTypes.shape({
      background: PropTypes.string,
      primary: PropTypes.string,
    }),
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      passport: PropTypes.object,
      destination: PropTypes.string,
    }),
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    goBack: PropTypes.func,
  }).isRequired,
  useFormStateHook: PropTypes.func,
  useValidationHook: PropTypes.func,
  usePersistenceHook: PropTypes.func,
};

export default TravelInfoScreenTemplate;
