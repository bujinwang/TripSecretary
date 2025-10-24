// 台湾入境卡提交方式选择
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import BackButton from '../../components/BackButton';
import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import UserDataService from '../../services/data/UserDataService';

const TWArrivalSelectionScreen = ({ navigation, route }) => {
  const params = route.params || {};
  const { passport: rawPassport, destination, travelInfo } = params;
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const { t } = useLocale();

  const goToGuide = () => {
    navigation.navigate('TWArrivalGuide', { passport, destination, travelInfo });
  };

  const goToWebView = () => {
    navigation.navigate('TWArrivalWebView', { passport, destination, travelInfo });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('taiwan.selection.headerTitle')}</Text>
          <Text style={styles.headerSubtitle}>{t('taiwan.selection.headerSubtitle')}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <TouchableOpacity style={[styles.card, styles.recommendedCard]} onPress={goToGuide} activeOpacity={0.9}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('taiwan.selection.recommendedBadge')}</Text>
        </View>
        <Text style={styles.cardTitle}>{t('taiwan.selection.smartFlow.title')}</Text>
        <Text style={styles.cardSubtitle}>{t('taiwan.selection.smartFlow.subtitle')}</Text>
        <View style={styles.statsRow}>
          {t('taiwan.selection.smartFlow.highlights', { returnObjects: true, defaultValue: [] }).map((item, index) => (
            <View key={`tw-smart-${index}`} style={styles.stat}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.title}</Text>
            </View>
          ))}
        </View>
        <View style={styles.features}>
          {t('taiwan.selection.smartFlow.features', { returnObjects: true, defaultValue: [] }).map((feature, index) => (
            <Text key={`tw-feature-${index}`} style={styles.feature}>
              {feature}
            </Text>
          ))}
        </View>
        <View style={styles.buttonContainer}>
          <Text style={styles.buttonText}>{t('taiwan.selection.smartFlow.cta')}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={goToWebView} activeOpacity={0.9}>
        <Text style={styles.cardTitle}>{t('taiwan.selection.webFlow.title')}</Text>
        <Text style={styles.cardSubtitle}>{t('taiwan.selection.webFlow.subtitle')}</Text>
        <View style={styles.features}>
          {t('taiwan.selection.webFlow.features', { returnObjects: true, defaultValue: [] }).map((feature, index) => (
            <Text key={`tw-web-${index}`} style={styles.feature}>
              {feature}
            </Text>
          ))}
        </View>
        <View style={[styles.buttonContainer, styles.secondaryButton]}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            {t('taiwan.selection.webFlow.cta')}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.notesCard}>
        <Text style={styles.notesTitle}>{t('taiwan.selection.notes.title')}</Text>
        {t('taiwan.selection.notes.items', { returnObjects: true, defaultValue: [] }).map((note, index) => (
          <Text key={`tw-note-${index}`} style={styles.note}>
            • {note}
          </Text>
        ))}
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  backButton: {
    marginLeft: -spacing.xs,
  },
  headerContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  headerRight: {
    width: 32,
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 18,
    shadowColor: '#18285a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  recommendedCard: {
    borderWidth: 2,
    borderColor: '#283593',
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: spacing.md,
    backgroundColor: '#283593',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  badgeText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  cardTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#E8EAF6',
    borderRadius: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: '#1A237E',
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: '#3949AB',
    marginTop: spacing.xs,
  },
  features: {
    marginTop: spacing.md,
  },
  feature: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  buttonContainer: {
    marginTop: spacing.lg,
    backgroundColor: '#1A237E',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#E8EAF6',
  },
  secondaryButtonText: {
    color: '#1A237E',
  },
  notesCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  notesTitle: {
    ...typography.h4,
    color: '#EF6C00',
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  note: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
});

export default TWArrivalSelectionScreen;
