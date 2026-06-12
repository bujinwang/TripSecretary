// 入境通 - Present to Customs Screen (向海关出示)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { translateField } from '../utils/translations';
import BackButton from '../components/BackButton';
import UserDataService from '../services/data/UserDataService';
import { useLocale } from '../i18n/LocaleContext';

const PresentToCustomsScreen = ({ navigation, route }: { navigation: { goBack: () => void }; route: { params?: Record<string, unknown> } }) => {
  const { t, language } = useLocale();
  const rawParams = (route.params || {}) as Record<string, unknown>;
  const rawPassport = rawParams.passport;
  const destination = rawParams.destination as Record<string, unknown> | undefined;
  const travelInfo = rawParams.travelInfo as Record<string, unknown> | undefined;
  const passport = UserDataService.toSerializablePassport(rawPassport);
  
  const destLang = language;

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
    if (travelInfo?.departureDate) {
      return travelInfo.departureDate;
    }
    if (travelInfo?.arrivalDate && travelInfo?.stayDuration) {
      const arrival = new Date(travelInfo.arrivalDate);
      const days = parseInt(travelInfo.stayDuration) || 7;
      arrival.setDate(arrival.getDate() + days);
      return arrival.toISOString().split('T')[0];
    }
    return t('common.notAvailable', { defaultValue: 'N/A' });
  };

  // 获取目的地国家的名称（根据目的地语言）
  const getDestinationName = (destId: string | undefined) => {
    const nameMap: Record<string, Record<string, string>> = {
      'hk': { 'zh-CN': '香港', 'zh-TW': '香港', 'en': 'Hong Kong' },
      'tw': { 'zh-CN': '台湾', 'zh-TW': '台灣', 'en': 'Taiwan' },
      'th': { 'zh-CN': '泰国', 'en': 'Thailand' },
      'jp': { 'zh-CN': '日本', 'ja': '日本', 'en': 'Japan' },
      'kr': { 'zh-CN': '韩国', 'ko': '한국', 'en': 'South Korea' },
      'sg': { 'zh-CN': '新加坡', 'en': 'Singapore' },
      'my': { 'zh-CN': '马来西亚', 'en': 'Malaysia' },
      'us': { 'zh-CN': '美国', 'en': 'United States' },
      'ca': { 'zh-CN': '加拿大', 'en': 'Canada' },
      'au': { 'zh-CN': '澳大利亚', 'en': 'Australia' },
      'nz': { 'zh-CN': '新西兰', 'en': 'New Zealand' },
      'gb': { 'zh-CN': '英国', 'en': 'United Kingdom' },
      'fr': { 'zh-CN': '法国', 'en': 'France' },
      'de': { 'zh-CN': '德国', 'en': 'Germany' },
      'it': { 'zh-CN': '意大利', 'en': 'Italy' },
      'es': { 'zh-CN': '西班牙', 'en': 'Spain' },
    };
    return nameMap[destId]?.[language] || nameMap[destId]?.['en'] || destination?.name || '';
  };

  // 将中文旅行目的转换为英文key
  const convertPurposeToKey = (chinesePurpose: string | undefined) => {
    const purposeMap: Record<string, string> = {
      '旅游': 'tourism',
      '商务': 'business',
      '探亲': 'visiting',
      '学习': 'study',
      '工作': 'work',
    };
    return (chinesePurpose ? purposeMap[chinesePurpose] : undefined) || 'tourism';
  };

  const formData = [
    { label: fields.fullName, value: passport?.nameEn || passport?.name, important: true },
    { label: fields.passportNumber, value: passport?.passportNo, important: true },
    { label: fields.flightNumber, value: travelInfo?.flightNumber, important: true },
    { label: fields.arrivalDate, value: travelInfo?.arrivalDate, important: true },
    { label: translateField('departureDate', destination?.id, language), value: calculateDepartureDate(), important: true },
    { label: fields.purposeOfVisit, value: translateField(convertPurposeToKey(travelInfo?.travelPurpose), destination?.id, language), important: true },
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
          <Text style={styles.backTextPrimary}>{translateField('back', destination?.id, language)}</Text>
          {/* 如果目的地语言不是中文，显示简体中文帮助老人 */}
          {destLang !== 'zh-CN' && destLang !== 'zh-TW' && (
            <Text style={styles.backTextSecondary}>{t('common.back', { defaultValue: '返回' })}</Text>
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
          <Text style={styles.titleSub}>{translateField('entryInformation', destination?.id, language)}</Text>
        </View>

        {/* Most Important Info - Highlighted */}
        <View style={styles.importantSection}>
          <Text style={styles.sectionTitle}>✓ {translateField('keyInformation', destination?.id, language)}</Text>
          {formData.filter(item => item.important).map((item, index) => (
            <View key={index} style={styles.formRowImportant}>
              <Text style={styles.labelPrimaryImportant}>{item.label}</Text>
              <View style={styles.valueContainerImportant}>
                <Text style={styles.valueTextImportant}>{item.value || t('common.notAvailable', { defaultValue: 'N/A' })}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Additional Details */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{translateField('additionalDetails', destination?.id, language)}</Text>
          {formData.filter(item => !item.important).map((item, index) => (
            <View key={index} style={styles.formRow}>
              <Text style={styles.labelPrimary}>{item.label}</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.valueText}>{item.value || t('common.notAvailable', { defaultValue: 'N/A' })}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Common Questions Quick Reference */}
        <View style={styles.qaSection}>
          <Text style={styles.sectionTitle}>💬 {translateField('commonQuestions', destination?.id, language)}</Text>
          <View style={styles.qaCard}>
            <Text style={styles.qaQuestion}>
              {translateField('purposeOfVisit', destination?.id, language)}?
            </Text>
            <Text style={styles.qaAnswer}>
              {translateField(convertPurposeToKey(travelInfo?.travelPurpose), destination?.id, language)}
            </Text>
          </View>
          <View style={styles.qaCard}>
            <Text style={styles.qaQuestion}>
              {translateField('howLongStay', destination?.id, language)}
            </Text>
            <Text style={styles.qaAnswer}>
              {travelInfo?.stayDuration || '7'} {translateField('days', destination?.id, language)}
            </Text>
          </View>
          <View style={styles.qaCard}>
            <Text style={styles.qaQuestion}>
              {translateField('returnFlightDate', destination?.id, language)}
            </Text>
            <Text style={styles.qaAnswer}>
              {calculateDepartureDate()}
            </Text>
          </View>
        </View>

        {/* Customs Declaration - Canada E311 */}
        {(destination?.id === 'ca' || destination?.name === '加拿大') && travelInfo && (
          <View style={styles.customsSection}>
            <Text style={styles.sectionTitle}>🛃 {translateField('customsDeclaration', destination?.id, language)}</Text>
            
            <View style={styles.declarationCard}>
              <Text style={styles.declarationQuestion}>
                {translateField('arrivingFromCountry', destination?.id, language)}
              </Text>
              <Text style={styles.declarationAnswer}>
                {travelInfo.arrivingFrom === '美国' || travelInfo.arrivingFrom === 'United States' 
                  ? t('customs.usa', { defaultValue: 'U.S.A.' })
                  : t('customs.otherCountry', { defaultValue: 'Other Country' })}
              </Text>
            </View>

            <View style={styles.declarationCard}>
              <Text style={styles.declarationQuestion}>
                {translateField('currencyOverLimit', destination?.id, language)}
              </Text>
              <Text style={[styles.declarationAnswer, (travelInfo.hasHighCurrency === '是' || travelInfo.hasHighCurrency === true) && styles.declarationAnswerYes]}>
                {(travelInfo.hasHighCurrency === '是' || travelInfo.hasHighCurrency === true) 
                  ? t('customs.yes', { defaultValue: 'YES ✓' })
                  : t('customs.no', { defaultValue: 'NO' })}
              </Text>
            </View>

            <View style={styles.declarationCard}>
              <Text style={styles.declarationQuestion}>
                {translateField('exceedsDutyFree', destination?.id, language)}
              </Text>
              <Text style={[styles.declarationAnswer, (travelInfo.exceedsDutyFree === '是' || travelInfo.exceedsDutyFree === true) && styles.declarationAnswerYes]}>
                {(travelInfo.exceedsDutyFree === '是' || travelInfo.exceedsDutyFree === true)
                  ? t('customs.yes', { defaultValue: 'YES ✓' })
                  : t('customs.no', { defaultValue: 'NO' })}
              </Text>
            </View>

            <View style={styles.declarationCard}>
              <Text style={styles.declarationQuestion}>
                {translateField('hasFirearms', destination?.id, language)}
              </Text>
              <Text style={[styles.declarationAnswer, (travelInfo.hasFirearms === '是' || travelInfo.hasFirearms === true) && styles.declarationAnswerYes]}>
                {(travelInfo.hasFirearms === '是' || travelInfo.hasFirearms === true)
                  ? t('customs.yes', { defaultValue: 'YES ✓' })
                  : t('customs.no', { defaultValue: 'NO' })}
              </Text>
            </View>

            <View style={styles.declarationCard}>
              <Text style={styles.declarationQuestion}>
                {translateField('hasCommercialGoods', destination?.id, language)}
              </Text>
              <Text style={[styles.declarationAnswer, (travelInfo.hasCommercialGoods === '是' || travelInfo.hasCommercialGoods === true) && styles.declarationAnswerYes]}>
                {(travelInfo.hasCommercialGoods === '是' || travelInfo.hasCommercialGoods === true)
                  ? t('customs.yes', { defaultValue: 'YES ✓' })
                  : t('customs.no', { defaultValue: 'NO' })}
              </Text>
            </View>

            <View style={styles.declarationCard}>
              <Text style={styles.declarationQuestion}>
                {translateField('hasFoodAnimals', destination?.id, language)}
              </Text>
              <Text style={[styles.declarationAnswer, (travelInfo.visitedFarm === '是' || travelInfo.visitedFarm === true) && styles.declarationAnswerYes]}>
                {(travelInfo.visitedFarm === '是' || travelInfo.visitedFarm === true)
                  ? t('customs.yes', { defaultValue: 'YES ✓' })
                  : t('customs.no', { defaultValue: 'NO' })}
              </Text>
            </View>
          </View>
        )}

        {/* QR Code Placeholder (for future implementation) */}
        <View style={styles.qrSection}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrText}>{t('common.qrCode', { defaultValue: 'QR Code' })}</Text>
            <Text style={styles.qrSubtext}>{translateField('scanForDetails', destination?.id, language)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('common.generatedBy', { defaultValue: 'Generated by BorderBuddy' })}</Text>
          <Text style={styles.footerTimestamp}>
            {(() => {
              const now = new Date();
              const date = now.toLocaleDateString(language);
              const time = now.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
              return `${date} ${time}`;
            })()}
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
