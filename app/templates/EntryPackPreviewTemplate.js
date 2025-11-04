/**
 * EntryPackPreviewTemplate
 *
 * Reusable template for entry pack preview modals.
 * Extracted from VietnamEntryPackPreviewScreen to enable config-driven screens.
 */

/* eslint-disable react/prop-types */

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme';
import UserDataService from '../services/data/UserDataService';
import EntryPackDisplay from '../components/EntryPackDisplay';
import { useLocale } from '../i18n/LocaleContext';

const EntryPackPreviewTemplateContext = createContext(null);

const useEntryPackPreviewTemplate = () => {
  const context = useContext(EntryPackPreviewTemplateContext);
  if (!context) {
    throw new Error(
      'useEntryPackPreviewTemplate must be used within EntryPackPreviewTemplate'
    );
  }
  return context;
};

const EntryPackPreviewTemplate = ({
  children,
  config,
  navigation,
  route,
}) => {
  const { userData, passport: rawPassport, destination, entryPackData } =
    route?.params || {};
  const passport = useMemo(
    () => UserDataService.toSerializablePassport(rawPassport),
    [rawPassport]
  );

  const [loadedTravelData, setLoadedTravelData] = useState(null);
  const [loadedFundsData, setLoadedFundsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const destinationId =
    destination?.id || config?.destinationId || config?.countryCode || 'vietnam';

  useEffect(() => {
    let isMounted = true;

    const shouldLoadTravel =
      !userData?.travel || Object.keys(userData.travel || {}).length === 0;
    const shouldLoadFunds =
      !Array.isArray(userData?.funds) || userData.funds.length === 0;

    const loadMissingData = async () => {
      try {
        if (!shouldLoadTravel && !shouldLoadFunds) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        const userId = passport?.id || passport?.userId;
        if (!userId) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setIsLoading(true);
          setLoadError(null);
        }

        await UserDataService.initialize(userId);

        if (shouldLoadTravel && destinationId) {
          const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);
          if (isMounted) {
            setLoadedTravelData(travelInfo);
          }
        }

        if (shouldLoadFunds) {
          const fundsInfo = await UserDataService.getFundItems(userId);
          if (isMounted) {
            setLoadedFundsData(fundsInfo);
          }
        }
      } catch (error) {
        console.error('Failed to load preview data:', error);
        if (isMounted) {
          setLoadError(error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMissingData();

    return () => {
      isMounted = false;
    };
  }, [
    passport?.id,
    passport?.userId,
    destinationId,
    userData?.travel,
    userData?.funds,
  ]);

  const entryPack = useMemo(() => {
    const basePassport =
      userData?.passport || passport || entryPackData?.passport || {};
    const travel =
      loadedTravelData ||
      userData?.travel ||
      entryPackData?.travel ||
      {};
    const funds =
      loadedFundsData ||
      userData?.funds ||
      entryPackData?.funds ||
      [];

    return {
      id: entryPackData?.id || 'preview',
      status: entryPackData?.status || 'preview',
      tdacSubmission: entryPackData?.tdacSubmission || null,
      personalInfo: userData?.personalInfo || entryPackData?.personalInfo || {},
      travel,
      funds,
      passport: basePassport,
      country: destinationId,
    };
  }, [
    entryPackData,
    loadedFundsData,
    loadedTravelData,
    passport,
    userData,
    destinationId,
  ]);

  const isOfficialPack = useMemo(() => {
    const submission = entryPack?.tdacSubmission;
    return Boolean(submission && submission.arrCardNo);
  }, [entryPack]);

  const { t, language } = useLocale();
  const fallbackLanguage = config?.i18n?.fallbackLanguage;

  const namespace = useMemo(() => {
    if (config?.i18n?.namespace) {
      return config.i18n.namespace;
    }
    if (config?.countryCode) {
      return `entryPackPreview.${config.countryCode}`;
    }
    return null;
  }, [config?.i18n?.namespace, config?.countryCode]);

  const resolveTranslationKey = useCallback(
    (key) => {
      if (!key) {
        return key;
      }
      if (!namespace) {
        return key;
      }
      return key.startsWith(namespace) ? key : `${namespace}.${key}`;
    },
    [namespace]
  );

  const resolveText = useCallback(
    (value, { preserveArray = false } = {}) => {
      if (value === null || value === undefined) {
        return preserveArray ? [] : null;
      }

      const resolveSingle = (input) => {
        if (input === null || input === undefined) {
          return null;
        }

        if (typeof input === 'string' || typeof input === 'number') {
          return String(input);
        }

        if (Array.isArray(input)) {
          const aggregated = [];
          input.forEach((item) => {
            const resolved = resolveSingle(item);
            if (Array.isArray(resolved)) {
              resolved.forEach((nested) => {
                if (nested !== null && nested !== undefined && nested !== '') {
                  aggregated.push(nested);
                }
              });
            } else if (resolved !== null && resolved !== undefined && resolved !== '') {
              aggregated.push(resolved);
            }
          });
          return aggregated;
        }

        if (typeof input === 'object') {
          const { key: providedKey, defaultValue, params, values, ...languageMap } = input;

          if (providedKey) {
            const translationKey = resolveTranslationKey(providedKey);
            return t(translationKey, { defaultValue, ...(params || {}) });
          }

          if (values && typeof values === 'object') {
            const languageCandidates = [
              language,
              typeof language === 'string' ? language.split('-')[0] : null,
              fallbackLanguage,
              'en',
              'zh-CN',
              'zh-TW',
            ].filter(Boolean);

            for (const langKey of languageCandidates) {
              if (typeof values[langKey] === 'string') {
                return values[langKey];
              }
            }

            if (defaultValue !== undefined) {
              return defaultValue;
            }
          }

          const languageCandidates = [
            language,
            typeof language === 'string' ? language.split('-')[0] : null,
            fallbackLanguage,
            'en',
            'zh-CN',
            'zh-TW',
          ].filter(Boolean);

          for (const langKey of languageCandidates) {
            if (typeof languageMap[langKey] === 'string') {
              return languageMap[langKey];
            }
          }

          if (defaultValue !== undefined) {
            return defaultValue;
          }
        }

        return null;
      };

      const result = resolveSingle(value);

      if (Array.isArray(result)) {
        return preserveArray ? result : result.join('\n');
      }

      if (preserveArray) {
        return result ? [result] : [];
      }

      return result;
    },
    [fallbackLanguage, language, resolveTranslationKey, t]
  );

  const scrollViewRef = useRef(null);

  const helpers = useMemo(
    () => ({
      scrollViewRef,
      scrollTo: ({ y = 0, animated = true } = {}) => {
        if (scrollViewRef.current?.scrollTo) {
          scrollViewRef.current.scrollTo({ y, animated });
        }
      },
      scrollToTop: (animated = true) => {
        if (scrollViewRef.current?.scrollTo) {
          scrollViewRef.current.scrollTo({ y: 0, animated });
        }
      },
    }),
    [scrollViewRef]
  );

  const handleActionPress = useCallback(
    (action) => {
      if (!action) {
        return;
      }

      if (typeof config?.hooks?.onActionPress === 'function') {
        try {
          config.hooks.onActionPress({
            action,
            navigation,
            passport,
            destination,
            entryPack,
            userData,
            entryPackData,
          });
        } catch (error) {
          console.error('EntryPackPreviewTemplate onActionPress hook failed:', error);
        }
      }

      if (typeof action.onPress === 'function') {
        action.onPress({
          navigation,
          passport,
          destination,
          entryPack,
          userData,
          entryPackData,
        });
        return;
      }

      if (action.type === 'navigate' && navigation?.navigate) {
        const params =
          typeof action.buildParams === 'function'
            ? action.buildParams({
                passport,
                destination,
                entryPack,
                userData,
                entryPackData,
              })
            : action.params;
        navigation.navigate(action.screen, params);
      }
    },
    [
      config,
      navigation,
      passport,
      destination,
      entryPack,
      userData,
      entryPackData,
    ]
  );

  const contextRef = useRef(null);

  const baseContext = useMemo(
    () => ({
      config,
      navigation,
      route,
      passport,
      destination,
      userData,
      entryPackData,
      entryPack,
      isOfficialPack,
      isLoading,
      loadError,
      handleActionPress,
      resolveText,
      language,
      namespace,
    }),
    [
      config,
      navigation,
      route,
      passport,
      destination,
      userData,
      entryPackData,
      entryPack,
      isOfficialPack,
      isLoading,
      loadError,
      handleActionPress,
      resolveText,
      language,
      namespace,
    ]
  );

  const renderComponent = useCallback(
    (slot, defaultRenderer) => {
      const OverrideComponent = config?.components?.[slot];
      if (OverrideComponent) {
        let element = null;
        try {
          element = <OverrideComponent />;
        } catch (error) {
          console.error(
            `EntryPackPreviewTemplate ${slot} component renderer failed:`,
            error
          );
        }
        if (element) {
          return element;
        }
      }
      return typeof defaultRenderer === 'function' ? defaultRenderer() : null;
    },
    [config]
  );

  const renderSlot = useCallback(
    (slot) => {
      const renderer = config?.slots?.[slot];
      if (typeof renderer === 'function') {
        try {
          return renderer();
        } catch (error) {
          console.error(
            `EntryPackPreviewTemplate ${slot} slot renderer failed:`,
            error
          );
          return null;
        }
      }
      return null;
    },
    [config]
  );

  const runHook = useCallback((hookName, extraPayload = {}) => {
    const ctx = contextRef.current;
    if (!ctx) {
      return;
    }
    const hook = ctx.config?.hooks?.[hookName];
    if (typeof hook === 'function') {
      try {
        hook({ ...ctx, ...extraPayload });
      } catch (error) {
        console.error(
          `EntryPackPreviewTemplate ${hookName} hook failed:`,
          error
        );
      }
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      ...baseContext,
      helpers,
      scrollViewRef,
      renderComponent,
      renderSlot,
      runHook,
    }),
    [baseContext, helpers, scrollViewRef, renderComponent, renderSlot, runHook]
  );

  contextRef.current = contextValue;

  useEffect(() => {
    runHook('onScreenMount');
  }, [runHook]);

  useEffect(() => {
    if (!isLoading) {
      runHook('onContentReady');
    }
  }, [isLoading, runHook]);

  return (
    <EntryPackPreviewTemplateContext.Provider value={contextValue}>
      <SafeAreaView style={styles.container}>{children}</SafeAreaView>
    </EntryPackPreviewTemplateContext.Provider>
  );
};

EntryPackPreviewTemplate.useTemplate = useEntryPackPreviewTemplate;

const EntryPackPreviewTemplateHeader = ({
  title,
  subtitle,
  onClose,
  rightComponent = null,
}) => {
  const { navigation, config, resolveText } = useEntryPackPreviewTemplate();

  const headerTitle =
    resolveText(title) ||
    resolveText(config?.header?.title) ||
    'Entry Pack Preview';
  const headerSubtitle =
    resolveText(subtitle) ||
    resolveText(config?.header?.subtitle) ||
    null;
  const closeIcon = resolveText(config?.header?.closeIcon) || '✕';

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
      return;
    }
    navigation?.goBack?.();
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>{closeIcon}</Text>
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        {headerSubtitle ? (
          <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
        ) : null}
      </View>
      <View style={styles.headerRight}>{rightComponent}</View>
    </View>
  );
};

const EntryPackPreviewTemplatePreviewBanner = () => {
  const { config, resolveText } = useEntryPackPreviewTemplate();
  const banner = config?.previewBanner;

  if (!banner) {
    return null;
  }

  const {
    icon,
    title,
    descriptions,
    description,
  } = banner;

  const resolvedIcon = resolveText(icon) || '👁️';
  const resolvedTitle = resolveText(title) || 'Preview Mode';
  const combinedDescriptions = descriptions !== undefined
    ? resolveText(descriptions, { preserveArray: true })
    : resolveText(description, { preserveArray: true });
  const descriptionLines = Array.isArray(combinedDescriptions) ? combinedDescriptions : [];

  return (
    <View style={styles.previewBanner}>
      <Text style={styles.previewIcon}>{resolvedIcon}</Text>
      <Text style={styles.previewTitle}>{resolvedTitle}</Text>
      {descriptionLines.map((text, index) => (
        <Text
          key={`banner-desc-${index}`}
          style={[
            styles.previewDescription,
            index === 0 ? styles.previewDescriptionPrimary : styles.previewDescriptionSecondary,
          ]}
        >
          {text}
        </Text>
      ))}
    </View>
  );
};

const EntryPackPreviewTemplateEntryPack = (props) => {
  const { entryPack } = useEntryPackPreviewTemplate();

  return (
    <View style={styles.entryPackContainer}>
      <EntryPackDisplay
        entryPack={entryPack}
        personalInfo={entryPack.personalInfo}
        travelInfo={entryPack.travel}
        funds={entryPack.funds || []}
        isModal={false}
        country={entryPack.country}
        {...props}
      />
    </View>
  );
};

const EntryPackPreviewTemplateActions = () => {
  const { config, handleActionPress, resolveText } = useEntryPackPreviewTemplate();
  const actions = config?.actions;

  if (!actions) {
    return null;
  }

  const buttons = [actions.primary, actions.secondary].filter(Boolean);
  if (!buttons.length) {
    return null;
  }

  return (
    <View style={styles.actionSection}>
      {buttons.map((action, index) => (
        <TouchableOpacity
          key={action.id || index}
          style={[
            styles.actionButton,
            index === 0 ? styles.primaryButton : styles.secondaryButton,
          ]}
          onPress={() => handleActionPress(action)}
        >
          <Text
            style={[
              styles.actionButtonText,
              index === 0 ? styles.primaryButtonText : styles.secondaryButtonText,
            ]}
          >
            {resolveText(action?.label) || action?.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const EntryPackPreviewTemplateInfoSection = () => {
  const { config, resolveText } = useEntryPackPreviewTemplate();
  const infoSection = config?.infoSection;

  if (!infoSection) {
    return null;
  }

  const { icon, items, text } = infoSection;
  const resolvedIcon = resolveText(icon) || '💡';

  const linesSource =
    Array.isArray(items) && items.length > 0
      ? items
      : text !== undefined
      ? text
      : [];

  const lines = resolveText(linesSource, { preserveArray: true });

  if (!lines.length) {
    return null;
  }

  return (
    <View style={styles.infoSection}>
      <Text style={styles.infoIcon}>{resolvedIcon}</Text>
      {lines.map((line, index) => (
        <Text
          key={`info-line-${index}`}
          style={styles.infoText}
        >
          {line}
        </Text>
      ))}
    </View>
  );
};

const EntryPackPreviewTemplateLoadingState = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

const EntryPackPreviewTemplateErrorState = () => {
  const { loadError, config, resolveText } = useEntryPackPreviewTemplate();

  if (!loadError) {
    return null;
  }

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>
        {resolveText(config?.errorState?.title) || 'Failed to load entry pack'}
      </Text>
      <Text style={styles.errorMessage}>
        {resolveText(config?.errorState?.message) || loadError.message}
      </Text>
    </View>
  );
};

const EntryPackPreviewTemplateAutoContent = () => {
  const { isLoading, renderComponent, renderSlot, helpers } = useEntryPackPreviewTemplate();
  const scrollViewRef = helpers?.scrollViewRef || null;

  if (isLoading) {
    return (
      <>
        {renderComponent('Header', () => <EntryPackPreviewTemplateHeader />)}
        {renderComponent('LoadingState', () => <EntryPackPreviewTemplateLoadingState />)}
      </>
    );
  }

  return (
    <>
      {renderComponent('Header', () => <EntryPackPreviewTemplateHeader />)}
      {renderSlot('afterHeader')}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderSlot('beforeContent')}
        {renderComponent('ErrorState', () => <EntryPackPreviewTemplateErrorState />)}
        {renderComponent('PreviewBanner', () => <EntryPackPreviewTemplatePreviewBanner />)}
        {renderComponent('EntryPack', () => <EntryPackPreviewTemplateEntryPack />)}
        {renderComponent('Actions', () => <EntryPackPreviewTemplateActions />)}
        {renderComponent('InfoSection', () => <EntryPackPreviewTemplateInfoSection />)}
        {renderSlot('afterContent')}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      {renderSlot('footer')}
    </>
  );
};

EntryPackPreviewTemplate.Header = EntryPackPreviewTemplateHeader;
EntryPackPreviewTemplate.PreviewBanner = EntryPackPreviewTemplatePreviewBanner;
EntryPackPreviewTemplate.EntryPack = EntryPackPreviewTemplateEntryPack;
EntryPackPreviewTemplate.Actions = EntryPackPreviewTemplateActions;
EntryPackPreviewTemplate.InfoSection = EntryPackPreviewTemplateInfoSection;
EntryPackPreviewTemplate.LoadingState = EntryPackPreviewTemplateLoadingState;
EntryPackPreviewTemplate.ErrorState = EntryPackPreviewTemplateErrorState;
EntryPackPreviewTemplate.AutoContent = EntryPackPreviewTemplateAutoContent;

export {
  EntryPackPreviewTemplateHeader,
  EntryPackPreviewTemplatePreviewBanner,
  EntryPackPreviewTemplateEntryPack,
  EntryPackPreviewTemplateActions,
  EntryPackPreviewTemplateInfoSection,
  EntryPackPreviewTemplateLoadingState,
  EntryPackPreviewTemplateErrorState,
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
    textAlign: 'center',
  },
  headerRight: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: spacing.xl,
  },
  previewBanner: {
    backgroundColor: '#E5F7EB',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0BD67B',
  },
  previewIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  previewTitle: {
    ...typography.h3,
    color: '#0B7A4B',
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  previewDescription: {
    ...typography.body2,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xs / 2,
  },
  previewDescriptionPrimary: {
    color: colors.text,
  },
  previewDescriptionSecondary: {
    color: colors.textSecondary,
  },
  entryPackContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  actionSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#0BD67B',
  },
  primaryButtonText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '700',
  },
  infoSection: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoIcon: {
    fontSize: 20,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.body2,
    color: colors.text,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#FFEAEA',
    borderWidth: 1,
    borderColor: '#F5A0A0',
  },
  errorTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: '#B71C1C',
    marginBottom: spacing.xs / 2,
  },
  errorMessage: {
    ...typography.caption,
    color: '#B71C1C',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
});

export default EntryPackPreviewTemplate;
