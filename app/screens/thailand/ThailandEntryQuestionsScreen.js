// 入境通 - Thailand Entry Questions Screen (泰国入境常见问题)
// 基于旅客档案生成预填答案的入境问题列表，方便移民官检查

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { useTranslation } from '../../i18n/LocaleContext';
import BackButton from '../../components/BackButton';
import ThailandEntryGuideService from '../../services/entryGuide/ThailandEntryGuideService';
import EntryInfoService from '../../services/EntryInfoService';

const ThailandEntryQuestionsScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { entryPackId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [travelerProfile, setTravelerProfile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('zh');
  const [showOnlyRequired, setShowOnlyRequired] = useState(false);

  const guideService = useMemo(() => new ThailandEntryGuideService(), []);

  // 加载旅客档案和生成问题
  useEffect(() => {
    loadTravelerProfileAndQuestions();
  }, [entryPackId, selectedLanguage, showOnlyRequired]);

  const loadTravelerProfileAndQuestions = async () => {
    try {
      setLoading(true);

      if (!entryPackId) {
        Alert.alert('错误', '缺少入境包信息');
        navigation.goBack();
        return;
      }

      // 加载入境包数据
      const entryPack = await EntryInfoService.getEntryInfo(entryPackId);

      if (!entryPack) {
        Alert.alert('错误', '无法加载入境包');
        navigation.goBack();
        return;
      }

      // 构建旅客档案对象
      const profile = {
        travelInfo: {
          travelPurpose: entryPack.travel_purpose || 'HOLIDAY',
          arrivalArrivalDate: entryPack.arrival_date,
          departureDepartureDate: entryPack.departure_date,
          arrivalFlightNumber: entryPack.arrival_flight,
          departureFlightNumber: entryPack.departure_flight,
          hotelName: entryPack.hotel_name,
          hotelAddress: entryPack.hotel_address,
          accommodationType: entryPack.accommodation_type || 'HOTEL',
          province: entryPack.province,
          recentStayCountry: entryPack.recent_stay_country,
          visaNumber: entryPack.visa_number,
        },
        passport: {
          fullName: entryPack.full_name,
          nationality: entryPack.nationality,
        },
        personalInfo: {
          occupation: entryPack.occupation,
          email: entryPack.email,
        },
      };

      setTravelerProfile(profile);

      // 生成问题和答案
      const generatedQuestions = guideService.generateQuestionsWithAnswers(
        profile,
        {
          language: selectedLanguage,
          includeOptional: !showOnlyRequired,
        }
      );

      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Failed to load traveler profile:', error);
      Alert.alert('错误', '加载入境问题失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
  };

  const handleToggleRequired = () => {
    setShowOnlyRequired(!showOnlyRequired);
  };

  const renderLanguageSelector = () => (
    <View style={styles.languageSelector}>
      <Text style={styles.selectorLabel}>语言 / Language:</Text>
      <View style={styles.languageButtons}>
        {['zh', 'en', 'th'].map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[
              styles.languageButton,
              selectedLanguage === lang && styles.languageButtonActive,
            ]}
            onPress={() => handleLanguageChange(lang)}
          >
            <Text
              style={[
                styles.languageButtonText,
                selectedLanguage === lang && styles.languageButtonTextActive,
              ]}
            >
              {lang === 'zh' ? '中文' : lang === 'en' ? 'English' : 'ไทย'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFilterToggle = () => (
    <TouchableOpacity
      style={styles.filterToggle}
      onPress={handleToggleRequired}
    >
      <View style={styles.filterToggleContent}>
        <Text style={styles.filterToggleText}>
          {showOnlyRequired ? '仅显示必填问题' : '显示全部问题'}
        </Text>
        <Text style={styles.filterToggleCount}>
          ({questions.length} 个问题)
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderQuestionCard = (item, index) => {
    const categoryColors = {
      basic: colors.primary,
      holiday: colors.success,
      business: colors.info,
      health: colors.warning,
      finance: colors.accent,
      visa: colors.secondary,
    };

    const categoryColor = categoryColors[item.category] || colors.gray;

    return (
      <View key={item.id} style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <View style={styles.questionNumberBadge}>
            <Text style={styles.questionNumber}>{index + 1}</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          {item.required && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>必填</Text>
            </View>
          )}
        </View>

        <View style={styles.questionContent}>
          <Text style={styles.questionText}>{item.question}</Text>

          <View style={styles.answerSection}>
            <Text style={styles.answerLabel}>答案 / Answer:</Text>
            <View style={styles.answerBox}>
              <Text style={styles.answerText}>{item.answer}</Text>
            </View>
          </View>

          {item.tips && item.tips.length > 0 && (
            <View style={styles.tipsSection}>
              <Text style={styles.tipsLabel}>💡 提示:</Text>
              {item.tips.map((tip, idx) => (
                <Text key={idx} style={styles.tipText}>
                  • {tip}
                </Text>
              ))}
            </View>
          )}

          {item.suggestedAnswers && item.suggestedAnswers.length > 1 && (
            <View style={styles.suggestedSection}>
              <Text style={styles.suggestedLabel}>其他可选答案:</Text>
              {item.suggestedAnswers.slice(1).map((suggestion, idx) => (
                <Text key={idx} style={styles.suggestedText}>
                  • {suggestion}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>
          ชุดคำถาม-คำตอบสำหรับเจ้าหน้าที่
        </Text>
        <Text style={styles.headerSubtitle}>
          Immigration Questions & Answers
        </Text>
        <Text style={styles.headerSubtitleZh}>
          入境常见问题及答案
        </Text>
      </View>
      <View style={styles.headerDescription}>
        <Text style={styles.descriptionText}>
          📋 基于您的旅行信息预填的常见入境问题答案，可向移民官员展示
        </Text>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.footerInfo}>
        <Text style={styles.footerIcon}>ℹ️</Text>
        <Text style={styles.footerText}>
          这些答案基于您提交的入境信息自动生成。如移民官提出其他问题，请如实回答。
        </Text>
      </View>
      <View style={styles.footerInstructions}>
        <Text style={styles.instructionsTitle}>使用说明：</Text>
        <Text style={styles.instructionText}>
          1. 向移民官展示此页面作为参考
        </Text>
        <Text style={styles.instructionText}>
          2. 可切换语言以便沟通
        </Text>
        <Text style={styles.instructionText}>
          3. 必填问题已用徽章标记
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>加载入境问题...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.topBarTitle}>入境问题</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderLanguageSelector()}
        {renderFilterToggle()}

        <View style={styles.questionsContainer}>
          {questions.length > 0 ? (
            questions.map((question, index) => renderQuestionCard(question, index))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📭</Text>
              <Text style={styles.emptyStateText}>
                暂无可显示的问题
              </Text>
              <Text style={styles.emptyStateHint}>
                请确保您的入境信息已完整填写
              </Text>
            </View>
          )}
        </View>

        {questions.length > 0 && renderFooter()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  topBarSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitleContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  headerSubtitleZh: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  headerDescription: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: spacing.md,
    borderRadius: 12,
  },
  descriptionText: {
    ...typography.small,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 20,
  },
  languageSelector: {
    padding: spacing.md,
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectorLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  languageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  languageButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: colors.primary,
  },
  languageButtonText: {
    ...typography.body,
    color: colors.text,
  },
  languageButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  filterToggle: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterToggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterToggleText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  filterToggleCount: {
    ...typography.small,
    color: colors.textSecondary,
  },
  questionsContainer: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  questionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  questionNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  questionNumber: {
    ...typography.small,
    color: colors.white,
    fontWeight: 'bold',
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  categoryText: {
    ...typography.tiny,
    color: colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  requiredBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.error,
  },
  requiredText: {
    ...typography.tiny,
    color: colors.white,
    fontWeight: '600',
  },
  questionContent: {
    padding: spacing.md,
  },
  questionText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  answerSection: {
    marginBottom: spacing.md,
  },
  answerLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  answerBox: {
    backgroundColor: colors.lightGray,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  answerText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  tipsSection: {
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  tipsLabel: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tipText: {
    ...typography.small,
    color: colors.text,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  suggestedSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  suggestedLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  suggestedText: {
    ...typography.small,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.infoLight,
    borderRadius: 8,
  },
  footerIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  footerText: {
    ...typography.small,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  footerInstructions: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  instructionsTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  instructionText: {
    ...typography.small,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyStateText: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptyStateHint: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default ThailandEntryQuestionsScreen;
