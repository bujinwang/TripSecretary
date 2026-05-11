// @ts-nocheck
// 香港 HDAC 提交方式选择 (Hong Kong Digital Arrival Card Selection)
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

const HDACSelectionScreen = ({ navigation, route }) => {
  const params = route.params || {};
  const { passport: rawPassport, destination, travelInfo } = params;
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const { t } = useLocale();

  const goToGuide = () => {
    navigation.navigate('HDACGuide', { passport, destination, travelInfo });
  };

  const goToWebView = () => {
    navigation.navigate('HDACWebView', { passport, destination, travelInfo });
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
          <Text style={styles.headerTitle}>{t('hongkong.selection.headerTitle', { defaultValue: '选择提交方式' })}</Text>
          <Text style={styles.headerSubtitle}>{t('hongkong.selection.headerSubtitle', { defaultValue: '选择最适合您的香港入境卡提交方式' })}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Recommended Flow */}
      <TouchableOpacity style={[styles.card, styles.recommendedCard]} onPress={goToGuide} activeOpacity={0.9}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('hongkong.selection.recommendedBadge', { defaultValue: '推荐' })}</Text>
        </View>
        <Text style={styles.cardTitle}>{t('hongkong.selection.smartFlow.title', { defaultValue: '智能引导模式' })}</Text>
        <Text style={styles.cardSubtitle}>{t('hongkong.selection.smartFlow.subtitle', { defaultValue: '入境通智能引导，帮您快速完成' })}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>3{t('hongkong.selection.smartFlow.minutesUnit', { defaultValue: '分钟' })}</Text>
            <Text style={styles.statLabel}>{t('hongkong.selection.smartFlow.timeLabel', { defaultValue: '预计时间' })}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>95%</Text>
            <Text style={styles.statLabel}>{t('hongkong.selection.smartFlow.successLabel', { defaultValue: '成功率' })}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{t('dest.hongkong.hdac.selection.aiValue', { defaultValue: 'AI' })}</Text>
            <Text style={styles.statLabel}>{t('hongkong.selection.smartFlow.aiLabel', { defaultValue: '智能填充' })}</Text>
          </View>
        </View>

        <View style={styles.features}>
          <Text style={styles.feature}>✨ {t('hongkong.selection.smartFlow.feature1', { defaultValue: '自动填充已保存信息' })}</Text>
          <Text style={styles.feature}>📱 {t('hongkong.selection.smartFlow.feature2', { defaultValue: '实时状态跟踪' })}</Text>
          <Text style={styles.feature}>🎯 {t('hongkong.selection.smartFlow.feature3', { defaultValue: '智能错误提示' })}</Text>
          <Text style={styles.feature}>💾 {t('hongkong.selection.smartFlow.feature4', { defaultValue: '本地数据加密保存' })}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Text style={styles.buttonText}>{t('hongkong.selection.smartFlow.cta', { defaultValue: '开始智能引导' })}</Text>
        </View>
      </TouchableOpacity>

      {/* Manual Flow */}
      <TouchableOpacity style={styles.card} onPress={goToWebView} activeOpacity={0.9}>
        <Text style={styles.cardTitle}>{t('hongkong.selection.webFlow.title', { defaultValue: '官网手动填写' })}</Text>
        <Text style={styles.cardSubtitle}>{t('hongkong.selection.webFlow.subtitle', { defaultValue: '直接访问香港入境事务处官网' })}</Text>

        <View style={styles.features}>
          <Text style={styles.feature}>🌐 {t('hongkong.selection.webFlow.feature1', { defaultValue: '官方网站直接填写' })}</Text>
          <Text style={styles.feature}>✅ {t('hongkong.selection.webFlow.feature2', { defaultValue: '完全符合官方要求' })}</Text>
          <Text style={styles.feature}>📄 {t('hongkong.selection.webFlow.feature3', { defaultValue: '即时获取确认码' })}</Text>
        </View>

        <View style={[styles.buttonContainer, styles.secondaryButton]}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            {t('hongkong.selection.webFlow.cta', { defaultValue: '前往官网' })}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Notes */}
      <View style={styles.notesCard}>
        <Text style={styles.notesTitle}>{t('hongkong.selection.notes.title', { defaultValue: '温馨提示' })}</Text>
        <Text style={styles.note}>• {t('hongkong.selection.notes.note1', { defaultValue: '两种方式均可完成香港入境卡填写' })}</Text>
        <Text style={styles.note}>• {t('hongkong.selection.notes.note2', { defaultValue: '智能引导可节省时间并减少错误' })}</Text>
        <Text style={styles.note}>• {t('hongkong.selection.notes.note3', { defaultValue: '所有数据均在本地加密存储' })}</Text>
        <Text style={styles.note}>• {t('hongkong.selection.notes.note4', { defaultValue: '建议提前填写，避免排队' })}</Text>
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
    borderColor: '#D32F2F',
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
    color: '#B71C1C',
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
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: '#B71C1C',
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: '#D32F2F',
    marginTop: spacing.xs,
  },
  features: {
    marginBottom: spacing.md,
  },
  feature: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  buttonContainer: {
    backgroundColor: '#D32F2F',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: '#D32F2F',
  },
  secondaryButtonText: {
    color: '#D32F2F',
  },
  notesCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
  },
  notesTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  note: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});

export default HDACSelectionScreen;
