// 入境通 - USA Info Screen
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import BackButton from '../../components/BackButton';
import { useLocale } from '../../i18n/LocaleContext';
import PassportDataService from '../../services/data/PassportDataService';

const USAInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const passport = PassportDataService.toSerializablePassport(rawPassport);
  const { t } = useLocale();

  const handleContinue = () => {
    navigation.navigate('USARequirements', { passport, destination });
  };

  const visaItems = useMemo(() => 
    t('usa.info.sections.visa.items', { defaultValue: [] })
  , [t]);

  const importantItems = useMemo(() => 
    t('usa.info.sections.important.items', { defaultValue: [] })
  , [t]);

  const appFeaturesItems = useMemo(() => 
    t('usa.info.sections.appFeatures.items', { defaultValue: [] })
  , [t]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('usa.info.headerTitle')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('usa.info.title')}</Text>
          <Text style={styles.subtitle}>{t('usa.info.subtitle')}</Text>
        </View>

        {/* Visa Requirements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('usa.info.sections.visa.title')}</Text>
          </View>
          <View style={styles.card}>
            {visaItems.map((item, index) => (
              <Text key={index} style={styles.cardText}>{item}</Text>
            ))}
          </View>
        </View>

        {/* Important Reminders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('usa.info.sections.important.title')}</Text>
          </View>
          <View style={styles.card}>
            {importantItems.map((item, index) => (
              <Text key={index} style={styles.cardText}>{item}</Text>
            ))}
          </View>
        </View>

        {/* App Features */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('usa.info.sections.appFeatures.title')}</Text>
          </View>
          <View style={[styles.card, styles.appFeaturesCard]}>
            {appFeaturesItems.map((item, index) => (
              <Text key={index} style={styles.cardText}>{item}</Text>
            ))}
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>{t('usa.info.continueButton')}</Text>
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
  title: {
    ...typography.h2,
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
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appFeaturesCard: {
    backgroundColor: '#F0F9FF',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cardText: {
    ...typography.body1,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.sm,
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

export default USAInfoScreen;
