// 入境通 - Hong Kong Entry Flow Screen (香港入境准备状态)
import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import CompletionSummaryCard from '../../components/CompletionSummaryCard';

import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import EntryCompletionCalculator from '../../utils/EntryCompletionCalculator';
import UserDataService from '../../services/data/UserDataService';

const HongKongEntryFlowScreen = ({ navigation, route }) => {
  const { t, language } = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const passportParam = UserDataService.toSerializablePassport(route.params?.passport);

  // Completion state - calculated from real user data
  const [completionPercent, setCompletionPercent] = useState(0);
  const [completionStatus, setCompletionStatus] = useState('incomplete');
  const [categories, setCategories] = useState([]);
  const [userData, setUserData] = useState(null);

  // Passport selection state
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

      // Initialize UserDataService
      await UserDataService.initialize(currentUserId);

      // Load all user data
      const allUserData = await UserDataService.getAllUserData(currentUserId);

      // Load fund items
      const fundItems = await UserDataService.getFundItems(currentUserId);

      // Load travel info for Hong Kong
      const destinationId = route.params?.destination?.id || 'hongkong';
      const travelInfo = await UserDataService.getTravelInfo(currentUserId, destinationId);

      // Prepare entry info for completion calculation
      const passportInfo = allUserData.passport || {};
      const personalInfoFromStore = allUserData.personalInfo || {};
      const normalizedPersonalInfo = { ...personalInfoFromStore };

      const entryInfo = {
        passport: passportInfo,
        personalInfo: normalizedPersonalInfo,
        funds: fundItems || [],
        travel: travelInfo || {},
        lastUpdatedAt: new Date().toISOString()
      };

      setUserData(entryInfo);

      // Calculate completion using EntryCompletionCalculator
      const completionSummary = EntryCompletionCalculator.getCompletionSummary(entryInfo);

      // Update completion state
      setCompletionPercent(completionSummary.totalPercent);

      if (completionSummary.totalPercent === 100) {
        setCompletionStatus('ready');
      } else if (completionSummary.totalPercent >= 50) {
        setCompletionStatus('mostly_complete');
      } else {
        setCompletionStatus('needs_improvement');
      }

      // Create category data from completion metrics
      const categoryData = [
        {
          id: 'passport',
          name: t('progressiveEntryFlow.categories.passport', { defaultValue: '护照信息' }),
          icon: '📘',
          status: completionSummary.categorySummary.passport.state,
          completedCount: completionSummary.categorySummary.passport.completed,
          totalCount: completionSummary.categorySummary.passport.total,
          missingFields: completionSummary.missingFields.passport || [],
        },
        {
          id: 'personal',
          name: t('progressiveEntryFlow.categories.personal', { defaultValue: '个人信息' }),
          icon: '👤',
          status: completionSummary.categorySummary.personalInfo.state,
          completedCount: completionSummary.categorySummary.personalInfo.completed,
          totalCount: completionSummary.categorySummary.personalInfo.total,
          missingFields: completionSummary.missingFields.personalInfo || [],
        },
        {
          id: 'funds',
          name: t('progressiveEntryFlow.categories.funds', { defaultValue: '资金证明' }),
          icon: '💰',
          status: completionSummary.categorySummary.funds.state,
          completedCount: completionSummary.categorySummary.funds.validFunds,
          totalCount: 1,
          missingFields: completionSummary.missingFields.funds || [],
        },
        {
          id: 'travel',
          name: t('progressiveEntryFlow.categories.travel', { defaultValue: '旅行信息' }),
          icon: '✈️',
          status: completionSummary.categorySummary.travel.state,
          completedCount: completionSummary.categorySummary.travel.completed,
          totalCount: completionSummary.categorySummary.travel.total,
          missingFields: completionSummary.missingFields.travel || [],
        },
      ];

      setCategories(categoryData);

    } catch (error) {
      console.error('Failed to load entry flow data:', error);

      // Fallback to empty state on error
      setCompletionPercent(0);
      setCompletionStatus('needs_improvement');
      setCategories([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCategoryPress = (category) => {
    // Navigate to appropriate screen based on category
    switch (category.id) {
      case 'passport':
      case 'personal':
      case 'funds':
      case 'travel':
        navigation.navigate('HongkongTravelInfo', {
          passport: passportParam,
          destination: route.params?.destination,
        });
        break;
      default:
        break;
    }
  };

  const handlePreviewEntryPack = () => {
    navigation.navigate('HongKongEntryPackPreview', {
      userData,
      passport: passportParam,
      destination: route.params?.destination,
      entryPackData: {
        personalInfo: userData?.personalInfo,
        travelInfo: userData?.travel,
        funds: userData?.funds,
      }
    });
  };

  const renderPrimaryAction = () => {
    if (completionPercent === 100) {
      return (
        <Button
          title="查看通关包 🇭🇰"
          onPress={handlePreviewEntryPack}
          variant="primary"
          size="large"
        />
      );
    } else {
      return (
        <Button
          title="继续完善信息"
          onPress={() => navigation.navigate('HongkongTravelInfo', {
            passport: passportParam,
            destination: route.params?.destination,
          })}
          variant="primary"
          size="large"
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>香港入境准备</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Completion Summary */}
        <CompletionSummaryCard
          completionPercent={completionPercent}
          completionStatus={completionStatus}
          categories={categories}
          onCategoryPress={handleCategoryPress}
          isLoading={isLoading}
          destination="hongkong"
        />

        {/* Primary Action */}
        <View style={styles.primaryActionContainer}>
          {renderPrimaryAction()}
        </View>

        {/* Secondary Actions Section */}
        <View style={styles.actionSection}>
          {/* Entry Guide Button */}
          <TouchableOpacity
            style={styles.entryGuideButton}
            onPress={() => navigation.navigate('HongKongEntryGuide', {
              passport: passportParam,
              destination: route.params?.destination,
              completionData: userData
            })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#0BD67B', colors.primary]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.entryGuideGradient}
            >
              <View style={styles.entryGuideIconContainer}>
                <Text style={styles.entryGuideIcon}>🗺️</Text>
              </View>
              <View style={styles.entryGuideContent}>
                <Text style={styles.entryGuideTitle}>
                  查看香港入境指引
                </Text>
                <Text style={styles.entryGuideSubtitle}>
                  5步骤完整入境流程指南
                </Text>
              </View>
              <View style={styles.entryGuideChevron}>
                <Text style={styles.entryGuideArrow}>›</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Entry Pack Preview Button */}
          {completionPercent > 50 && (
            <View style={styles.secondaryActionsContainer}>
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={handlePreviewEntryPack}
                activeOpacity={0.8}
              >
                <View style={styles.secondaryActionIconContainer}>
                  <Text style={styles.secondaryActionIcon}>👁️</Text>
                </View>
                <View style={styles.secondaryActionContent}>
                  <Text style={styles.secondaryActionTitle}>
                    看看我的通关包
                  </Text>
                  <Text style={styles.secondaryActionSubtitle}>
                    {t('progressiveEntryFlow.entryPack.quickPeek', { defaultValue: '快速查看旅途资料' })}
                  </Text>
                </View>
                <Text style={styles.secondaryActionArrow}>›</Text>
              </TouchableOpacity>
            </View>
          )}
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
  content: {
    flex: 1,
  },
  primaryActionContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  actionSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },

  // Entry Guide Button Styles
  entryGuideButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  entryGuideGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  entryGuideIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  entryGuideIcon: {
    fontSize: 24,
  },
  entryGuideContent: {
    flex: 1,
  },
  entryGuideTitle: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 2,
  },
  entryGuideSubtitle: {
    ...typography.body2,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  entryGuideChevron: {
    marginLeft: spacing.sm,
  },
  entryGuideArrow: {
    fontSize: 32,
    color: colors.white,
    fontWeight: '300',
  },

  // Secondary Actions Styles
  secondaryActionsContainer: {
    marginTop: spacing.md,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryActionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  secondaryActionIcon: {
    fontSize: 20,
  },
  secondaryActionContent: {
    flex: 1,
  },
  secondaryActionTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  secondaryActionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  secondaryActionArrow: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '300',
  },
});

export default HongKongEntryFlowScreen;
