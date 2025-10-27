// 入境通 - Thailand Entry Flow Screen (泰国入境准备状态)
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
import { LinearGradient } from 'expo-linear-gradient';

import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import CompletionSummaryCard from '../../components/CompletionSummaryCard';

import SubmissionCountdown from '../../components/SubmissionCountdown';
import DataChangeAlert from '../../components/DataChangeAlert';
import NoDataState from '../../components/thailand/NoDataState';
import PreparedState from '../../components/thailand/PreparedState';
import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import EntryCompletionCalculator from '../../utils/EntryCompletionCalculator';
import UserDataService from '../../services/data/UserDataService';
import { useThailandPrimaryButton } from '../../hooks/thailand';

const ThailandEntryFlowScreen = ({ navigation, route }) => {
  const { t, language } = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const passportParam = UserDataService.toSerializablePassport(route.params?.passport);
  
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
  
  // Passport selection state
  const [userId, setUserId] = useState(null);

  // Data change listener ref - fixed memory leak by using useRef
  const dataChangeUnsubscribeRef = React.useRef(null);

  // Primary button state - extracted to custom hook for better maintainability
  const primaryButtonState = useThailandPrimaryButton({
    completionPercent,
    arrivalDate,
    showSupersededStatus,
    entryPackStatus,
  });

  // Load data on component mount and when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();

      // Set up data change listener
      dataChangeUnsubscribeRef.current = UserDataService.addDataChangeListener((event) => {
        console.log('Data change event received in ThailandEntryFlowScreen:', event);

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

      return () => {
        // Cleanup listener on unmount/blur
        if (dataChangeUnsubscribeRef.current) {
          dataChangeUnsubscribeRef.current();
          dataChangeUnsubscribeRef.current = null;
        }
      };
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

      // Load all user data - use currentUserId directly instead of userId state
      const allUserData = await UserDataService.getAllUserData(currentUserId);
      console.log('Loaded user data for completion calculation:', allUserData);

      // Load fund items - use currentUserId directly
      const fundItems = await UserDataService.getFundItems(currentUserId);

      // Load travel info for Thailand - use currentUserId directly
      const destinationId = route.params?.destination?.id || 'thailand';
      const travelInfo = await UserDataService.getTravelInfo(currentUserId, destinationId);
      
      // Prepare entry info for completion calculation
      const passportInfo = allUserData.passport || {};
      const personalInfoFromStore = allUserData.personalInfo || {};
      const normalizedPersonalInfo = { ...personalInfoFromStore };

      // Gender removed from personalInfo - use passport data directly
      // Gender normalization logic removed - handled by passport model

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

      // Check for entry info and resubmission warnings (non-blocking) - use currentUserId directly
      loadEntryInfoStatus(currentUserId).catch(error => {
        console.log('Entry info status check failed, continuing without it:', error);
      });
      
    } catch (error) {
      console.error('Failed to load entry flow data:', error);
      
      // Fallback to empty state on error
      setCompletionPercent(0);
      setCompletionStatus('needs_improvement');
      setCategories([
        {
          id: 'passport',
          name: '护照信息',
          icon: '📘',
          status: 'incomplete',
          completedCount: 0,
          totalCount: 5,
          missingFields: ['passportNumber', 'fullName', 'nationality', 'dateOfBirth', 'expiryDate'],
        },
        {
          id: 'personal',
          name: '护照信息',
          icon: '👤',
          status: 'incomplete',
          completedCount: 0,
          totalCount: 4,
          missingFields: ['occupation', 'phoneNumber', 'email', 'gender'],
        },
        {
          id: 'funds',
          name: '资金证明',
          icon: '💰',
          status: 'incomplete',
          completedCount: 0,
          totalCount: 1,
          missingFields: ['fundItems'],
        },
        {
          id: 'travel',
          name: '旅行信息',
          icon: '✈️',
          status: 'incomplete',
          completedCount: 0,
          totalCount: 4,
          missingFields: ['arrivalDate', 'flightNumber', 'accommodation', 'travelPurpose'],
        },
      ]);
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

      // Find entry info for Thailand
      const destinationId = route.params?.destination?.id || 'thailand';
      const thailandEntryInfo = allEntryInfos?.find(info =>
        info.destinationId === destinationId || info.destinationId === 'thailand'
      );

      if (thailandEntryInfo) {
        // Check if this entry info has a successful DAC submission
        const latestDAC = await EntryInfoService.getLatestSuccessfulDigitalArrivalCard(thailandEntryInfo.id, 'TDAC');

        if (latestDAC) {
          // Has successful DAC - consider it "submitted"
          setEntryPackStatus('submitted');
          setShowSupersededStatus(latestDAC.status === 'superseded');

          // Check for pending resubmission warnings
          try {
            const warning = UserDataService.getResubmissionWarning(thailandEntryInfo.id);
            if (warning) {
              setResubmissionWarning(warning);
            }
          } catch (warningError) {
            console.log('Resubmission warning check failed:', warningError);
          }

          console.log('Entry info status loaded:', {
            entryInfoId: thailandEntryInfo.id,
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
      // Don't let entry info status loading failure block the main UI
      setEntryPackStatus(null);
      setShowSupersededStatus(false);
      setResubmissionWarning(null);
    }
  };

  const handleResubmissionWarning = async (warning, action) => {
    try {
      if (action === 'resubmit') {
        // Mark entry pack as superseded and navigate to edit
        await UserDataService.markEntryPackAsSuperseded(warning.entryPackId, {
          changedFields: warning.diffResult.changedFields,
          changeReason: 'user_confirmed_resubmission'
        });

        // Clear the warning
        setResubmissionWarning(null);
        setShowSupersededStatus(true);

        // Navigate to edit screen
        navigation.navigate('ThailandTravelInfo', {
          passport: passportParam,
          destination: route.params?.destination,
          resubmissionMode: true
        });
      } else if (action === 'ignore') {
        // Clear the warning but don't mark as superseded
        UserDataService.clearResubmissionWarning(warning.entryPackId);
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
    // Navigate back to ThailandTravelInfoScreen
    navigation.navigate('ThailandTravelInfo', {
      passport: passportParam,
      destination: route.params?.destination,
    });
  };

  const handlePreviewEntryCard = () => {
    // Navigate to EntryPackPreview to show the complete entry pack preview
    navigation.navigate('EntryPackPreview', {
      userData,
      passport: passportParam,
      destination: route.params?.destination,
      entryPackData: {
        personalInfo: userData?.personalInfo,
        travelInfo: userData?.travel,
        funds: userData?.funds,
        tdacSubmission: null // Will be populated when TDAC is submitted
      }
    });
  };



  const handleCategoryPress = (category) => {
    // Navigate back to ThailandTravelInfoScreen with the specific section expanded
    // This will be enhanced in future tasks to expand the correct section
    navigation.navigate('ThailandTravelInfo', {
      expandSection: category.id,
      passport: passportParam,
      destination: route.params?.destination,
    });
  };


  const handlePrimaryAction = async () => {
    const buttonState = primaryButtonState;
    
    switch (buttonState.action) {
      case 'continue_improving':
        // Navigate back to ThailandTravelInfoScreen
        navigation.navigate('ThailandTravelInfo', {
          passport: passportParam,
          destination: route.params?.destination,
        });
        break;
      case 'submit_tdac':
        // Navigate to TDAC submission screen with complete traveler info
        try {
          // Build complete traveler context from user data
          const userId = passportParam?.id || 'user_001';
          const ThailandTravelerContextBuilder = require('../../services/thailand/ThailandTravelerContextBuilder').default;
          const contextResult = await ThailandTravelerContextBuilder.buildThailandTravelerContext(userId);
          
          if (contextResult.success) {
            console.log('✅ Built traveler context for TDAC submission:', {
              hasPassportNo: !!contextResult.payload.passportNo,
              hasFullName: !!contextResult.payload.familyName && !!contextResult.payload.firstName,
              hasArrivalDate: !!contextResult.payload.arrivalDate,
              hasEmail: !!contextResult.payload.email,
              warnings: contextResult.warnings
            });
            
            // Show warnings if any (but still allow submission since validation passed)
            if (contextResult.warnings && contextResult.warnings.length > 0) {
              Alert.alert(
                '⚠️ 数据提醒',
                '以下信息需要注意：\n\n• ' + contextResult.warnings.join('\n• ') + '\n\n数据验证通过，可以继续提交。',
                [
                  {
                    text: '完善信息',
                    onPress: () => {
                      navigation.navigate('ThailandTravelInfo', {
                        passport: passportParam,
                        destination: route.params?.destination,
                      });
                    }
                  },
                  {
                    text: '继续提交',
                    style: 'default',
                    onPress: () => {
                      navigation.navigate('TDACSelection', {
                        passport: passportParam,
                        destination: route.params?.destination,
                        travelerInfo: contextResult.payload,
                      });
                    }
                  }
                ]
              );
            } else {
              // No warnings, proceed directly
              navigation.navigate('TDACSelection', {
                passport: passportParam,
                destination: route.params?.destination,
                travelerInfo: contextResult.payload,
              });
            }
          } else {
            console.error('❌ Failed to build traveler context:', contextResult.errors);
            Alert.alert(
              '❌ TDAC提交要求严格',
              '泰国入境卡(TDAC)要求所有信息必须完整准确，不能使用默认值。\n\n必须完善的信息：\n\n• ' + contextResult.errors.join('\n• ') + '\n\n请返回完善所有必需信息后再提交。',
              [
                {
                  text: '立即完善',
                  style: 'default',
                  onPress: () => {
                    navigation.navigate('ThailandTravelInfo', {
                      passport: passportParam,
                      destination: route.params?.destination,
                      highlightMissingFields: true, // Flag to highlight missing fields
                    });
                  }
                },
                { text: '取消', style: 'cancel' }
              ]
            );
          }
        } catch (error) {
          console.error('❌ Error building traveler context:', error);
          Alert.alert(
            '系统错误',
            '构建旅行者信息时出错，请稍后重试。',
            [{ text: '确定' }]
          );
        }
        break;
      case 'view_entry_pack':
        // Navigate to entry pack preview screen (not detail, as it's not submitted yet)
        handlePreviewEntryCard();
        break;
      case 'resubmit_tdac':
        // Handle resubmission - navigate to edit screen first
        navigation.navigate('ThailandTravelInfo', {
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


  const hasNoEntryData = completionPercent === 0 && categories.every(cat => cat.completedCount === 0);

  const renderPrimaryAction = () => {
    const buttonState = primaryButtonState;
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
  };



  const renderContent = () => (
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

      {hasNoEntryData ? (
        <NoDataState
          styles={styles}
          onGetStarted={handleEditInformation}
        />
      ) : (
        <PreparedState
          styles={styles}
          colors={colors}
          completionPercent={completionPercent}
          completionStatus={completionStatus}
          arrivalDate={arrivalDate}
          userData={userData}
          passport={passportParam}
          destination={route.params?.destination}
          t={t}
          onEditInformation={handleEditInformation}
          onPreviewEntryCard={handlePreviewEntryCard}
          onNavigateToGuide={(params) => navigation.navigate('ThailandEntryGuide', params)}
          renderPrimaryAction={renderPrimaryAction}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={handleGoBack}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>
          我的泰国之旅 🌺
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
          <Text style={styles.flag}>🇹🇭</Text>
          <Text style={styles.title}>
            我的泰国之旅准备好了吗？🌺
          </Text>
          <Text style={styles.subtitle}>
            看看你准备得怎么样，一起迎接泰国冒险！
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {t('thailand.entryFlow.loading', { defaultValue: '正在加载准备状态...' })}
            </Text>
          </View>
        ) : (
          renderContent()
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



  // Integrated Countdown & Submission Section Styles
  countdownSection: {
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Action Section Styles (now only for secondary actions)
  actionSection: {
    marginBottom: spacing.lg,
  },
  actionButtonsContainer: {
    gap: spacing.md,
  },
  primaryActionContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(7, 193, 96, 0.15)',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryActionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  secondaryActionIcon: {
    fontSize: 24,
  },
  secondaryActionContent: {
    flex: 1,
  },
  secondaryActionTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  secondaryActionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  secondaryActionArrow: {
    ...typography.body2,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 18,
    marginLeft: spacing.sm,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  entryGuideIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  entryGuideContent: {
    flex: 1,
  },
  entryGuideTitle: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  entryGuideSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  entryGuideIcon: {
    fontSize: 24,
  },
  entryGuideChevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  entryGuideArrow: {
    ...typography.body1,
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },

  // Additional action buttons styles
  additionalActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  additionalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  additionalActionIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  additionalActionText: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
    fontSize: 13,
  },
});

export default ThailandEntryFlowScreen;
