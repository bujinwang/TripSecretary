/**
  * TDAC Selection Screen - Redesigned for User Experience
  * 让用户选择最适合的入境卡提交方式，聚焦于用户体验而非技术细节
  */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';
import BackButton from '../../components/BackButton';
// Removed mockTDACData dependency - using pure user data
import TDACSubmissionService from '../../services/thailand/TDACSubmissionService';

const TDACSelectionScreen = ({ navigation, route }) => {
  const incomingTravelerInfo = (route.params && route.params.travelerInfo) || {};
  
  /**
   * Sanitize sensitive data before logging
   * Masks passport numbers, emails, and phone numbers for security
   */
  const sanitizeForLogging = (data) => {
    if (!data) return data;

    const sanitized = { ...data };
    const sensitiveFields = ['passportNo', 'email', 'phoneNumber'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        const value = String(sanitized[field]);
        if (value.length > 4) {
          sanitized[field] = value.substring(0, 2) + '****' + value.substring(value.length - 2);
        } else {
          sanitized[field] = '****';
        }
      }
    });

    return sanitized;
  };

  // Log incoming data for debugging (sanitized)
  console.log('🔍 TDACSelectionScreen received travelerInfo:', {
    hasData: Object.keys(incomingTravelerInfo).length > 0,
    keys: Object.keys(incomingTravelerInfo),
    ...sanitizeForLogging({
      passportNo: incomingTravelerInfo.passportNo,
      familyName: incomingTravelerInfo.familyName,
      firstName: incomingTravelerInfo.firstName,
      arrivalDate: incomingTravelerInfo.arrivalDate,
      email: incomingTravelerInfo.email
    })
  });

  // Use pure user data directly - no mock data fallbacks
  const travelerInfo = incomingTravelerInfo;

  // Log user data for debugging (sanitized)
  console.log('🔍 Using pure user data:', sanitizeForLogging({
    passportNo: travelerInfo.passportNo,
    familyName: travelerInfo.familyName,
    firstName: travelerInfo.firstName,
    arrivalDate: travelerInfo.arrivalDate,
    email: travelerInfo.email,
    flightNo: travelerInfo.flightNo
  }));

  /**
   * Handle successful TDAC submission by creating/updating entry pack
   * This is called when user returns from successful TDAC submission
   */
  const handleTDACSubmissionSuccess = async (submissionData) => {
    const result = await TDACSubmissionService.handleTDACSubmissionSuccess(submissionData, travelerInfo);

    if (!result.success) {
      // Show error dialog if submission failed
      TDACSubmissionService.showErrorDialog(
        result.errorResult,
        () => {
          // Retry later
          console.log('User chose to retry later');
        },
        () => {
          // Continue anyway
          console.log('User chose to continue despite error');
        },
        async () => {
          // Contact support
          console.log('User chose to contact support');
        }
      );
    }
  };

  // Event-driven TDAC submission listener instead of polling AsyncStorage
  React.useEffect(() => {
    // Subscribe to TDAC submission events from UserDataService
    const UserDataService = require('../../services/data/UserDataService').default;

    const unsubscribe = UserDataService.addDataChangeListener((event) => {
      console.log('📡 TDAC submission event received:', event.type);

      if (event.type === 'TDAC_SUBMISSION_SUCCESS') {
        // Handle TDAC submission success event
        console.log('🎉 TDAC submission event received:', event.data);
        handleTDACSubmissionSuccess(event.data);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* 情感化头部 */}
        <LinearGradient
          colors={['#4c5bdc', '#6a48b8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.heroHeaderRow}>
            <BackButton
              onPress={() => navigation.goBack()}
              label="返回"
              style={styles.backButton}
              labelStyle={styles.backButtonLabel}
              iconStyle={styles.backButtonIcon}
            />
          </View>
          <Text style={styles.heroEmoji}>🌟</Text>
          <Text style={styles.heroTitle}>选择提交方式</Text>
          <Text style={styles.heroSubtitle}>快速完成泰国入境卡</Text>
        </LinearGradient>

      {/* 快速通道选项 */}
      <View style={styles.optionSection}>
        <TouchableOpacity
          style={[styles.optionCard, styles.recommendedCard]}
          onPress={() => navigation.navigate('TDACHybrid', { travelerInfo })}
          activeOpacity={0.8}
        >
          {/* 推荐徽章 */}
          <View style={styles.recommendationBadge}>
            <Text style={styles.recommendationIcon}>📱</Text>
            <Text style={styles.recommendationText}>推荐选择</Text>
          </View>

          {/* 标题区域 */}
          <View style={styles.cardHeader}>
            <Text style={styles.optionIcon}>⚡</Text>
            <View style={styles.titleSection}>
              <Text style={styles.optionTitle}>闪电提交</Text>
              <Text style={styles.optionSubtitle}>快速通道 · 智能验证</Text>
            </View>
          </View>

          {/* 核心优势 */}
          <View style={styles.benefitsSection}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>⏱️</Text>
              <View>
                <Text style={styles.benefitValue}>5-8秒</Text>
                <Text style={styles.benefitLabel}>闪电完成</Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <View>
                <Text style={styles.benefitValue}>95%+</Text>
                <Text style={styles.benefitLabel}>超高成功率</Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🚀</Text>
              <View>
                <Text style={styles.benefitValue}>快3倍</Text>
                <Text style={styles.benefitLabel}>比传统方式</Text>
              </View>
            </View>
          </View>

          {/* 用户利益 */}
          <View style={styles.userBenefits}>
            <Text style={styles.benefitSummary}>节省排队时间，提交后即可获得确认。</Text>
          </View>

          {/* 行动按钮 */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('TDACHybrid', { travelerInfo })}
          >
            <Text style={styles.actionButtonText}>使用闪电提交</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

        {/* 稳定通道选项 */}
        <View style={styles.optionSection}>
          <TouchableOpacity
            style={[styles.optionCard, styles.stableCard]}
            onPress={() => navigation.navigate('TDACWebView', { travelerInfo })}
            activeOpacity={0.8}
          >
            {/* 标题区域 */}
            <View style={styles.cardHeader}>
              <Text style={[styles.optionIcon, styles.stableIcon]}>🛡️</Text>
              <View style={styles.titleSection}>
                <Text style={[styles.optionTitle, styles.stableTitle]}>稳妥提交</Text>
                <Text style={[styles.optionSubtitle, styles.stableSubtitle]}>稳定通道 · 清晰可见</Text>
              </View>
            </View>

          {/* 核心指标 */}
          <View style={[styles.benefitsSection, styles.stableBenefitsSection]}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>⏱️</Text>
              <View>
                <Text style={[styles.benefitValue, styles.stableValue]}>24秒</Text>
                <Text style={styles.benefitLabel}>稳定完成</Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <View>
                <Text style={[styles.benefitValue, styles.stableValue]}>85%</Text>
                <Text style={styles.benefitLabel}>可靠成功率</Text>
              </View>
            </View>
          </View>

          {/* 用户利益 */}
          <View style={styles.userBenefits}>
            <Text style={styles.benefitSummary}>适合想亲自查看每一步的旅客。</Text>
          </View>

            {/* 行动按钮 */}
            <TouchableOpacity
              style={[styles.actionButton, styles.stableButton]}
              onPress={() => navigation.navigate('TDACWebView', { travelerInfo })}
            >
              <Text style={[styles.actionButtonText, styles.stableButtonText]}>选择稳妥方案</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* 智能推荐提示 */}
        <View style={styles.smartTipSection}>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>智能推荐</Text>
              <Text style={styles.tipText}>推荐闪电提交；如需完整流程，可随时切换稳妥方案。</Text>
            </View>
          </View>
        </View>

        {/* 底部鼓励信息 */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>我们会陪您完成整个流程，确保顺利提交。</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // 情感化头部区域
  heroSection: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonIcon: {
    color: colors.white,
  },
  backButtonLabel: {
    color: colors.white,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // 选项卡样式
  optionSection: {
    margin: 16,
    marginTop: 24,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  // 推荐选项样式
  recommendedCard: {
    borderWidth: 3,
    borderColor: '#4CAF50',
    backgroundColor: '#fafcfa',
  },

  // 推荐徽章
  recommendationBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationIcon: {
    color: colors.white,
    fontSize: 14,
    marginRight: 4,
  },
  recommendationText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // 卡片头部
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  stableIcon: {
    opacity: 0.8,
  },
  titleSection: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  stableTitle: {
    color: colors.text,
  },
  optionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  stableSubtitle: {
    opacity: 0.8,
  },

  // 优势展示区域
  benefitsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  stableBenefitsSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  benefitItem: {
    alignItems: 'center',
    flex: 1,
  },
  benefitIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  benefitValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  stableValue: {
    color: colors.textSecondary,
  },
  benefitLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // 用户利益区域
  userBenefits: {
    marginBottom: 24,
  },
  benefitSummary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // 行动按钮
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // 稳定选项按钮样式
  stableButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  stableButtonText: {
    color: '#4CAF50',
  },

  // 智能推荐提示
  smartTipSection: {
    margin: 16,
    marginTop: 8,
  },
  tipCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },

  // 底部鼓励区域
  footerSection: {
    margin: 16,
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default TDACSelectionScreen;
