// 出境通 - Japan Requirements Screen (日本入境要求)
import React, { useState, useMemo } from 'react';
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

const JapanRequirementsScreen = ({ navigation, route }) => {
  const { passport, destination } = route.params || {};
  const { t } = useLocale();
  const [requirements, setRequirements] = useState({
    validVisa: false,
    validPassport: false,
    returnTicket: false,
    sufficientFunds: false,
    accommodation: false,
  });

  const allChecked = Object.values(requirements).every(Boolean);

  const toggleRequirement = (key) => {
    setRequirements(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleContinue = () => {
    if (allChecked) {
      navigation.navigate('JapanProcedures', { passport, destination });
    }
  };

  const requirementItems = useMemo(() => [
    {
      key: 'validVisa',
      title: t('japan.requirements.items.validVisa.title'),
      description: t('japan.requirements.items.validVisa.description'),
      details: t('japan.requirements.items.validVisa.details')
    },
    {
      key: 'validPassport',
      title: t('japan.requirements.items.validPassport.title'),
      description: t('japan.requirements.items.validPassport.description'),
      details: t('japan.requirements.items.validPassport.details')
    },
    {
      key: 'returnTicket',
      title: t('japan.requirements.items.returnTicket.title'),
      description: t('japan.requirements.items.returnTicket.description'),
      details: t('japan.requirements.items.returnTicket.details')
    },
    {
      key: 'sufficientFunds',
      title: t('japan.requirements.items.sufficientFunds.title'),
      description: t('japan.requirements.items.sufficientFunds.description'),
      details: t('japan.requirements.items.sufficientFunds.details')
    },
    {
      key: 'accommodation',
      title: t('japan.requirements.items.accommodation.title'),
      description: t('japan.requirements.items.accommodation.description'),
      details: t('japan.requirements.items.accommodation.details')
    },
  ], [t]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('japan.requirements.headerTitle')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('japan.requirements.introTitle')}</Text>
          <Text style={styles.subtitle}>{t('japan.requirements.introSubtitle')}</Text>
        </View>

        {/* Requirements List */}
        <View style={styles.requirementsList}>
          {requirementItems.map((item, index) => (
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
              <Text style={styles.successText}>{t('japan.requirements.status.success.title')}</Text>
              <Text style={styles.successSubtext}>{t('japan.requirements.status.success.subtitle')}</Text>
            </View>
          ) : (
            <View style={styles.warningCard}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>{t('japan.requirements.status.warning.title')}</Text>
              <Text style={styles.warningSubtext}>{t('japan.requirements.status.warning.subtitle')}</Text>
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
            <Text style={[styles.continueButtonText, !allChecked && styles.continueButtonTextDisabled]}>
              {t('japan.requirements.continueButton')}
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
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  requirementDescription: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  requirementDetails: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: 48, // Align with content
  },
  statusSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  successCard: {
    backgroundColor: '#E8F5E8',
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  successIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  successText: {
    ...typography.h3,
    color: '#2E7D32',
    marginBottom: spacing.xs,
    fontWeight: 'bold',
  },
  successSubtext: {
    ...typography.body1,
    color: '#2E7D32',
    textAlign: 'center',
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  warningIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  warningText: {
    ...typography.h3,
    color: '#E65100',
    marginBottom: spacing.xs,
    fontWeight: 'bold',
  },
  warningSubtext: {
    ...typography.body1,
    color: '#E65100',
    textAlign: 'center',
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

export default JapanRequirementsScreen;
