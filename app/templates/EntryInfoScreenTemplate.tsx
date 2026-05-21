/**
 * EntryInfoScreenTemplate
 *
 * Reusable layout for country-specific "Entry Info" overview screens.
 * Config-driven via InfoScreenConfig.
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme';
import BackButton from '../components/BackButton';
import { useLocale } from '../i18n/LocaleContext';
import UserDataService from '../services/data/UserDataService';
import { InfoScreenConfig, InfoScreenSectionConfig } from '../config/destinations/types';

const DEFAULT_VARIANT = 'info';

interface VariantStyles {
  containerStyle: ViewStyle;
  textStyle: TextStyle;
}

type VariantMap = Record<string, VariantStyles>;

const cardVariants: VariantMap = {
  info: {
    containerStyle: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textStyle: {
      ...typography.body1,
      color: colors.text,
    },
  },
  warning: {
    containerStyle: {
      backgroundColor: '#FFF3E0',
      borderWidth: 2,
      borderColor: '#FF9800',
    },
    textStyle: {
      ...typography.body1,
      color: colors.text,
    },
  },
  highlight: {
    containerStyle: {
      backgroundColor: '#E3F2FD',
      borderWidth: 2,
      borderColor: '#2196F3',
    },
    textStyle: {
      ...typography.body1,
      color: colors.text,
    },
  },
};

interface ResolvedSection {
  key: string;
  title: string;
  items: string[];
  containerStyle: ViewStyle;
  textStyle: TextStyle;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeItems = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }
  return [];
};

interface EntryInfoScreenTemplateProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
  config: InfoScreenConfig;
}

const EntryInfoScreenTemplate = ({ navigation, route, config }: EntryInfoScreenTemplateProps) => {
  const { t } = useLocale();
  const { passport: rawPassport, destination } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);

  const headerTitle = config?.headerTitleKey
    ? t(config.headerTitleKey, { defaultValue: config.headerTitleDefault })
    : config?.headerTitle || '';

  const backLabel = config?.backLabelKey
    ? t(config.backLabelKey, { defaultValue: config.backLabelDefault || t('common.back') })
    : config?.backLabel || t('common.back');

  const titleText = config?.titleKey
    ? t(config.titleKey, { defaultValue: config.titleDefault })
    : config?.title || '';

  const subtitleText = config?.subtitleKey
    ? t(config.subtitleKey, { defaultValue: config.subtitleDefault })
    : config?.subtitle || '';

  const sections: ResolvedSection[] = useMemo(() => {
    if (!Array.isArray(config?.sections)) {
      return [];
    }

    return config.sections.map((section: InfoScreenSectionConfig) => {
      const title =
        section.titleKey
          ? t(section.titleKey, { defaultValue: section.titleDefault })
          : section.title || '';

      const items = normalizeItems(
        section.itemsKey
          ? t(section.itemsKey, { defaultValue: section.itemsDefault || [] })
          : section.items || []
      );

      const variant = section.variant || DEFAULT_VARIANT;
      const variantStyles = cardVariants[variant] || cardVariants[DEFAULT_VARIANT];

      return {
        key: section.key,
        title,
        items,
        containerStyle: variantStyles.containerStyle,
        textStyle: variantStyles.textStyle,
      };
    });
  }, [config?.sections, t]);

  const handlePrimaryAction = () => {
    if (!config?.primaryAction?.screen) {
      return;
    }

    const params = typeof config.primaryAction.buildParams === 'function'
      ? config.primaryAction.buildParams({ passport, destination, routeParams: route.params })
      : { passport, destination };

    navigation.navigate(config.primaryAction.screen as string, params);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={backLabel}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          {config?.flag ? <Text style={styles.flag}>{config.flag}</Text> : null}
          {titleText ? <Text style={styles.title}>{titleText}</Text> : null}
          {subtitleText ? <Text style={styles.subtitle}>{subtitleText}</Text> : null}
        </View>

        {sections.map((section: ResolvedSection) => (
          <View key={section.key} style={styles.section}>
            {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}
            <View style={[styles.cardBase, section.containerStyle]}>
              {section.items.map((item: string, index: number) => (
                <Text style={[styles.textBase, section.textStyle]} key={`${section.key}-${index}`}>
                  {item}
                </Text>
              ))}
            </View>
          </View>
        ))}

        {config?.primaryAction?.screen ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handlePrimaryAction}>
              <Text style={styles.primaryButtonText}>
                {config.primaryAction.labelKey
                  ? t(config.primaryAction.labelKey, { defaultValue: config.primaryAction.labelDefault })
                  : config.primaryAction.label || ''}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  backButton: { marginLeft: -spacing.sm },
  headerTitle: { ...typography.body2, fontWeight: '600', color: colors.text },
  headerRight: { width: 40 },
  titleSection: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.md },
  flag: { fontSize: 64, marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.primary, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.body1, color: colors.textSecondary, textAlign: 'center' },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.primary, marginBottom: spacing.md, fontWeight: 'bold' },
  cardBase: { padding: spacing.lg, borderRadius: 12 },
  textBase: { ...typography.body1, color: colors.text, marginBottom: spacing.sm, lineHeight: 24 },
  buttonContainer: { paddingHorizontal: spacing.md, marginTop: spacing.lg },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { ...typography.h3, color: colors.white, fontWeight: 'bold' },
});

export default EntryInfoScreenTemplate;
