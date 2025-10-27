// 入境通 - Malaysia Entry Flow Screen (马来西亚入境准备状态)
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

  const handleCategoryPress = (category) => {
    // Navigate back to MalaysiaTravelInfoScreen
    navigation.navigate('MalaysiaTravelInfo', {
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
      default:
        // Button is disabled, no action
        break;
    }
  };

  const getPrimaryButtonState = () => {
    // Check completion status
    const isComplete = completionPercent === 100;

    if (isComplete) {
      return {
        title: t('malaysia.entryFlow.actions.submitMDAC', { defaultValue: '提交入境卡' }),
        action: 'submit_mdac',
        disabled: false,
        variant: 'primary'
      };
    } else {
      return {
        title: t('malaysia.entryFlow.actions.continueImproving', { defaultValue: '继续完善信息' }),
        action: 'continue_improving',
        disabled: false,
        variant: 'secondary',
        subtitle: t('malaysia.entryFlow.actions.improvingSubtitle', {
          defaultValue: '还差一点就完成了！'
        })
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
        {t('malaysia.entryFlow.noData.title', { defaultValue: '让我们开始准备马来西亚之旅吧！' })}
      </Text>
      <Text style={styles.noDataDescription}>
        {t('malaysia.entryFlow.noData.description', {
          defaultValue: '点击下方按钮，开始填写入境信息'
        })}
      </Text>
      <Button
        title={t('malaysia.entryFlow.noData.button', { defaultValue: '开始填写' })}
        onPress={handleEditInformation}
        variant="primary"
        style={styles.noDataButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={handleGoBack}
          label={t('common.back')}
        />
        <Text style={styles.headerTitle}>
          {t('malaysia.entryFlow.headerTitle', { defaultValue: '马来西亚入境准备' })}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          style={styles.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.heroFlag}>🇲🇾</Text>
          <Text style={styles.heroTitle}>
            {t('malaysia.entryFlow.hero.title', { defaultValue: '马来西亚之旅准备' })}
          </Text>
          <Text style={styles.heroSubtitle}>
            {arrivalDate
              ? t('malaysia.entryFlow.hero.subtitleWithDate', {
                  date: arrivalDate,
                  defaultValue: `抵达日期: ${arrivalDate}`
                })
              : t('malaysia.entryFlow.hero.subtitle', {
                  defaultValue: '让我们一起准备你的入境信息'
                })
            }
          </Text>
        </LinearGradient>

        {hasNoEntryData ? renderNoDataState() : (
          <>
            {/* Completion Summary Card */}
            <View style={styles.summaryContainer}>
              <CompletionSummaryCard
                completionPercent={completionPercent}
                completionStatus={completionStatus}
                categories={categories}
                onCategoryPress={handleCategoryPress}
                onEditPress={handleEditInformation}
                country="malaysia"
              />
            </View>

            {/* Action Cards */}
            <View style={styles.actionCardsContainer}>
              <Text style={styles.actionCardsTitle}>快速操作</Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  navigation.navigate('MalaysiaEntryGuide', {
                    passport: passportParam,
                    destination: route.params?.destination,
                    completionData: userData,
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: '#34C75915' }]}>
                  <Text style={styles.actionIcon}>📋</Text>
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>查看马来西亚入境指引</Text>
                  <Text style={styles.actionSubtitle}>7步骤完整入境流程指南</Text>
                </View>
                <Text style={[styles.actionArrow, { color: '#34C759' }]}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
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
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: '#007AFF15' }]}>
                  <Text style={styles.actionIcon}>📦</Text>
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>看看我的通关包</Text>
                  <Text style={styles.actionSubtitle}>快速查看旅途资料</Text>
                </View>
                <Text style={[styles.actionArrow, { color: '#007AFF' }]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Information Notice */}
            <View style={styles.noticeBox}>
              <Text style={styles.noticeIcon}>💡</Text>
              <Text style={styles.noticeText}>
                {t('malaysia.entryFlow.notice', {
                  defaultValue: '马来西亚入境卡(MDAC)需要完整的个人和旅行信息。请确保所有信息准确无误。'
                })}
              </Text>
            </View>

            {/* Primary Action Button */}
            <View style={styles.actionContainer}>
              {renderPrimaryAction()}
            </View>

            {/* Privacy Notice */}
            <View style={styles.privacyBox}>
              <Text style={styles.privacyIcon}>🔒</Text>
              <Text style={styles.privacyText}>
                {t('malaysia.entryFlow.privacy', {
                  defaultValue: '您的所有信息仅保存在手机本地，我们重视您的隐私安全'
                })}
              </Text>
            </View>
          </>
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
  headerTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  heroGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 20,
  },
  heroFlag: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  summaryContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  actionCardsContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  actionCardsTitle: {
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
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  noticeIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#D97706',
    lineHeight: 18,
  },
  actionContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  primaryActionButton: {
    marginBottom: spacing.sm,
  },
  primaryActionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  privacyBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  privacyIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: '#34C759',
    lineHeight: 18,
  },
  noDataContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  noDataIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  noDataDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  noDataButton: {
    minWidth: 200,
  },
});

export default MalaysiaEntryFlowScreen;
