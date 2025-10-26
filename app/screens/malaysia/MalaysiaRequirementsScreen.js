// 入境通 - Malaysia Requirements Screen (马来西亚入境要求确认)
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
import UserDataService from '../../services/data/UserDataService';

const MalaysiaRequirementsScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const { t } = useLocale();
  
  // For info screen, we show success status by default
  const allChecked = true;

  const handleContinue = () => {
    navigation.navigate('MalaysiaTravelInfo', { passport, destination });
  };

  const requirementItems = useMemo(
    () => [
      {
        key: 'validPassport',
        title: t('malaysia.requirements.items.validPassport.title'),
        description: t('malaysia.requirements.items.validPassport.description'),
        details: t('malaysia.requirements.items.validPassport.details'),
      },
      {
        key: 'returnTicket',
        title: t('malaysia.requirements.items.returnTicket.title'),
        description: t('malaysia.requirements.items.returnTicket.description'),
        details: t('malaysia.requirements.items.returnTicket.details'),
      },
      {
        key: 'accommodation',
        title: t('malaysia.requirements.items.accommodation.title'),
        description: t('malaysia.requirements.items.accommodation.description'),
        details: t('malaysia.requirements.items.accommodation.details'),
      },
      {
        key: 'sufficientFunds',
        title: t('malaysia.requirements.items.sufficientFunds.title'),
        description: t('malaysia.requirements.items.sufficientFunds.description'),
        details: t('malaysia.requirements.items.sufficientFunds.details'),
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
        <Text style={styles.headerTitle}>{t('malaysia.requirements.headerTitle')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('malaysia.requirements.introTitle')}</Text>
          <Text style={styles.subtitle}>{t('malaysia.requirements.introSubtitle')}</Text>
        </View>

        {/* Requirements List */}
        <View style={styles.requirementsList}>
          {requirementItems.map((item) => (
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
              <Text style={styles.successText}>
                {t('malaysia.requirements.status.success.title')}
              </Text>
              <Text style={styles.successSubtext}>
                {t('malaysia.requirements.status.success.subtitle')}
              </Text>
            </View>
          ) : (
            <View style={styles.warningCard}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                {t('malaysia.requirements.status.warning.title')}
              </Text>
              <Text style={styles.warningSubtext}>
                {t('malaysia.requirements.status.warning.subtitle')}
              </Text>
            </View>
          )}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <Text style={styles.continueButtonText}>
              {t('malaysia.requirements.startButton')}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
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
    borderColor: '#81C784',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  successText: {
    ...typography.h3,
    color: '#2E7D32',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successSubtext: {
    ...typography.body1,
    color: '#388E3C',
    textAlign: 'center',
    lineHeight: 22,
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#FFB74D',
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  warningText: {
    ...typography.h3,
    color: '#E65100',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  warningSubtext: {
    ...typography.body1,
    color: '#F57C00',
    textAlign: 'center',
    lineHeight: 22,
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

export default MalaysiaRequirementsScreen;
