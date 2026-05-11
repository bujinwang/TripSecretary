// @ts-nocheck
// 香港 HDAC 引导页面 (Hong Kong Digital Arrival Card Guide)
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

const HDACGuideScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination, travelInfo } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const { t } = useLocale();

  const steps = [
    {
      title: t('hongkong.guide.step1.title', { defaultValue: '准备护照信息' }),
      subtitle: t('hongkong.guide.step1.subtitle', { defaultValue: '确保您的护照信息准确无误' }),
      details: [
        t('hongkong.guide.step1.detail1', { defaultValue: '护照号码' }),
        t('hongkong.guide.step1.detail2', { defaultValue: '姓名（拼音）' }),
        t('hongkong.guide.step1.detail3', { defaultValue: '国籍' }),
        t('hongkong.guide.step1.detail4', { defaultValue: '出生日期' }),
        t('hongkong.guide.step1.detail5', { defaultValue: '护照有效期' }),
      ],
    },
    {
      title: t('hongkong.guide.step2.title', { defaultValue: '填写旅行信息' }),
      subtitle: t('hongkong.guide.step2.subtitle', { defaultValue: '提供您的香港旅行计划' }),
      details: [
        t('hongkong.guide.step2.detail1', { defaultValue: '旅行目的' }),
        t('hongkong.guide.step2.detail2', { defaultValue: '抵达航班号和日期' }),
        t('hongkong.guide.step2.detail3', { defaultValue: '离开航班号和日期' }),
        t('hongkong.guide.step2.detail4', { defaultValue: '在港住址' }),
        t('hongkong.guide.step2.detail5', { defaultValue: '停留天数' }),
      ],
    },
    {
      title: t('hongkong.guide.step3.title', { defaultValue: '添加资金证明' }),
      subtitle: t('hongkong.guide.step3.subtitle', { defaultValue: '（可选）提供资金证明材料' }),
      details: [
        t('hongkong.guide.step3.detail1', { defaultValue: '现金证明' }),
        t('hongkong.guide.step3.detail2', { defaultValue: '信用卡' }),
        t('hongkong.guide.step3.detail3', { defaultValue: '银行账户' }),
        t('hongkong.guide.step3.detail4', { defaultValue: '旅行支票' }),
      ],
    },
    {
      title: t('hongkong.guide.step4.title', { defaultValue: '生成入境包' }),
      subtitle: t('hongkong.guide.step4.subtitle', { defaultValue: '系统自动生成您的入境材料包' }),
      details: [
        t('hongkong.guide.step4.detail1', { defaultValue: '入境信息总结' }),
        t('hongkong.guide.step4.detail2', { defaultValue: '常见问题准备' }),
        t('hongkong.guide.step4.detail3', { defaultValue: '紧急联系方式' }),
        t('hongkong.guide.step4.detail4', { defaultValue: '入境引导步骤' }),
      ],
    },
  ];

  const quickActions = [
    {
      icon: '⚡',
      title: t('hongkong.guide.quickAction1.title', { defaultValue: '快速开始' }),
      description: t('hongkong.guide.quickAction1.description', { defaultValue: '3分钟完成全部信息' }),
    },
    {
      icon: '🔒',
      title: t('hongkong.guide.quickAction2.title', { defaultValue: '安全保护' }),
      description: t('hongkong.guide.quickAction2.description', { defaultValue: '数据本地加密存储' }),
    },
    {
      icon: '📱',
      title: t('hongkong.guide.quickAction3.title', { defaultValue: '随时使用' }),
      description: t('hongkong.guide.quickAction3.description', { defaultValue: '离线也可查看资料' }),
    },
  ];

  const handleOpenWebView = () => {
    navigation.navigate('HDACWebView', { passport, destination, travelInfo });
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
          <Text style={styles.headerTitle}>{t('hongkong.guide.headerTitle', { defaultValue: 'HDAC 智能引导' })}</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>🇭🇰</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>{t('hongkong.guide.banner.title', { defaultValue: '香港数字入境卡' })}</Text>
            <Text style={styles.bannerSubtitle}>
              {t('hongkong.guide.banner.subtitle', { defaultValue: '入境通帮您快速准备香港入境材料' })}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('hongkong.guide.stepSectionTitle', { defaultValue: '完成步骤' })}</Text>
          {steps.map((step, index) => (
            <View key={`step-${index}`} style={styles.stepCard}>
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
                  <Text key={`detail-${detailIndex}`} style={styles.stepBullet}>
                    • {detail}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('hongkong.guide.quickActions.title', { defaultValue: '为什么选择智能引导' })}</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action, index) => (
              <View key={`quick-${index}`} style={styles.quickActionCard}>
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
              {t('hongkong.guide.primaryCta', { defaultValue: '前往香港官网填写' })}
            </Text>
          </TouchableOpacity>
          <Text style={styles.buttonHint}>{t('hongkong.guide.ctaHint', { defaultValue: '我们将为您打开香港入境事务处官网' })}</Text>
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
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  bannerEmoji: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  bannerTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: '#B71C1C',
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    ...typography.body2,
    color: '#D32F2F',
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  stepCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  stepNumberText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '700',
  },
  stepTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text,
  },
  stepSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stepBody: {
    marginLeft: 40,
  },
  stepBullet: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    ...typography.body2,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  quickActionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '700',
  },
  buttonHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default HDACGuideScreen;
