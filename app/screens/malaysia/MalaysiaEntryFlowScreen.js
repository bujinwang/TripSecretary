// 入境通 - Malaysia Entry Flow Screen (马来西亚入境准备状态)
import React, { useState, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import CompletionSummaryCard from '../../components/CompletionSummaryCard';
import SubmissionCountdown from '../../components/SubmissionCountdown';

import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import UserDataService from '../../services/data/UserDataService';

const MalaysiaEntryFlowScreen = ({ navigation, route }) => {
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

      // Load travel info for Malaysia
      const destinationId = route.params?.destination?.id || 'malaysia';
      const travelInfo = await UserDataService.getTravelInfo(currentUserId, destinationId);

      // Prepare entry info for completion calculation
      const passportInfo = allUserData.passport || {};
      const personalInfoFromStore = allUserData.personalInfo || {};
      const fundsInfo = allUserData.funds || [];

      const entryInfo = {
        passport: passportInfo,
        personalInfo: personalInfoFromStore,
        travel: travelInfo || {},
        funds: fundsInfo,
        lastUpdatedAt: new Date().toISOString()
      };

      setUserData(entryInfo);

      // Extract arrival date for display
      const arrivalDateFromTravel = travelInfo?.arrivalArrivalDate || travelInfo?.arrivalDate;
      setArrivalDate(arrivalDateFromTravel);

      // Calculate completion for Malaysia (no funds required)
      const completionSummary = calculateMalaysiaCompletion(entryInfo);

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
          name: t('malaysia.entryFlow.categories.passport', { defaultValue: '护照信息' }),
          icon: '📘',
          status: completionSummary.categorySummary.passport.state,
          completedCount: completionSummary.categorySummary.passport.completed,
          totalCount: completionSummary.categorySummary.passport.total,
          missingFields: completionSummary.missingFields.passport || [],
        },
        {
          id: 'personal',
          name: t('malaysia.entryFlow.categories.personal', { defaultValue: '个人信息' }),
          icon: '👤',
          status: completionSummary.categorySummary.personalInfo.state,
          completedCount: completionSummary.categorySummary.personalInfo.completed,
          totalCount: completionSummary.categorySummary.personalInfo.total,
          missingFields: completionSummary.missingFields.personalInfo || [],
        },
        {
          id: 'travel',
          name: t('malaysia.entryFlow.categories.travel', { defaultValue: '旅行信息' }),
          icon: '✈️',
          status: completionSummary.categorySummary.travel.state,
          completedCount: completionSummary.categorySummary.travel.completed,
          totalCount: completionSummary.categorySummary.travel.total,
          missingFields: completionSummary.missingFields.travel || [],
        },
      ];

      setCategories(categoryData);

    } catch (error) {
      console.error('Failed to load Malaysia entry flow data:', error);

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
          name: '个人信息',
          icon: '👤',
          status: 'incomplete',
          completedCount: 0,
          totalCount: 6,
          missingFields: ['occupation', 'phoneNumber', 'email', 'gender', 'residentCountry'],
        },
        {
          id: 'travel',
          name: '旅行信息',
          icon: '✈️',
          status: 'incomplete',
          completedCount: 0,
          totalCount: 4,
          missingFields: ['arrivalDate', 'flightNumber', 'hotelAddress', 'stayDuration'],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate Malaysia-specific completion (no funds section)
  const calculateMalaysiaCompletion = (entryInfo) => {
    const passport = entryInfo.passport || {};
    const personalInfo = entryInfo.personalInfo || {};
    const travel = entryInfo.travel || {};

    // Passport fields
    const passportFields = {
      passportNumber: passport.passportNumber,
      fullName: passport.fullName,
      nationality: passport.nationality,
      dateOfBirth: passport.dateOfBirth,
      expiryDate: passport.expiryDate,
    };

    const passportCompleted = Object.values(passportFields).filter(v => v && String(v).trim()).length;
    const passportTotal = Object.keys(passportFields).length;
    const passportMissing = Object.keys(passportFields).filter(k => !passportFields[k] || !String(passportFields[k]).trim());

    // Personal info fields
    const personalFields = {
      occupation: personalInfo.occupation,
      phoneNumber: personalInfo.phoneNumber,
      email: personalInfo.email,
      gender: passport.gender, // Gender stored in passport
      residentCountry: personalInfo.countryRegion,
      phoneCode: personalInfo.phoneCode,
    };

    const personalCompleted = Object.values(personalFields).filter(v => v && String(v).trim()).length;
    const personalTotal = Object.keys(personalFields).length;
    const personalMissing = Object.keys(personalFields).filter(k => !personalFields[k] || !String(personalFields[k]).trim());

    // Travel info fields
    const travelFields = {
      arrivalDate: travel.arrivalArrivalDate || travel.arrivalDate,
      flightNumber: travel.arrivalFlightNumber,
      hotelAddress: travel.hotelAddress,
      stayDuration: travel.lengthOfStay,
    };

    const travelCompleted = Object.values(travelFields).filter(v => v && String(v).trim()).length;
    const travelTotal = Object.keys(travelFields).length;
    const travelMissing = Object.keys(travelFields).filter(k => !travelFields[k] || !String(travelFields[k]).trim());

    // Calculate overall completion (3 sections for Malaysia)
    const totalCompleted = passportCompleted + personalCompleted + travelCompleted;
    const totalFields = passportTotal + personalTotal + travelTotal;
    const totalPercent = totalFields > 0 ? Math.round((totalCompleted / totalFields) * 100) : 0;

    return {
      totalPercent,
      categorySummary: {
        passport: {
          state: passportCompleted === passportTotal ? 'complete' : passportCompleted > 0 ? 'partial' : 'incomplete',
          completed: passportCompleted,
          total: passportTotal,
        },
        personalInfo: {
          state: personalCompleted === personalTotal ? 'complete' : personalCompleted > 0 ? 'partial' : 'incomplete',
          completed: personalCompleted,
          total: personalTotal,
        },
        travel: {
          state: travelCompleted === travelTotal ? 'complete' : travelCompleted > 0 ? 'partial' : 'incomplete',
          completed: travelCompleted,
          total: travelTotal,
        },
      },
      missingFields: {
        passport: passportMissing,
        personalInfo: personalMissing,
        travel: travelMissing,
      }
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleEditInformation = () => {
    // Navigate back to MalaysiaTravelInfoScreen
    navigation.navigate('MalaysiaTravelInfo', {
      passport: passportParam,
      destination: route.params?.destination,
    });
  };

  const handlePreviewEntryCard = () => {
    // Navigate to Entry Pack Preview
    navigation.navigate('MalaysiaEntryPackPreview', {
      userData,
      passport: passportParam,
      destination: route.params?.destination,
      entryPackData: {
        personalInfo: userData?.personalInfo,
        travelInfo: userData?.travel,
        funds: userData?.funds || [],
        mdacSubmission: null,
      },
    });
  };

  const handleCategoryPress = (category) => {
    // Navigate back to MalaysiaTravelInfoScreen with the specific section expanded
    navigation.navigate('MalaysiaTravelInfo', {
      expandSection: category.id,
      passport: passportParam,
      destination: route.params?.destination,
    });
  };

  const handlePrimaryAction = async () => {
    const buttonState = getPrimaryButtonState();

    switch (buttonState.action) {
      case 'continue_improving':
        // Navigate back to MalaysiaTravelInfoScreen
        navigation.navigate('MalaysiaTravelInfo', {
          passport: passportParam,
          destination: route.params?.destination,
        });
        break;
      case 'submit_mdac':
        // Navigate to MDAC submission screen
        navigation.navigate('MDACSelection', {
          passport: passportParam,
          destination: route.params?.destination,
        });
        break;
      case 'view_entry_pack':
        // Navigate to entry pack preview screen
        handlePreviewEntryCard();
        break;
      default:
        // Button is disabled, no action
        break;
    }
  };

  const getPrimaryButtonState = () => {
    // Check completion status
    const isComplete = completionPercent === 100;

    // If completion is high enough, show entry pack option
    if (completionPercent >= 80 && isComplete) {
      return {
        title: '提交入境卡',
        action: 'submit_mdac',
        disabled: false,
        variant: 'primary'
      };
    } else if (completionPercent >= 60) {
      return {
        title: '查看我的通关包 📋',
        action: 'view_entry_pack',
        disabled: false,
        variant: 'primary',
        subtitle: '看看你已经准备好的入境信息'
      };
    } else if (!isComplete) {
      return {
        title: '继续准备我的马来西亚之旅 💪',
        action: 'continue_improving',
        disabled: false,
        variant: 'secondary'
      };
    } else {
      return {
        title: '提交入境卡',
        action: 'submit_mdac',
        disabled: false,
        variant: 'primary'
      };
    }
  };

  const hasNoEntryData = completionPercent === 0 && categories.every(cat => cat.completedCount === 0);

  const renderPrimaryAction = () => {
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
  };

  const renderNoDataState = () => (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataIcon}>📝</Text>
      <Text style={styles.noDataTitle}>
        准备开始马来西亚之旅吧！🌴
      </Text>
      <Text style={styles.noDataDescription}>
        你还没有填写马来西亚入境信息，别担心，我们会一步步帮你准备好所有需要的资料，让你轻松入境马来西亚！
      </Text>

      {/* Example/Tutorial hints */}
      <View style={styles.noDataHints}>
        <Text style={styles.noDataHintsTitle}>
          马来西亚入境需要准备这些信息 🌺
        </Text>
        <View style={styles.noDataHintsList}>
          <Text style={styles.noDataHint}>• 📘 护照信息 - 让马来西亚认识你</Text>
          <Text style={styles.noDataHint}>• 📞 联系方式 - 马来西亚怎么找到你</Text>
          <Text style={styles.noDataHint}>• ✈️ 航班和住宿 - 你的旅行计划</Text>
        </View>
      </View>

      <Button
        title="开始我的马来西亚准备之旅！🇲🇾"
        onPress={handleEditInformation}
        variant="primary"
        style={styles.noDataButton}
      />
    </View>
  );

  const renderPreparedState = () => (
    <View>
      {/* Status Cards Section */}
      <View style={styles.statusSection}>
        <CompletionSummaryCard
          completionPercent={completionPercent}
          status={completionStatus}
          showProgressBar={true}
        />

        {/* Additional Action Buttons - Show when completion is high */}
        {completionPercent >= 80 && (
          <View style={styles.additionalActionsContainer}>
            <TouchableOpacity
              style={styles.additionalActionButton}
              onPress={handleEditInformation}
            >
              <Text style={styles.additionalActionIcon}>✏️</Text>
              <Text style={styles.additionalActionText}>再改改</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.additionalActionButton}
              onPress={() => {
                // Show sharing options
                Alert.alert(
                  '寻求帮助',
                  '您可以截图分享给亲友，让他们帮您检查信息是否正确。',
                  [
                    {
                      text: '截图分享',
                      onPress: () => {
                        Alert.alert('提示', '请使用手机截图功能分享给亲友查看');
                      }
                    },
                    { text: '取消', style: 'cancel' }
                  ]
                );
              }}
            >
              <Text style={styles.additionalActionIcon}>👥</Text>
              <Text style={styles.additionalActionText}>找亲友帮忙修改</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Integrated Countdown & Submission Section */}
      <View style={styles.countdownSection}>
        <Text style={styles.sectionTitle}>
          最佳提交时间 ⏰
        </Text>

        {/* Submission Countdown */}
        <SubmissionCountdown
          arrivalDate={arrivalDate}
          locale={t('locale', { defaultValue: 'zh' })}
          showIcon={true}
          updateInterval={1000}
        />

        {/* Smart Primary Action Button - Integrated with Countdown */}
        <View style={styles.primaryActionContainer}>
          {renderPrimaryAction()}
        </View>
      </View>

      {/* Secondary Actions Section */}
      <View style={styles.actionSection}>
        {/* Entry Guide Button */}
        <TouchableOpacity
          style={styles.entryGuideButton}
          onPress={() => navigation.navigate('MalaysiaEntryGuide', {
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
                查看马来西亚入境指引
              </Text>
              <Text style={styles.entryGuideSubtitle}>
                完整入境流程指南
              </Text>
            </View>
            <View style={styles.entryGuideChevron}>
              <Text style={styles.entryGuideArrow}>›</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary Actions - Redesigned */}
        {completionPercent > 50 && (
          <View style={styles.secondaryActionsContainer}>
            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={handlePreviewEntryCard}
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
    </View>
  );

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {hasNoEntryData ? renderNoDataState() : renderPreparedState()}
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
          我的马来西亚之旅 🌴
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
          <Text style={styles.flag}>🇲🇾</Text>
          <Text style={styles.title}>
            我的马来西亚之旅准备好了吗？🌴
          </Text>
          <Text style={styles.subtitle}>
            看看你准备得怎么样，一起迎接马来西亚冒险！
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {t('malaysia.entryFlow.loading', { defaultValue: '正在加载准备状态...' })}
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

export default MalaysiaEntryFlowScreen;
