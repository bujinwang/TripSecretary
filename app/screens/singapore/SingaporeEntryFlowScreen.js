// 入境通 - Singapore Entry Flow Screen (新加坡入境准备状态)
// 基于SGAC新加坡数字入境卡系统

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
import Button from '../../components/Button';
import CompletionSummaryCard from '../../components/CompletionSummaryCard';
import CategoryStatusList from '../../components/CategoryStatusList';
import SubmissionCountdown from '../../components/SubmissionCountdown';
import DataChangeAlert from '../../components/DataChangeAlert';
import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import EntryCompletionCalculator from '../../utils/EntryCompletionCalculator';
import PassportDataService from '../../services/data/PassportDataService';

const SingaporeEntryFlowScreen = ({ navigation, route }) => {
  const { t, language } = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const passportParam = PassportDataService.toSerializablePassport(route.params?.passport);

  // Completion state - calculated from real user data
  const [completionPercent, setCompletionPercent] = useState(0);
  const [completionStatus, setCompletionStatus] = useState('incomplete');
  const [categories, setCategories] = useState([]);
  const [userData, setUserData] = useState(null);
  const [arrivalDate, setArrivalDate] = useState(null);

  // Data change detection state
  const [resubmissionWarning, setResubmissionWarning] = useState(null);
  const [entryPackStatus, setEntryPackStatus] = useState(null);
  const [showSupersededStatus, setShowSupersededStatus] = useState(false);

  const categoriesSectionTitle = useMemo(() => {
    const translation = t('singapore.entryFlow.categories');
    if (typeof translation === 'string') {
      return translation;
    }

    const fallback = t('singapore.entryFlow.categoriesTitle', { defaultValue: '' });
    if (fallback) {
      return fallback;
    }

    if (language?.startsWith('zh')) {
      return language === 'zh-TW' ? '新加坡准备项目 🌴' : '新加坡准备项目 🌴';
    }

    return 'Singapore Preparation Items 🌴';
  }, [t, language]);

  // Load data on component mount and when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
      setupDataChangeListener();

      return () => {
        // Cleanup listener on unmount
        if (dataChangeUnsubscribe) {
          dataChangeUnsubscribe();
        }
      };
    }, [])
  );

  // Data change listener
  let dataChangeUnsubscribe = null;

  const setupDataChangeListener = () => {
    // Add listener for data changes and resubmission warnings
    dataChangeUnsubscribe = PassportDataService.addDataChangeListener((event) => {
      console.log('Data change event received in SingaporeEntryFlowScreen:', event);

      if (event.type === 'RESUBMISSION_WARNING') {
        // Check if this warning is for the current entry pack
        const currentEntryPackId = route.params?.entryPackId;
        if (currentEntryPackId && event.entryPackId === currentEntryPackId) {
          setResubmissionWarning(event);
        }
      } else if (event.type === 'DATA_CHANGED') {
        // Refresh data when changes are detected
        loadData();
      }
    });
  };

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Get user ID from route params or use default
      const userId = passportParam?.id || 'user_001';

      // Initialize PassportDataService
      await PassportDataService.initialize(userId);

      // Load all user data
      const allUserData = await PassportDataService.getAllUserData(userId);
      console.log('Loaded user data for completion calculation:', allUserData);

      // Load fund items
      const fundItems = await PassportDataService.getFundItems(userId);

      // Load travel info for Singapore
      const destinationId = route.params?.destination?.id || 'singapore';
      const travelInfo = await PassportDataService.getTravelInfo(userId, destinationId);

      // Prepare entry info for completion calculation
      const passportInfo = allUserData.passport || {};
      const personalInfoFromStore = allUserData.personalInfo || {};
      const normalizedPersonalInfo = { ...personalInfoFromStore };

      if (!normalizedPersonalInfo.gender || !normalizedPersonalInfo.gender.trim()) {
        if (passportInfo.gender && passportInfo.gender.trim()) {
          normalizedPersonalInfo.gender = passportInfo.gender.trim();
        } else if (passportParam?.gender && passportParam.gender.trim()) {
          normalizedPersonalInfo.gender = passportParam.gender.trim();
        } else if (passportParam?.sex && passportParam.sex.trim()) {
          normalizedPersonalInfo.gender = passportParam.sex.trim();
        }
      }

      const entryInfo = {
        passport: passportInfo,
        personalInfo: normalizedPersonalInfo,
        funds: fundItems || [],
        travel: travelInfo || {},
        lastUpdatedAt: new Date().toISOString()
      };

      setUserData(entryInfo);

      // Extract arrival date for countdown
      const arrivalDateFromTravel = travelInfo?.arrivalArrivalDate || travelInfo?.arrivalDate;
      setArrivalDate(arrivalDateFromTravel);

      // Calculate completion using EntryCompletionCalculator
      const completionSummary = EntryCompletionCalculator.getCompletionSummary(entryInfo);
      console.log('Completion summary:', completionSummary);

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
          totalCount: 1, // At least 1 fund item required
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

      // Check for entry info and resubmission warnings
      await loadEntryInfoStatus(userId);

    } catch (error) {
      console.error('Failed to load entry flow data:', error);

      // Fallback to empty state on error
      setCompletionPercent(0);
      setCompletionStatus('needs_improvement');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadEntryInfoStatus = async (userId) => {
    try {
      // Use EntryInfoService to check for entry info with DAC submissions
      const EntryInfoService = require('../../services/EntryInfoService').default;

      if (!EntryInfoService || typeof EntryInfoService.getAllEntryInfos !== 'function') {
        console.log('EntryInfoService methods not available, skipping entry info status check');
        setEntryPackStatus(null);
        setShowSupersededStatus(false);
        setResubmissionWarning(null);
        return;
      }

      const allEntryInfos = await EntryInfoService.getAllEntryInfos(userId);

      // Find entry info for Singapore
      const destinationId = route.params?.destination?.id || 'singapore';
      const singaporeEntryInfo = allEntryInfos?.find(info =>
        info.destinationId === destinationId || info.destinationId === 'singapore'
      );

      if (singaporeEntryInfo) {
        // Check if this entry info has a successful DAC submission
        const latestDAC = await EntryInfoService.getLatestSuccessfulDigitalArrivalCard(singaporeEntryInfo.id, 'SGAC');

        if (latestDAC) {
          // Has successful DAC - consider it "submitted"
          setEntryPackStatus('submitted');
          setShowSupersededStatus(latestDAC.status === 'superseded');

          // Check for pending resubmission warnings
          try {
            const warning = PassportDataService.getResubmissionWarning(singaporeEntryInfo.id);
            if (warning) {
              setResubmissionWarning(warning);
            }
          } catch (warningError) {
            console.log('Resubmission warning check failed:', warningError);
          }

          console.log('Entry info status loaded:', {
            entryInfoId: singaporeEntryInfo.id,
            hasDAC: !!latestDAC,
            dacStatus: latestDAC.status,
            hasWarning: !!resubmissionWarning
          });
        } else {
          // No successful DAC - consider it "in_progress"
          setEntryPackStatus('in_progress');
          setShowSupersededStatus(false);
          setResubmissionWarning(null);
        }
      } else {
        setEntryPackStatus(null);
        setShowSupersededStatus(false);
        setResubmissionWarning(null);
      }
    } catch (error) {
      console.error('Failed to load entry info status:', error);
    }
  };

  const handleResubmissionWarning = async (warning, action) => {
    try {
      if (action === 'resubmit') {
        // Mark entry pack as superseded and navigate to edit
        await PassportDataService.markEntryPackAsSuperseded(warning.entryPackId, {
          changedFields: warning.diffResult.changedFields,
          changeReason: 'user_confirmed_resubmission'
        });

        // Clear the warning
        setResubmissionWarning(null);
        setShowSupersededStatus(true);

        // Navigate to edit screen
        navigation.navigate('SingaporeTravelInfo', {
          passport: passportParam,
          destination: route.params?.destination,
          resubmissionMode: true
        });
      } else if (action === 'ignore') {
        // Clear the warning but don't mark as superseded
        PassportDataService.clearResubmissionWarning(warning.entryPackId);
        setResubmissionWarning(null);
      }
    } catch (error) {
      console.error('Failed to handle resubmission warning:', error);
      Alert.alert(
        t('common.error', { defaultValue: '错误' }),
        t('progressiveEntryFlow.dataChange.handleError', {
          defaultValue: '处理数据变更时出错，请重试。'
        })
      );
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleEditInformation = () => {
    // Navigate back to SingaporeTravelInfoScreen
    navigation.navigate('SingaporeTravelInfo', {
      passport: passportParam,
      destination: route.params?.destination,
    });
  };

  const handlePreviewEntryCard = () => {
    // Navigate to preview screen (placeholder for now)
    // This could navigate to a preview modal or screen
    console.log('Preview entry card - to be implemented');
    // navigation.navigate('EntryCardPreview', { userData });
  };

  const handleShareWithFriends = () => {
    // Share functionality (placeholder for now)
    // This could generate a QR code or shareable link
    console.log('Share with friends - to be implemented');
  };

  const handleCategoryPress = (category) => {
    // Navigate back to SingaporeTravelInfoScreen with the specific section expanded
    // This will be enhanced in future tasks to expand the correct section
    navigation.navigate('SingaporeTravelInfo', {
      expandSection: category.id,
      passport: passportParam,
      destination: route.params?.destination,
    });
  };

  const handlePrimaryAction = () => {
    const buttonState = getPrimaryButtonState();

    switch (buttonState.action) {
      case 'continue_improving':
        // Navigate back to SingaporeTravelInfoScreen
        navigation.navigate('SingaporeTravelInfo', {
          passport: passportParam,
          destination: route.params?.destination,
        });
        break;
      case 'submit_sgac':
        // Navigate to SGAC submission screen
        navigation.navigate('SGACSelection', {
          passport: passportParam,
          destination: route.params?.destination,
        });
        break;
      case 'resubmit_sgac':
        // Handle resubmission - navigate to edit screen first
        navigation.navigate('SingaporeTravelInfo', {
          passport: passportParam,
          destination: route.params?.destination,
          resubmissionMode: true,
          showResubmissionHint: true
        });
        break;
      case 'wait_for_window':
      default:
        // Button is disabled, no action
        break;
    }
  };

  const getPrimaryButtonState = () => {
    // Check if entry pack is superseded
    if (showSupersededStatus || entryPackStatus === 'superseded') {
      return {
        title: '更新我的新加坡准备信息 🌺',
        action: 'resubmit_sgac',
        disabled: false,
        variant: 'primary',
        subtitle: '你的信息有更新，让我们重新准备最新的入境卡'
      };
    }

    // Check completion status
    const isComplete = completionPercent === 100;

    // Check submission window status
    let canSubmitNow = false;
    if (arrivalDate) {
      const window = require('../../utils/singapore/ArrivalWindowCalculator').default.getSubmissionWindow(arrivalDate);
      canSubmitNow = window.canSubmit;
    }

    if (!isComplete) {
      return {
        title: '继续准备我的新加坡之旅 💪',
        action: 'continue_improving',
        disabled: false,
        variant: 'secondary'
      };
    } else if (isComplete && !arrivalDate) {
      return {
        title: '告诉我你什么时候到新加坡 ✈️',
        action: 'continue_improving',
        disabled: false,
        variant: 'secondary',
        subtitle: '设置抵达日期，我们就能帮你找到最佳提交时间'
      };
    } else if (isComplete && !canSubmitNow) {
      return {
        title: t('progressiveEntryFlow.countdown.preWindow', { defaultValue: '等待提交窗口' }),
        action: 'wait_for_window',
        disabled: true,
        variant: 'primary',
        subtitle: t('progressiveEntryFlow.countdown.preWindow', {
          defaultValue: '提交窗口尚未开启'
        })
      };
    } else {
      return {
        title: '准备好入境新加坡了！🌴',
        action: 'submit_sgac',
        disabled: false,
        variant: 'primary'
      };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={handleGoBack}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>
          我的新加坡之旅 🌺
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇸🇬</Text>
          <Text style={styles.title}>
            我的新加坡之旅准备好了吗？🌺
          </Text>
          <Text style={styles.subtitle}>
            看看你准备得怎么样，一起迎接新加坡冒险！
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {t('singapore.entryFlow.loading', { defaultValue: '正在加载准备状态...' })}
            </Text>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {/* Superseded Status Banner */}
            {showSupersededStatus && (
              <View style={styles.supersededBanner}>
                <Text style={styles.supersededIcon}>🔄</Text>
                <View style={styles.supersededContent}>
                  <Text style={styles.supersededTitle}>
                    {t('progressiveEntryFlow.status.superseded', {
                      defaultValue: '需要重新提交'
                    })}
                  </Text>
                  <Text style={styles.supersededMessage}>
                    {t('progressiveEntryFlow.superseded.message', {
                      defaultValue: '您的入境信息已更新，需要重新提交入境卡以确保信息准确。'
                    })}
                  </Text>
                </View>
              </View>
            )}

            {/* Data Change Alert */}
            {resubmissionWarning && (
              <DataChangeAlert
                warning={resubmissionWarning}
                onResubmit={(warning) => handleResubmissionWarning(warning, 'resubmit')}
                onIgnore={(warning) => handleResubmissionWarning(warning, 'ignore')}
                onViewDetails={(warning) => {
                  console.log('View details for warning:', warning);
                }}
                style={styles.dataChangeAlert}
              />
            )}
            {/* Check if user has any entry information */}
            {completionPercent === 0 && categories.every(cat => cat.completedCount === 0) ? (
              // No data case
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataIcon}>📝</Text>
                <Text style={styles.noDataTitle}>
                  准备开始新加坡之旅吧！🌴
                </Text>
                <Text style={styles.noDataDescription}>
                  你还没有填写新加坡入境信息，别担心，我们会一步步帮你准备好所有需要的资料，让你轻松入境新加坡！
                </Text>

                {/* Example/Tutorial hints */}
                <View style={styles.noDataHints}>
                  <Text style={styles.noDataHintsTitle}>
                    新加坡入境需要准备这些信息 🌺
                  </Text>
                  <View style={styles.noDataHintsList}>
                    <Text style={styles.noDataHint}>• 📘 护照信息 - 让新加坡认识你</Text>
                    <Text style={styles.noDataHint}>• 📞 联系方式 - 新加坡怎么找到你</Text>
                    <Text style={styles.noDataHint}>• 💰 资金证明 - 证明你能好好玩</Text>
                    <Text style={styles.noDataHint}>• ✈️ 航班和住宿 - 你的旅行计划</Text>
                  </View>
                </View>

                <Button
                  title="开始我的新加坡准备之旅！🇸🇬"
                  onPress={handleEditInformation}
                  variant="primary"
                  style={styles.noDataButton}
                />
              </View>
            ) : (
              // Normal data display
              <>
                {/* Status Cards Section */}
                <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>
                我的新加坡准备进度 🌴
              </Text>

              {/* Completion Summary Card */}
              <CompletionSummaryCard
                completionPercent={completionPercent}
                status={completionStatus}
                showProgressBar={true}
              />

              {/* Category Status List */}
              <View style={styles.categoriesContainer}>
                <Text style={styles.categoriesTitle}>
                  {categoriesSectionTitle}
                </Text>
                <CategoryStatusList
                  categories={categories}
                  onCategoryPress={handleCategoryPress}
                  showMissingFields={true}
                />
              </View>
            </View>

            {/* Countdown Section */}
            <View style={styles.countdownSection}>
              <Text style={styles.sectionTitle}>
                最佳提交时间 ⏰
              </Text>

              {/* Submission Countdown */}
              <SubmissionCountdown
                arrivalDate={arrivalDate}
                locale={t('locale', { defaultValue: 'zh' })}
                showIcon={true}
                updateInterval={1000} // Update every second for real-time countdown
              />
            </View>

            {/* Action Buttons Section */}
            <View style={styles.actionSection}>
              <Text style={styles.sectionTitle}>
                接下来做什么？🌟
              </Text>

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                {/* Smart Primary Action Button */}
                <View style={styles.primaryActionContainer}>
                  {(() => {
                    const buttonState = getPrimaryButtonState();
                    return (
                      <View>
                        <Button
                          title={buttonState.title}
                          onPress={handlePrimaryAction}
                          variant={buttonState.variant}
                          disabled={buttonState.disabled}
                          style={styles.primaryActionButton}
                        />
                        {buttonState.subtitle && (
                          <Text style={styles.primaryActionSubtitle}>
                            {buttonState.subtitle}
                          </Text>
                        )}
                      </View>
                    );
                  })()}
                </View>

                {/* Secondary Actions */}
                <View style={styles.secondaryActionsContainer}>
                  {/* Preview Entry Card Button - Available when completion > 80% */}
                  {completionPercent > 80 && (
                    <TouchableOpacity
                      style={styles.secondaryActionButton}
                      onPress={handlePreviewEntryCard}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.secondaryActionIcon}>👁️</Text>
                      <Text style={styles.secondaryActionText}>
                        看看我的入境卡长啥样 👁️
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Share with Friends Button - Optional */}
                  <TouchableOpacity
                    style={styles.secondaryActionButton}
                    onPress={handleShareWithFriends}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.secondaryActionIcon}>📤</Text>
                    <Text style={styles.secondaryActionText}>
                      和朋友一起准备 📤
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
              </>
            )}
          </View>
        )}
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
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  scrollContainer: {
    paddingBottom: spacing.lg,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  flag: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
  },
  // Status Section Styles
  statusSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },

  // Categories Section Styles
  categoriesContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoriesTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },

  // Countdown Section Styles
  countdownSection: {
    marginBottom: spacing.lg,
  },

  // Action Section Styles
  actionSection: {
    marginBottom: spacing.lg,
  },
  actionButtonsContainer: {
    gap: spacing.md,
  },
  primaryActionContainer: {
    marginBottom: spacing.md,
  },
  primaryActionButton: {
    marginBottom: spacing.xs,
  },
  primaryActionSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  secondaryActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  secondaryActionButton: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryActionIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  secondaryActionText: {
    ...typography.body2,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  // No Data Styles
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  noDataIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  noDataTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  noDataDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  noDataHints: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  noDataHintsTitle: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  noDataHintsList: {
    gap: spacing.xs,
  },
  noDataHint: {
    ...typography.body2,
    color: colors.primary,
    lineHeight: 18,
  },
  noDataButton: {
    minWidth: 200,
  },

  // Superseded Status Banner Styles
  supersededBanner: {
    backgroundColor: '#FFF5F5',
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  supersededIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  supersededContent: {
    flex: 1,
  },
  supersededTitle: {
    ...typography.h4,
    fontWeight: '600',
    color: colors.error,
    marginBottom: spacing.xs,
  },
  supersededMessage: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Data Change Alert Styles
  dataChangeAlert: {
    marginBottom: spacing.md,
  },
});

export default SingaporeEntryFlowScreen;
