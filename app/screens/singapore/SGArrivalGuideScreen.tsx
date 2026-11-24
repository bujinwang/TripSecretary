// 新加坡 SG Arrival Card 引导页面
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../components/BackButton';
import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import UserDataService from '../../services/data/UserDataService';
import type { RootStackScreenProps } from '../../types/navigation';
import type { SerializablePassport } from '../../types/data';

type SGArrivalGuideProps = RootStackScreenProps<'SGArrivalGuide'>;

const SGArrivalGuideScreen: React.FC<SGArrivalGuideProps> = ({ navigation, route }) => {
  const {
    passport: rawPassport,
    destination = null,
    travelInfo = null,
  } = route.params ?? {};
  const passport = UserDataService.toSerializablePassport(rawPassport ?? null) as SerializablePassport | null;
  const { t } = useLocale();

  const steps = useMemo(
    () =>
      (t('singapore.guide.steps', {
        returnObjects: true,
        defaultValue: [],
        passport,
        travelInfo,
      } as unknown as Record<string, string | number | undefined>) as unknown as Record<string, unknown>[]),
    [t, passport, travelInfo]
  );

  const quickActions = useMemo(
    () =>
      (t('singapore.guide.quickActions.items', {
        returnObjects: true,
        defaultValue: [],
      } as unknown as Record<string, string | number | undefined>) as unknown as Record<string, unknown>[]),
    [t]
  );

  const handleOpenWebView = () => {
    navigation.navigate('SGArrivalWebView', { passport, destination, travelInfo });
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
          <Text style={styles.headerTitle}>{t('singapore.guide.headerTitle')}</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>🇸🇬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>{t('singapore.guide.banner.title')}</Text>
            <Text style={styles.bannerSubtitle}>{t('singapore.guide.banner.subtitle')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('singapore.guide.stepSectionTitle')}</Text>
          {steps.map((step, index: number) => {
            const s = step as Record<string, unknown>;
            return (
            <View key={`sg-step-${index}`} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{s.title as string}</Text>
                  <Text style={styles.stepSubtitle}>{s.subtitle as string}</Text>
                </View>
              </View>
              <View style={styles.stepBody}>
                {(s.details as string[] | undefined)?.map((detail: string, detailIndex: number) => (
                  <Text key={`sg-step-${index}-detail-${detailIndex}`} style={styles.stepBullet}>
                    • {detail}
                  </Text>
                ))}
              </View>
            </View>
          )})}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('singapore.guide.quickActions.title')}</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action, index: number) => {
              const a = action as Record<string, unknown>;
              return (
              <View key={`sg-action-${index}`} style={styles.quickActionCard}>
                <Text style={styles.quickActionIcon}>{a.icon as string}</Text>
                <Text style={styles.quickActionTitle}>{a.title as string}</Text>
                <Text style={styles.quickActionDescription}>{a.description as string}</Text>
              </View>
            )})}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleOpenWebView} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>
              {t('singapore.guide.primaryCta')}
            </Text>
          </TouchableOpacity>
          <Text style={styles.buttonHint}>{t('singapore.guide.ctaHint')}</Text>
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
    backgroundColor: '#E0F2F1',
  },
  bannerEmoji: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  bannerTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: '#00695C',
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    ...typography.body2,
    color: '#004D40',
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
    borderColor: '#C8E6C9',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00695C',
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
    borderColor: '#B2DFDB',
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
    backgroundColor: '#00695C',
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

export default SGArrivalGuideScreen;
