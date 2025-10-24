// 入境通 - Present to Customs Screen (向海关出示)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { colors, typography, spacing } from '../theme';
import { translateField, getDestinationLanguage, DESTINATION_LANGUAGES } from '../utils/translations';
import BackButton from '../components/BackButton';
import UserDataService from '../services/data/UserDataService';

const PresentToCustomsScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination, travelInfo } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const { width, height } = useWindowDimensions();
  
  const destLang = getDestinationLanguage(destination?.id);
  const langInfo = DESTINATION_LANGUAGES[destination?.id] || { name: 'English', flag: '🌍' };

  // 翻译字段
  const fields = {
    fullName: translateField('fullName', destination?.id),
    passportNumber: translateField('passportNumber', destination?.id),
    flightNumber: translateField('flightNumber', destination?.id),
    arrivalDate: translateField('arrivalDate', destination?.id),
    hotelName: translateField('hotelName', destination?.id),
    hotelAddress: translateField('hotelAddress', destination?.id),
    contactPhone: translateField('contactPhone', destination?.id),
    purposeOfVisit: translateField('purposeOfVisit', destination?.id),
  };

  // Calculate departure date (if not provided)
  const calculateDepartureDate = () => {
    if (travelInfo?.departureDate) return travelInfo.departureDate;
    if (travelInfo?.arrivalDate && travelInfo?.stayDuration) {
      const arrival = new Date(travelInfo.arrivalDate);
      const days = parseInt(travelInfo.stayDuration) || 7;
      arrival.setDate(arrival.getDate() + days);
      return arrival.toISOString().split('T')[0];
    }
    return 'N/A';
  };

  // 获取目的地国家的名称（根据目的地语言）
  const getDestinationName = (destId) => {
    const destLang = getDestinationLanguage(destId);
    
    const nameMap = {
      'hk': {
        'zh-HK': '香港',
        'en': 'Hong Kong',
      },
      'tw': {
        'zh-TW': '台灣',
        'en': 'Taiwan',
      },
      'th': {
        'en': 'Thailand',
      },
      'jp': {
        'ja': '日本',
        'en': 'Japan',
      },
      'kr': {
        'ko': '한국',
        'en': 'South Korea',
      },
      'sg': {
        'en': 'Singapore',
      },
      'my': {
        'en': 'Malaysia',
      },
      'us': {
        'en': 'United States',
      },
      'ca': {
        'en': 'Canada',
      },
      'au': {
        'en': 'Australia',
      },
      'nz': {
        'en': 'New Zealand',
      },
      'gb': {
        'en': 'United Kingdom',
      },
      'fr': {
        'en': 'France',
      },
      'de': {
        'en': 'Germany',
      },
      'it': {
        'en': 'Italy',
      },
      'es': {
        'en': 'Spain',
      },
    };
    
    return nameMap[destId]?.[destLang] || nameMap[destId]?.['en'] || destination?.name || '';
  };

  // 将中文旅行目的转换为英文key
  const convertPurposeToKey = (chinesePurpose) => {
    const purposeMap = {
      '旅游': 'tourism',
      '商务': 'business',
      '探亲': 'visiting',
      '学习': 'study',
      '工作': 'work',
    };
    return purposeMap[chinesePurpose] || 'tourism';
  };

  const formData = [
    { label: fields.fullName, value: passport?.nameEn || passport?.name, important: true },
    { label: fields.passportNumber, value: passport?.passportNo, important: true },
    { label: fields.flightNumber, value: travelInfo?.flightNumber, important: true },
    { label: fields.arrivalDate, value: travelInfo?.arrivalDate, important: true },
    { label: translateField('departureDate', destination?.id), value: calculateDepartureDate(), important: true },
    { label: fields.purposeOfVisit, value: translateField(convertPurposeToKey(travelInfo?.travelPurpose), destination?.id), important: true },
    { label: fields.hotelName, value: travelInfo?.hotelName },
    { label: fields.hotelAddress, value: travelInfo?.hotelAddress },
    { label: fields.contactPhone, value: travelInfo?.contactPhone },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Full Width Back Button */}
      <BackButton
        onPress={() => navigation.goBack()}
        style={styles.headerBackButton}
        iconStyle={styles.backArrow}
      >
        <View style={styles.backTextContainer}>
          <Text style={styles.backTextPrimary}>{translateField('back', destination?.id)}</Text>
          {/* 如果目的地语言不是中文，显示简体中文帮助老人 */}
          {destLang !== 'zh-CN' && destLang !== 'zh-HK' && destLang !== 'zh-TW' && (
            <Text style={styles.backTextSecondary}>返回</Text>
          )}
        </View>
      </BackButton>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title - Large and Clear */}
        <View style={styles.titleSection}>
          <Text style={styles.titleMain}>{getDestinationName(destination?.id)}</Text>
          <Text style={styles.titleSub}>{translateField('entryInformation', destination?.id)}</Text>
        </View>

        {/* Most Important Info - Highlighted */}
        <View style={styles.importantSection}>
          <Text style={styles.sectionTitle}>✓ {translateField('keyInformation', destination?.id)}</Text>
          {formData.filter(item => item.important).map((item, index) => (
            <View key={index} style={styles.formRowImportant}>
              <Text style={styles.labelPrimaryImportant}>{item.label}</Text>
              <View style={styles.valueContainerImportant}>
                <Text style={styles.valueTextImportant}>{item.value || 'N/A'}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Additional Details */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{translateField('additionalDetails', destination?.id)}</Text>
          {formData.filter(item => !item.important).map((item, index) => (
            <View key={index} style={styles.formRow}>
              <Text style={styles.labelPrimary}>{item.label}</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.valueText}>{item.value || 'N/A'}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Common Questions Quick Reference */}
        <View style={styles.qaSection}>
          <Text style={styles.sectionTitle}>💬 {translateField('commonQuestions', destination?.id)}</Text>
          <View style={styles.qaCard}>
            <Text style={styles.qaQuestion}>
              {translateField('purposeOfVisit', destination?.id)}?
            </Text>
            <Text style={styles.qaAnswer}>
              {translateField(convertPurposeToKey(travelInfo?.travelPurpose), destination?.id)}
            </Text>
          </View>
          <View style={styles.qaCard}>
            <Text style={styles.qaQuestion}>
              {translateField('howLongStay', destination?.id)}
            </Text>
            <Text style={styles.qaAnswer}>
              {travelInfo?.stayDuration || '7'} {translateField('days', destination?.id)}
            </Text>
          </View>
          <View style={styles.qaCard}>
            <Text style={styles.qaQuestion}>
              {translateField('returnFlightDate', destination?.id)}
            </Text>
            <Text style={styles.qaAnswer}>
              {calculateDepartureDate()}
            </Text>
          </View>
        </View>

        {/* Customs Declaration - Canada E311 */}
        {(destination?.id === 'ca' || destination?.name === '加拿大') && travelInfo && (
          <View style={styles.customsSection}>
            <Text style={styles.sectionTitle}>🛃 {translateField('customsDeclaration', destination?.id)}</Text>
            
            <View style={styles.declarationCard}>
              <Text style={styles.declarationQuestion}>
                {translateField('arrivingFromCountry', destination?.id)}
              </Text>
              <Text style={styles.declarationAnswer}>
                {travelInfo.arrivingFrom === '美国' ? 'U.S.A.' : 'Other Country'}
              </Text>
            </View>

            <View style={styles.declarationCard}>
              <Text style={styles.declarationQuestion}>
                {translateField('currencyOverLimit', destination?.id)}
              </Text>
              <Text style={[styles.declarationAnswer, travelInfo.hasHighCurrency === '是' && styles.declarationAnswerYes]}>
                {travelInfo.hasHighCurrency === '是' ? 'YES ✓' : 'NO'}
              </Text>
            </View>

            <View style={styles.declarationCard}>
              <Text style={styles.declarationQuestion}>
                {translateField('exceedsDutyFree', destination?.id)}
              </Text>
              <Text style={[styles.declarationAnswer, travelInfo.exceedsDutyFree === '是' && styles.declarationAnswerYes]}>
                {travelInfo.exceedsDutyFree === '是' ? 'YES ✓' : 'NO'}
              </Text>
            </View>

            <View style={styles.declarationCard}>
              <Text style={styles.declarationQuestion}>
                {translateField('hasFirearms', destination?.id)}
              </Text>
              <Text style={[styles.declarationAnswer, travelInfo.hasFirearms === '是' && styles.declarationAnswerYes]}>
                {travelInfo.hasFirearms === '是' ? 'YES ✓' : 'NO'}
              </Text>
            </View>

            <View style={styles.declarationCard}>
              <Text style={styles.declarationQuestion}>
                {translateField('hasCommercialGoods', destination?.id)}
              </Text>
              <Text style={[styles.declarationAnswer, travelInfo.hasCommercialGoods === '是' && styles.declarationAnswerYes]}>
                {travelInfo.hasCommercialGoods === '是' ? 'YES ✓' : 'NO'}
              </Text>
            </View>

            <View style={styles.declarationCard}>
              <Text style={styles.declarationQuestion}>
                {translateField('hasFoodAnimals', destination?.id)}
              </Text>
              <Text style={[styles.declarationAnswer, travelInfo.visitedFarm === '是' && styles.declarationAnswerYes]}>
                {travelInfo.visitedFarm === '是' ? 'YES ✓' : 'NO'}
              </Text>
            </View>
          </View>
        )}

        {/* QR Code Placeholder (for future implementation) */}
        <View style={styles.qrSection}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrText}>QR Code</Text>
            <Text style={styles.qrSubtext}>{translateField('scanForDetails', destination?.id)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by BorderBuddy</Text>
          <Text style={styles.footerTimestamp}>
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  backArrow: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '300',
    marginRight: spacing.md,
  },
  backTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backTextPrimary: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: 'bold',
  },
  backTextSecondary: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
    marginBottom: spacing.xl,
  },
  titleMain: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  titleSub: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  importantSection: {
    backgroundColor: '#FFF9E6',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  formSection: {
    backgroundColor: colors.white,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  formRowImportant: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  formRow: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  labelPrimaryImportant: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  labelPrimary: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  valueContainerImportant: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  valueTextImportant: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
  },
  valueContainer: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: 8,
  },
  valueText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  qaSection: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
  },
  customsSection: {
    backgroundColor: '#FFF3E0',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  declarationCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  declarationQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  declarationAnswer: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  declarationAnswerYes: {
    color: '#FF9800',
  },
  qaCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  qaQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  qaAnswer: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.lg,
  },
  qrPlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  qrSubtext: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  footerText: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  footerTimestamp: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});

export default PresentToCustomsScreen;
