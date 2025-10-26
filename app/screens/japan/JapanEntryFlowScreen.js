// 入境通 - Japan Entry Flow Screen (日本入境准备状态)
import React, { useState, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';

import BackButton from '../../components/BackButton';
import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import UserDataService from '../../services/data/UserDataService';

const JapanEntryFlowScreen = ({ navigation, route }) => {
  const { t, language } = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const passportParam = UserDataService.toSerializablePassport(route.params?.passport);

  // Completion state
  const [completionPercent, setCompletionPercent] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [japanTravelerData, setJapanTravelerData] = useState(null);

  const [userId, setUserId] = useState(null);

  // Load data on component mount and when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Get user ID from route params or use default
      const currentUserId = passportParam?.id || 'user_001';
      setUserId(currentUserId);

      // Load Japan traveler data
      const JapanTravelerContextBuilder = require('../../services/japan/JapanTravelerContextBuilder').default;
      const result = await JapanTravelerContextBuilder.buildContext(currentUserId);

      if (result.success) {
        console.log('Japan traveler data loaded successfully');
        setJapanTravelerData(result.payload);

        // Calculate completion
        const requiredFields = [
          'passportNo',
          'fullName',
          'nationality',
          'dateOfBirth',
          'occupation',
          'email',
          'arrivalDate',
          'arrivalFlightNumber',
          'accommodationAddress',
          'accommodationPhone',
          'lengthOfStay',
        ];

        let completed = requiredFields.filter((field) => {
          const value = result.payload[field];
          if (value === null || value === undefined) return false;
          if (typeof value === 'number') return !Number.isNaN(value);
          return String(value).trim().length > 0;
        }).length;

        const total = requiredFields.length + 1;
        if (Array.isArray(result.payload.fundItems) && result.payload.fundItems.length > 0) {
          completed += 1;
        }

        const percent = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));

        setCompletedCount(completed);
        setTotalCount(total);
        setCompletionPercent(percent);
      } else {
        console.log('Failed to load Japan traveler data:', result.errors);
      }

    } catch (error) {
      console.error('Failed to load entry flow data:', error);
      setCompletionPercent(0);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleEditInfo = () => {
    navigation.navigate('JapanTravelInfo', {
      passport: passportParam,
      destination: route.params?.destination,
      userId: userId,
    });
  };

  const handleViewFillingGuide = () => {
    navigation.navigate('Result', {
      passport: passportParam,
      destination: route.params?.destination,
      userId: userId,
      context: 'manual_entry_guide',
      initialAction: 'guide',
    });
  };

  const handleInteractiveGuide = () => {
    navigation.navigate('ImmigrationGuide', {
      passport: passportParam,
      destination: route.params?.destination,
      japanTravelerData,
      userId: userId,
    });
  };

  const handleShare = () => {
    Alert.alert(
      '分享给亲友',
      '分享功能开发中，敬请期待！',
      [{ text: '确定' }]
    );
  };

  const isReady = completionPercent === 100;
  const statusVariant = !japanTravelerData
    ? 'loading'
    : isReady
      ? 'complete'
      : completionPercent >= 80
        ? 'almost'
        : 'incomplete';

  const themeMap = {
    complete: {
      color: '#0BD67B',
      background: 'rgba(11, 214, 123, 0.12)',
      border: 'rgba(11, 214, 123, 0.25)',
      statusText: '日本入境准备就绪！🌸',
      subtitle: '所有资料整理完成，随时可以在机场出示。',
    },
    almost: {
      color: '#FF9500',
      background: 'rgba(255, 149, 0, 0.12)',
      border: 'rgba(255, 149, 0, 0.2)',
      statusText: '再检查一下信息～',
      subtitle: '还有少量信息待确认，完成后更安心出行。',
    },
    incomplete: {
      color: colors.primary,
      background: 'rgba(10, 132, 255, 0.12)',
      border: 'rgba(10, 132, 255, 0.2)',
      statusText: '继续完善资料吧！',
      subtitle: '完成所有资料即可生成完整的日本入境包。',
    },
    loading: {
      color: colors.textSecondary,
      background: 'rgba(0, 0, 0, 0.04)',
      border: 'rgba(0, 0, 0, 0.08)',
      statusText: '正在加载您的资料…',
      subtitle: '请稍候，我们正在整理旅客信息。',
    },
  };

  const theme = themeMap[statusVariant];
  const progressWidth = japanTravelerData ? `${completionPercent}%` : '0%';

  const actionCards = [
    {
      id: 'edit',
      icon: '✏️',
      title: '修改我的信息',
      subtitle: '编辑护照、行程、住宿等资料',
      onPress: handleEditInfo,
      color: '#007AFF',
    },
    {
      id: 'guide',
      icon: '📋',
      title: '查看填写指南',
      subtitle: '离线查看所有入境卡填写信息',
      onPress: handleViewFillingGuide,
      color: '#34C759',
    },
    {
      id: 'interactive',
      icon: '🛬',
      title: '互动入境指南',
      subtitle: '分步骤指导，大字体模式',
      onPress: handleInteractiveGuide,
      color: '#FF9500',
    },
    {
      id: 'share',
      icon: '👥',
      title: '分享给亲友',
      subtitle: '让家人帮忙核对信息',
      onPress: handleShare,
      color: '#5856D6',
    },
  ];

  if (isLoading && !japanTravelerData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton
            onPress={() => navigation.goBack()}
            label={t('common.back')}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>日本入境准备</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>正在加载...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>日本入境准备</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Progress Card */}
        <View style={styles.heroContainer}>
          <Text style={styles.heroTitle}>
            我的日本之旅准备好了吗？🌸
          </Text>
          <Text style={styles.heroSubtitle}>
            看看你准备得怎么样，一起迎接日本冒险！
          </Text>

          <View
            style={[
              styles.heroCard,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <View style={styles.heroProgressSection}>
              <Text style={[styles.heroPercent, { color: theme.color }]}>
                {japanTravelerData ? `${completionPercent}%` : '--'}
              </Text>
              <Text style={styles.heroPercentLabel}>准备进度</Text>
              <View style={styles.heroProgressBar}>
                <View
                  style={[
                    styles.heroProgressFill,
                    { width: progressWidth, backgroundColor: theme.color },
                  ]}
                />
              </View>
              <Text style={[styles.heroStatus, { color: theme.color }]}>
                {theme.statusText}
              </Text>
              <Text style={styles.heroSubtitleText}>
                {theme.subtitle}
              </Text>
              {japanTravelerData && totalCount > 0 && (
                <Text style={styles.heroMeta}>
                  已完成 {completedCount}/{totalCount} 项资料
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Action Cards */}
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>快速操作</Text>
          {actionCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.actionCard}
              onPress={card.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: `${card.color}15` }]}>
                <Text style={styles.actionIcon}>{card.icon}</Text>
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>{card.title}</Text>
                <Text style={styles.actionSubtitle}>{card.subtitle}</Text>
              </View>
              <Text style={[styles.actionArrow, { color: card.color }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            日本需要手写纸质入境卡，建议提前准备好黑/蓝色签字笔，并保存填写指南截图以便随时查看。
          </Text>
        </View>

        {/* Privacy Box */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            所有信息仅保存在您的手机本地
          </Text>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  heroContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  heroCard: {
    borderRadius: 22,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  heroProgressSection: {
    alignItems: 'center',
  },
  heroPercent: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 52,
  },
  heroPercentLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  heroProgressBar: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  heroStatus: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  heroSubtitleText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  heroMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  actionsContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  actionsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionArrow: {
    fontSize: 28,
    fontWeight: '400',
    marginLeft: spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.2)',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  infoText: {
    fontSize: 13,
    color: '#1565C0',
    flex: 1,
    lineHeight: 18,
  },
  privacyBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  privacyIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  privacyText: {
    fontSize: 13,
    color: '#34C759',
    flex: 1,
    lineHeight: 18,
  },
});

export default JapanEntryFlowScreen;
