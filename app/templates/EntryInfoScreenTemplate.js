/**
 * EntryInfoScreenTemplate
 *
 * Reusable layout for country-specific “Entry Info” overview screens.
 * Extracted from Thailand/Vietnam info screens to reduce duplication.
 *
 * Usage:
 *  <EntryInfoScreenTemplate
 *    config={vietnamInfoScreenConfig}
 *    navigation={navigation}
 *    route={route}
 *  />
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
import { useLocale } from '../i18n/LocaleContext';
import UserDataService from '../services/data/UserDataService';

const DEFAULT_VARIANT = 'info';

const cardVariants = {
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

const normalizeItems = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }
  return [];
};

const EntryInfoScreenTemplate = ({ navigation, route, config }) => {
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

  const sections = useMemo(() => {
    if (!Array.isArray(config?.sections)) {
      return [];
    }

    return config.sections.map((section) => {
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
      : {
          passport,
          destination,
        };

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
          {config?.flag ? <Text style={styles.flag}>{config.flag}</Text> : null}
          {titleText ? <Text style={styles.title}>{titleText}</Text> : null}
          {subtitleText ? <Text style={styles.subtitle}>{subtitleText}</Text> : null}
        </View>

        {sections.map((section) => (
          <View key={section.key} style={styles.section}>
            {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}
            <View style={[styles.cardBase, section.containerStyle]}>
              {section.items.map((item, index) => (
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

EntryInfoScreenTemplate.defaultProps = {
  config: {},
};

EntryInfoScreenTemplate.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.object,
  }),
  config: PropTypes.shape({
    flag: PropTypes.string,
    headerTitleKey: PropTypes.string,
    headerTitleDefault: PropTypes.string,
    headerTitle: PropTypes.string,
    backLabelKey: PropTypes.string,
    backLabelDefault: PropTypes.string,
    backLabel: PropTypes.string,
    titleKey: PropTypes.string,
    titleDefault: PropTypes.string,
    title: PropTypes.string,
    subtitleKey: PropTypes.string,
    subtitleDefault: PropTypes.string,
    subtitle: PropTypes.string,
    sections: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        titleKey: PropTypes.string,
        titleDefault: PropTypes.string,
        title: PropTypes.string,
        itemsKey: PropTypes.string,
        itemsDefault: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
        items: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
        variant: PropTypes.string,
      })
    ),
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
  flag: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  cardBase: {
    padding: spacing.lg,
    borderRadius: 12,
  },
  textBase: {
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '700',
  },
});

export default EntryInfoScreenTemplate;
