// 出境通 - Malaysia Info Screen (马来西亚入境信息)
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import BackButton from '../../components/BackButton';
import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';

const MalaysiaInfoScreen = ({ navigation, route }) => {
  const { passport, destination } = route.params || {};
  const { t } = useLocale();

  const handleContinue = () => {
    navigation.navigate('MalaysiaRequirements', { passport, destination });
  };

  const normalizeItems = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.length > 0) {
      return [value];
    }
    return [];
  };

  const infoSections = useMemo(
    () => [
      {
        key: 'visa',
        title: t('malaysia.info.sections.visa.title'),
        items: normalizeItems(t('malaysia.info.sections.visa.items', { defaultValue: [] })),
        cardStyle: styles.infoCard,
        textStyle: styles.infoText,
      },
      {
        key: 'onsite',
        title: t('malaysia.info.sections.onsite.title'),
        items: normalizeItems(t('malaysia.info.sections.onsite.items', { defaultValue: [] })),
        cardStyle: styles.warningCard,
        textStyle: styles.warningText,
      },
      {
        key: 'appFeatures',
        title: t('malaysia.info.sections.appFeatures.title'),
        items: normalizeItems(t('malaysia.info.sections.appFeatures.items', { defaultValue: [] })),
        cardStyle: styles.appFeaturesCard,
        textStyle: styles.appFeaturesText,
      },
    ],
    [t]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('malaysia.info.headerTitle')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇲🇾</Text>
          <Text style={styles.title}>{t('malaysia.info.title')}</Text>
          <Text style={styles.subtitle}>{t('malaysia.info.subtitle')}</Text>
        </View>

        {infoSections.map((section) => (
          <View key={section.key} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={section.cardStyle}>
              {section.items.map((item, index) => (
                <Text style={section.textStyle} key={`${section.key}-${index}`}>
                  {item}
                </Text>
              ))}
            </View>
          </View>
        ))}

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>
              {t('malaysia.info.continueButton')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
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
  infoCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  warningCard: {
    backgroundColor: '#E8F4FF',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  warningText: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  appFeaturesCard: {
    backgroundColor: '#F0F9FF',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  appFeaturesText: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    ...typography.h3,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default MalaysiaInfoScreen;
