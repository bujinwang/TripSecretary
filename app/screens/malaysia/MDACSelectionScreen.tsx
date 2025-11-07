// 马来西亚 MDAC 提交方式选择
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import BackButton from '../../components/BackButton';
import { useLocale } from '../../i18n/LocaleContext';
import UserDataService from '../../services/data/UserDataService';

const MDACSelectionScreen = ({ navigation, route }) => {
  const params = route.params || {};
  const { passport: rawPassport, destination, travelInfo } = params;
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const { t } = useLocale();

  const goToGuide = () => {
    navigation.navigate('MDACGuide', { passport, destination, travelInfo });
  };

  const goToWebView = () => {
    navigation.navigate('MDACWebView', { passport, destination, travelInfo });
  };

  return (
    <ScrollView style={styles.container} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('malaysia.selection.headerTitle')}</Text>
          <Text style={styles.headerSubtitle}>{t('malaysia.selection.headerSubtitle')}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Recommended Flow */}
      <TouchableOpacity style={[styles.card, styles.recommendedCard]} onPress={goToGuide} activeOpacity={0.9}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('malaysia.selection.recommendedBadge')}</Text>
        </View>
        <Text style={styles.cardTitle}>{t('malaysia.selection.smartFlow.title')}</Text>
        <Text style={styles.cardSubtitle}>{t('malaysia.selection.smartFlow.subtitle')}</Text>

        <View style={styles.statsRow}>
          {t('malaysia.selection.smartFlow.highlights', { returnObjects: true, defaultValue: [] }).map((item, index) => (
            <View key={item.title || `smart-${index}`} style={styles.stat}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.title}</Text>
            </View>
          ))}
        </View>

        <View style={styles.features}>
          {t('malaysia.selection.smartFlow.features', { returnObjects: true, defaultValue: [] }).map((feature, index) => (
            <Text key={`smart-feature-${index}`} style={styles.feature}>
              {feature}
            </Text>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <Text style={styles.buttonText}>{t('malaysia.selection.smartFlow.cta')}</Text>
        </View>
      </TouchableOpacity>

      {/* Manual Flow */}
      <TouchableOpacity style={styles.card} onPress={goToWebView} activeOpacity={0.9}>
        <Text style={styles.cardTitle}>{t('malaysia.selection.webFlow.title')}</Text>
        <Text style={styles.cardSubtitle}>{t('malaysia.selection.webFlow.subtitle')}</Text>

        <View style={styles.features}>
          {t('malaysia.selection.webFlow.features', { returnObjects: true, defaultValue: [] }).map((feature, index) => (
            <Text key={`web-feature-${index}`} style={styles.feature}>
              {feature}
            </Text>
          ))}
        </View>

        <View style={[styles.buttonContainer, styles.secondaryButton]}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            {t('malaysia.selection.webFlow.cta')}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Notes */}
      <View style={styles.notesCard}>
        <Text style={styles.notesTitle}>{t('malaysia.selection.notes.title')}</Text>
        {t('malaysia.selection.notes.items', { returnObjects: true, defaultValue: [] }).map((note, index) => (
          <Text key={`note-${index}`} style={styles.note}>
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
    backgroundColor: '#f5f7fb',
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
    shadowColor: '#102645',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  recommendedCard: {
    borderWidth: 2,
    borderColor: '#1565C0',
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: spacing.md,
    backgroundColor: '#ff7043',
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
    color: '#0D47A1',
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
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: '#0D47A1',
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: '#1565C0',
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
    backgroundColor: '#0D47A1',
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
    backgroundColor: '#E3F2FD',
  },
  secondaryButtonText: {
    color: '#0D47A1',
  },
  notesCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: '#FFF8E1',
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

export default MDACSelectionScreen;
