/**
 * EntryRequirementsTemplate
 *
 * Reusable template for "Requirements" overview screens.
 * Config-driven via RequirementsScreenConfig.
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
import UserDataService from '../services/data/UserDataService';
import { useLocale } from '../i18n/LocaleContext';
import { RequirementsScreenConfig } from '../config/destinations/types';

const normalizeItems = (value: unknown): string[] => {
  if (Array.isArray(value) && value.every((v: unknown) => typeof v === 'string')) {
    return value as string[];
  }
  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }
  return [];
};

interface EntryRequirementsRouteParams {
  passport: unknown;
  destination: unknown;
  [key: string]: unknown;
}

interface EntryRequirementsTemplateProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  route: { params?: EntryRequirementsRouteParams; [key: string]: unknown };
  config: RequirementsScreenConfig;
}

const EntryRequirementsTemplate = ({ navigation, route, config }: EntryRequirementsTemplateProps) => {
  const { t } = useLocale();
  const routeParams = route.params || {};
  const { passport: rawPassport, destination } = routeParams as EntryRequirementsRouteParams;
  const passport = UserDataService.toSerializablePassport(rawPassport as Parameters<typeof UserDataService.toSerializablePassport>[0]);

  const headerTitle: string = config?.headerTitleKey
    ? t(config.headerTitleKey, { defaultValue: config.headerTitleDefault as string | undefined })
    : (config?.headerTitle as string) || '';

  const backLabel: string = config?.backLabelKey
    ? t(config.backLabelKey as string, { defaultValue: (config.backLabelDefault as string) || t('common.back') })
    : (config?.backLabel as string) || t('common.back');

  const introTitle: string = config?.introTitleKey
    ? t(config.introTitleKey, { defaultValue: config.introTitleDefault as string | undefined })
    : (config?.introTitle as string) || '';

  const introSubtitle: string = config?.introSubtitleKey
    ? t(config.introSubtitleKey, { defaultValue: config.introSubtitleDefault as string | undefined })
    : (config?.introSubtitle as string) || '';

  interface ResolvedRequirement {
    key: string;
    title: string;
    description: string;
    details: string[];
  }

  const requirements: ResolvedRequirement[] = useMemo(() => {
    if (!Array.isArray(config?.requirements)) {
      return [];
    }
    return config.requirements.map((req: { key: string; titleKey?: string; titleDefault?: string; title?: string; descriptionKey?: string; descriptionDefault?: string; description?: string; detailsKey?: string; detailsDefault?: string | string[]; details?: string | string[]; [key: string]: unknown }) => ({
      key: req.key,
      title: req.titleKey
        ? t(req.titleKey, { defaultValue: req.titleDefault })
        : req.title || '',
      description: req.descriptionKey
        ? t(req.descriptionKey, { defaultValue: req.descriptionDefault })
        : req.description || '',
      details: normalizeItems(
        req.detailsKey != null
          ? t(req.detailsKey, { defaultValue: (Array.isArray(req.detailsDefault) ? req.detailsDefault.join('\n') : (req.detailsDefault as string | undefined)) || '' })
          : (req.details || []) as string | string[]
      ),
    }));
  }, [config?.requirements, t]);

  const infoBoxTitle: string = config?.infoBox?.titleKey
    ? t(config.infoBox.titleKey as string, { defaultValue: config.infoBox.titleDefault as string })
    : (config?.infoBox?.title as string) || '';
  const infoBoxSubtitle: string = config?.infoBox?.subtitleKey
    ? t(config.infoBox.subtitleKey as string, { defaultValue: config.infoBox.subtitleDefault as string })
    : (config?.infoBox?.subtitle as string) || '';
  const infoBoxIcon: string = (config?.infoBox?.icon as string) || '📝';

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
        />
        <Text style={styles.headerTitle as unknown as TextStyle}>{headerTitle}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection as unknown as ViewStyle}>
          <Text style={styles.title as unknown as TextStyle}>{introTitle}</Text>
          <Text style={styles.subtitle as unknown as TextStyle}>{introSubtitle}</Text>
        </View>

        <View style={styles.requirementsList}>
          {requirements.map((item) => (
            <View key={item.key} style={styles.requirementCard as unknown as ViewStyle}>
              <View style={styles.requirementHeader}>
                <View style={styles.bulletContainer}>
                  <View style={styles.bullet} />
                </View>
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementTitle as unknown as TextStyle}>{item.title}</Text>
                  <Text style={styles.requirementDescription as unknown as TextStyle}>{item.description}</Text>
                </View>
              </View>
              {item.details.map((detail, idx) => (
                <Text key={idx} style={styles.requirementDetails as unknown as TextStyle}>
                  {detail}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.statusSection}>
          <View style={styles.infoCard as unknown as ViewStyle}>
            <Text style={styles.infoIcon as unknown as TextStyle}>{infoBoxIcon}</Text>
            <Text style={styles.infoText as unknown as TextStyle}>{infoBoxTitle}</Text>
            <Text style={styles.infoSubtext as unknown as TextStyle}>{infoBoxSubtitle}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.continueButton as unknown as ViewStyle} onPress={handlePrimaryAction}>
            <Text style={styles.continueButtonText as unknown as TextStyle}>
              {(config?.primaryAction?.labelKey
                ? t(config.primaryAction.labelKey, { defaultValue: config.primaryAction.labelDefault as string | undefined })
                : config?.primaryAction?.label || t('common.continue', { defaultValue: 'Continue' })) as string}
            </Text>
          </TouchableOpacity>
        </View>

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
  } as ViewStyle,
  headerTitle: { ...typography.body2, fontWeight: '600', color: colors.text },
  headerRight: { width: 40 },
  titleSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  } as ViewStyle,
  title: { ...typography.h3, color: colors.primary, marginBottom: spacing.xs, textAlign: 'center', fontWeight: 'bold' },
  subtitle: { ...typography.body1, color: colors.textSecondary, textAlign: 'center' },
  requirementsList: { paddingHorizontal: spacing.md },
  requirementCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  } as ViewStyle,
  requirementHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  bulletContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  requirementContent: { flex: 1 },
  requirementTitle: { ...typography.body1, fontWeight: '700', color: colors.text, marginBottom: spacing.xs / 2 },
  requirementDescription: { ...typography.body2, color: colors.textSecondary },
  requirementDetails: { ...typography.body2, color: colors.text, lineHeight: 22, marginBottom: spacing.xs },
  statusSection: { paddingHorizontal: spacing.md, marginTop: spacing.lg },
  infoCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.4)',
    alignItems: 'center',
    gap: spacing.xs,
  } as ViewStyle,
  infoIcon: { fontSize: 28, marginBottom: spacing.xs / 2 },
  infoText: { ...typography.body1, fontWeight: '700', color: colors.text, textAlign: 'center' },
  infoSubtext: { ...typography.body2, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  buttonContainer: { paddingHorizontal: spacing.md, marginTop: spacing.lg },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  } as ViewStyle,
  continueButtonText: { ...typography.body1, color: colors.white, fontWeight: '700' },
});

export default EntryRequirementsTemplate;
