// 台湾电子入境卡引导页面
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

const TWArrivalGuideScreen = ({ navigation, route }) => {
  const { passport, destination, travelInfo } = route.params || {};
  const { t } = useLocale();

  const steps = useMemo(
    () =>
      t('taiwan.guide.steps', {
        returnObjects: true,
        defaultValue: [],
        passport,
        travelInfo,
      }),
    [t, passport, travelInfo]
  );

  const quickActions = useMemo(
    () =>
      t('taiwan.guide.quickActions.items', {
        returnObjects: true,
        defaultValue: [],
      }),
    [t]
  );

  const handleOpenWebView = () => {
    navigation.navigate('TWArrivalWebView', { passport, destination, travelInfo });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BackButton
            onPress={() => navigation.goBack()}
            label={t('common.back')}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>{t('taiwan.guide.headerTitle')}</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>🇹🇼</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>{t('taiwan.guide.banner.title')}</Text>
            <Text style={styles.bannerSubtitle}>{t('taiwan.guide.banner.subtitle')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('taiwan.guide.stepSectionTitle')}</Text>
          {steps.map((step, index) => (
            <View key={`tw-step-${index}`} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                </View>
              </View>
              <View style={styles.stepBody}>
                {step.details?.map((detail, detailIndex) => (
                  <Text key={`tw-step-${index}-detail-${detailIndex}`} style={styles.stepBullet}>
                    • {detail}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('taiwan.guide.quickActions.title')}</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action, index) => (
              <View key={`tw-action-${index}`} style={styles.quickActionCard}>
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionDescription}>{action.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleOpenWebView} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>
              {t('taiwan.guide.primaryCta')}
            </Text>
          </TouchableOpacity>
          <Text style={styles.buttonHint}>{t('taiwan.guide.ctaHint')}</Text>
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: '#E8EAF6',
  },
  bannerEmoji: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  bannerTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    ...typography.body2,
    color: '#283593',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  stepCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#C5CAE9',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A237E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '700',
  },
  stepTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  stepBody: {
    marginTop: spacing.md,
    paddingLeft: spacing.md + 36,
  },
  stepBullet: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#D1C4E9',
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  quickActionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1A237E',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
  },
  buttonHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});

export default TWArrivalGuideScreen;
