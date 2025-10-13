// 出境通 - Thailand Requirements Screen (泰国入境要求确认)
import React, { useMemo, useState } from 'react';
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

const ThailandRequirementsScreen = ({ navigation, route }) => {
  const { passport, destination } = route.params || {};
  const [requirements, setRequirements] = useState({
    validPassport: false,
    onwardTicket: false,
    accommodation: false,
    funds: false,
    healthCheck: false,
  });
  const { t } = useLocale();

  const allChecked = Object.values(requirements).every(Boolean);

  const toggleRequirement = (key) => {
    setRequirements((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleContinue = () => {
    if (allChecked) {
      navigation.navigate('TravelInfo', { passport, destination });
    }
  };

  const requirementItems = useMemo(
    () => [
      {
        key: 'validPassport',
        title: t('thailand.requirements.items.validPassport.title'),
        description: t('thailand.requirements.items.validPassport.description'),
        details: t('thailand.requirements.items.validPassport.details'),
      },
      {
        key: 'onwardTicket',
        title: t('thailand.requirements.items.onwardTicket.title'),
        description: t('thailand.requirements.items.onwardTicket.description'),
        details: t('thailand.requirements.items.onwardTicket.details'),
      },
      {
        key: 'accommodation',
        title: t('thailand.requirements.items.accommodation.title'),
        description: t('thailand.requirements.items.accommodation.description'),
        details: t('thailand.requirements.items.accommodation.details'),
      },
      {
        key: 'funds',
        title: t('thailand.requirements.items.funds.title'),
        description: t('thailand.requirements.items.funds.description'),
        details: t('thailand.requirements.items.funds.details'),
      },
      {
        key: 'healthCheck',
        title: t('thailand.requirements.items.healthCheck.title'),
        description: t('thailand.requirements.items.healthCheck.description'),
        details: t('thailand.requirements.items.healthCheck.details'),
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
        <Text style={styles.headerTitle}>{t('thailand.requirements.headerTitle')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('thailand.requirements.introTitle')}</Text>
          <Text style={styles.subtitle}>{t('thailand.requirements.introSubtitle')}</Text>
        </View>

        {/* Requirements List */}
        <View style={styles.requirementsList}>
          {requirementItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.requirementCard}
              onPress={() => toggleRequirement(item.key)}
            >
              <View style={styles.requirementHeader}>
                <View style={styles.checkboxContainer}>
                  <Text style={styles.checkbox}>
                    {requirements[item.key] ? '✓' : '○'}
                  </Text>
                </View>
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementTitle}>{item.title}</Text>
                  <Text style={styles.requirementDescription}>{item.description}</Text>
                </View>
              </View>
              <Text style={styles.requirementDetails}>{item.details}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Status Message */}
        <View style={styles.statusSection}>
          {allChecked ? (
            <View style={styles.successCard}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successText}>
                {t('thailand.requirements.status.success.title')}
              </Text>
              <Text style={styles.successSubtext}>
                {t('thailand.requirements.status.success.subtitle')}
              </Text>
            </View>
          ) : (
            <View style={styles.warningCard}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                {t('thailand.requirements.status.warning.title')}
              </Text>
              <Text style={styles.warningSubtext}>
                {t('thailand.requirements.status.warning.subtitle')}
              </Text>
            </View>
          )}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.continueButton, !allChecked && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!allChecked}
          >
            <Text
              style={[styles.continueButtonText, !allChecked && styles.continueButtonTextDisabled]}
            >
              {t('thailand.requirements.continueButton')}
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
  checkboxContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkbox: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
  requirementContent: {
    flex: 1,
  },
  requirementTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  requirementDescription: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  requirementDetails: {
    ...typography.body2,
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  statusSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  successCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  successText: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '600',
  },
  successSubtext: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#FFCC80',
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  warningText: {
    ...typography.h4,
    color: '#EF6C00',
    fontWeight: '600',
  },
  warningSubtext: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
  continueButtonDisabled: {
    backgroundColor: colors.border,
  },
  continueButtonText: {
    ...typography.h3,
    color: colors.white,
    fontWeight: 'bold',
  },
  continueButtonTextDisabled: {
    color: colors.textSecondary,
  },
});

export default ThailandRequirementsScreen;
