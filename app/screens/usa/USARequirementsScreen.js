// 入境通 - USA Requirements Screen
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
import UserDataService from '../../services/data/UserDataService';

const USARequirementsScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const { t } = useLocale();
  
  // For info screen, we show success status by default
  const allChecked = true;
  
  const handleContinue = () => {
    navigation.navigate('TravelInfo', { passport, destination });
  };

  const requirementItems = useMemo(() => [
    {
      key: 'validPassport',
      title: t('usa.requirements.items.validPassport.title'),
      description: t('usa.requirements.items.validPassport.description'),
      details: t('usa.requirements.items.validPassport.details')
    },
    {
      key: 'validVisa',
      title: t('usa.requirements.items.validVisa.title'),
      description: t('usa.requirements.items.validVisa.description'),
      details: t('usa.requirements.items.validVisa.details')
    },
    {
      key: 'returnTicket',
      title: t('usa.requirements.items.returnTicket.title'),
      description: t('usa.requirements.items.returnTicket.description'),
      details: t('usa.requirements.items.returnTicket.details')
    },
    {
      key: 'sufficientFunds',
      title: t('usa.requirements.items.sufficientFunds.title'),
      description: t('usa.requirements.items.sufficientFunds.description'),
      details: t('usa.requirements.items.sufficientFunds.details')
    },
    {
      key: 'accommodation',
      title: t('usa.requirements.items.accommodation.title'),
      description: t('usa.requirements.items.accommodation.description'),
      details: t('usa.requirements.items.accommodation.details')
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
        <Text style={styles.headerTitle}>{t('usa.requirements.headerTitle')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('usa.requirements.introTitle')}</Text>
          <Text style={styles.subtitle}>{t('usa.requirements.introSubtitle')}</Text>
        </View>

        {/* Requirements List */}
        <View style={styles.requirementsList}>
          {requirementItems.map((item, index) => (
            <View
              key={item.key}
              style={styles.requirementCard}
            >
              <View style={styles.requirementHeader}>
                <View style={styles.bulletContainer}>
                  <View style={styles.bullet} />
                </View>
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementTitle}>{item.title}</Text>
                  <Text style={styles.requirementDescription}>{item.description}</Text>
                </View>
              </View>
              <Text style={styles.requirementDetails}>{item.details}</Text>
            </View>
          ))}
        </View>

        {/* Status Message */}
        <View style={styles.statusSection}>
          {allChecked ? (
            <View style={styles.successCard}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successText}>{t('usa.requirements.status.success.title')}</Text>
              <Text style={styles.successSubtext}>{t('usa.requirements.status.success.subtitle')}</Text>
            </View>
          ) : (
            <View style={styles.warningCard}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>{t('usa.requirements.status.warning.title')}</Text>
              <Text style={styles.warningSubtext}>{t('usa.requirements.status.warning.subtitle')}</Text>
            </View>
          )}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>
              {t('usa.requirements.startButton')}
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
    marginLeft: 48,
  },
  statusSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#90CAF9',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.h4,
    color: '#1565C0',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoSubtext: {
    ...typography.body2,
    color: '#1976D2',
    marginTop: spacing.xs,
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
  continueButtonText: {
    ...typography.h3,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default USARequirementsScreen;
