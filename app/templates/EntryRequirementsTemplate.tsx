// @ts-nocheck

/**
 * EntryRequirementsTemplate
 *
 * Reusable template for “Requirements” overview screens.
 * Based on Thailand requirements screen with configurable content.
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme';
import BackButton from '../components/BackButton';
import UserDataService from '../services/data/UserDataService';
import { useLocale } from '../i18n/LocaleContext';

const normalizeItems = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }
  return [];
};

const EntryRequirementsTemplate = ({ navigation, route, config }) => {
  const { t } = useLocale();
  const { passport: rawPassport, destination } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);

  const headerTitle = config?.headerTitleKey
    ? t(config.headerTitleKey, { defaultValue: config.headerTitleDefault })
    : config?.headerTitle || '';

  const backLabel = config?.backLabelKey
    ? t(config.backLabelKey, { defaultValue: config.backLabelDefault || t('common.back') })
    : config?.backLabel || t('common.back');

  const introTitle = config?.introTitleKey
    ? t(config.introTitleKey, { defaultValue: config.introTitleDefault })
    : config?.introTitle || '';

  const introSubtitle = config?.introSubtitleKey
    ? t(config.introSubtitleKey, { defaultValue: config.introSubtitleDefault })
    : config?.introSubtitle || '';

  const requirements = useMemo(() => {
    if (!Array.isArray(config?.requirements)) {
      return [];
    }
    return config.requirements.map((req) => ({
      key: req.key,
      title: req.titleKey
        ? t(req.titleKey, { defaultValue: req.titleDefault })
        : req.title || '',
      description: req.descriptionKey
        ? t(req.descriptionKey, { defaultValue: req.descriptionDefault })
        : req.description || '',
      details: normalizeItems(
        req.detailsKey
          ? t(req.detailsKey, { defaultValue: req.detailsDefault || [] })
          : req.details || []
      ),
    }));
  }, [config?.requirements, t]);

  const infoBoxTitle = config?.infoBox?.titleKey
    ? t(config.infoBox.titleKey, { defaultValue: config.infoBox.titleDefault })
    : config?.infoBox?.title || '';
  const infoBoxSubtitle = config?.infoBox?.subtitleKey
    ? t(config.infoBox.subtitleKey, { defaultValue: config.infoBox.subtitleDefault })
    : config?.infoBox?.subtitle || '';
  const infoBoxIcon = config?.infoBox?.icon || '📝';

  const handlePrimaryAction = () => {
    if (!config?.primaryAction?.screen) {
      return;
    }
    const params = typeof config.primaryAction.buildParams === 'function'
      ? config.primaryAction.buildParams({ passport, destination, routeParams: route.params })
      : { passport, destination };
    navigation.navigate(config.primaryAction.screen, params);
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
          {introTitle ? <Text style={styles.title}>{introTitle}</Text> : null}
          {introSubtitle ? <Text style={styles.subtitle}>{introSubtitle}</Text> : null}
        </View>

        <View style={styles.requirementsList}>
          {requirements.map((item) => (
            <View key={item.key} style={styles.requirementCard}>
              <View style={styles.requirementHeader}>
                <View style={styles.bulletContainer}>
                  <View style={styles.bullet} />
                </View>
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementTitle}>{item.title}</Text>
                  {item.description ? (
                    <Text style={styles.requirementDescription}>{item.description}</Text>
                  ) : null}
                </View>
              </View>
              {item.details.map((detail, index) => (
                <Text style={styles.requirementDetails} key={`${item.key}-${index}`}>
                  {detail}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {infoBoxTitle || infoBoxSubtitle ? (
          <View style={styles.statusSection}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>{infoBoxIcon}</Text>
              {infoBoxTitle ? <Text style={styles.infoText}>{infoBoxTitle}</Text> : null}
              {infoBoxSubtitle ? <Text style={styles.infoSubtext}>{infoBoxSubtitle}</Text> : null}
            </View>
          </View>
        ) : null}

        {config?.primaryAction?.screen ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.continueButton} onPress={handlePrimaryAction}>
              <Text style={styles.continueButtonText}>
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

EntryRequirementsTemplate.defaultProps = {
  config: {},
};

EntryRequirementsTemplate.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.object,
  }),
  config: PropTypes.shape({
    headerTitleKey: PropTypes.string,
    headerTitleDefault: PropTypes.string,
    headerTitle: PropTypes.string,
    backLabelKey: PropTypes.string,
    backLabelDefault: PropTypes.string,
    backLabel: PropTypes.string,
    introTitleKey: PropTypes.string,
    introTitleDefault: PropTypes.string,
    introTitle: PropTypes.string,
    introSubtitleKey: PropTypes.string,
    introSubtitleDefault: PropTypes.string,
    introSubtitle: PropTypes.string,
    requirements: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        titleKey: PropTypes.string,
        titleDefault: PropTypes.string,
        title: PropTypes.string,
        descriptionKey: PropTypes.string,
        descriptionDefault: PropTypes.string,
        description: PropTypes.string,
        detailsKey: PropTypes.string,
        detailsDefault: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
        details: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
      })
    ),
    infoBox: PropTypes.shape({
      icon: PropTypes.string,
      titleKey: PropTypes.string,
      titleDefault: PropTypes.string,
      title: PropTypes.string,
      subtitleKey: PropTypes.string,
      subtitleDefault: PropTypes.string,
      subtitle: PropTypes.string,
    }),
    primaryAction: PropTypes.shape({
      labelKey: PropTypes.string,
      labelDefault: PropTypes.string,
      label: PropTypes.string,
      screen: PropTypes.string,
      buildParams: PropTypes.func,
    }),
  }),
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
  },
  headerRight: {
    width: 40,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  requirementsList: {
    paddingHorizontal: spacing.md,
  },
  requirementCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requirementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  bulletContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  requirementContent: {
    flex: 1,
  },
  requirementTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  requirementDescription: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  requirementDetails: {
    ...typography.body2,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  statusSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  infoCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.4)',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoIcon: {
    fontSize: 28,
    marginBottom: spacing.xs / 2,
  },
  infoText: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  infoSubtext: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  continueButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '700',
  },
});

export default EntryRequirementsTemplate;
