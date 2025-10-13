// 出境通 - Hong Kong Requirements Screen (香港入境要求确认)
import React, { useMemo, useState } from 'react';
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

const HongKongRequirementsScreen = ({ navigation, route }) => {
  const { passport, destination } = route.params || {};
  const [requirements, setRequirements] = useState({
    validPassport: false,
    returnTicket: false,
    accommodation: false,
    sufficientFunds: false,
    healthDeclaration: false,
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
        title: t('hongkong.requirements.items.validPassport.title'),
        description: t('hongkong.requirements.items.validPassport.description'),
        details: t('hongkong.requirements.items.validPassport.details'),
      },
      {
        key: 'returnTicket',
        title: t('hongkong.requirements.items.returnTicket.title'),
        description: t('hongkong.requirements.items.returnTicket.description'),
        details: t('hongkong.requirements.items.returnTicket.details'),
      },
      {
        key: 'accommodation',
        title: t('hongkong.requirements.items.accommodation.title'),
        description: t('hongkong.requirements.items.accommodation.description'),
        details: t('hongkong.requirements.items.accommodation.details'),
      },
      {
        key: 'sufficientFunds',
        title: t('hongkong.requirements.items.sufficientFunds.title'),
        description: t('hongkong.requirements.items.sufficientFunds.description'),
        details: t('hongkong.requirements.items.sufficientFunds.details'),
      },
      {
        key: 'healthDeclaration',
        title: t('hongkong.requirements.items.healthDeclaration.title'),
        description: t('hongkong.requirements.items.healthDeclaration.description'),
        details: t('hongkong.requirements.items.healthDeclaration.details'),
      },
    ],
    [t]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('hongkong.requirements.headerTitle')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('hongkong.requirements.introTitle')}</Text>
          <Text style={styles.subtitle}>{t('hongkong.requirements.introSubtitle')}</Text>
        </View>

        <View style={styles.requirementsList}>
          {requirementItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.requirementCard}
              onPress={() => toggleRequirement(item.key)}
              activeOpacity={0.85}
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

        <View style={styles.statusSection}>
          {allChecked ? (
            <View style={styles.successCard}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successText}>
                {t('hongkong.requirements.status.success.title')}
              </Text>
              <Text style={styles.successSubtext}>
                {t('hongkong.requirements.status.success.subtitle')}
              </Text>
            </View>
          ) : (
            <View style={styles.warningCard}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                {t('hongkong.requirements.status.warning.title')}
              </Text>
              <Text style={styles.warningSubtext}>
                {t('hongkong.requirements.status.warning.subtitle')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !allChecked && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!allChecked}
          >
            <Text
              style={[
                styles.continueButtonText,
                !allChecked && styles.continueButtonTextDisabled,
              ]}
            >
              {t('hongkong.requirements.continueButton')}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 22,
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
    backgroundColor: '#E3F2FD',
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

export default HongKongRequirementsScreen;
