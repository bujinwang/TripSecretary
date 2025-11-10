// 入境通 - Copy Write Mode Screen (抄写模式)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import Card from '../components/Card';
import BackButton from '../components/BackButton';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useTranslation } from '../i18n/LocaleContext';
import UserDataService from '../services/data/UserDataService';
import type { PersonalInfoData, SerializablePassport, TravelInfoData } from '../types/data';
import type { DestinationParam, RootStackScreenProps } from '../types/navigation';

type CopyWriteModeParams = {
  passport?: SerializablePassport | null;
  destination?: DestinationParam;
  travelInfo?: TravelInfoData | null;
  userId?: string;
};

type CopyWriteModeScreenProps = RootStackScreenProps<'CopyWrite'> & {
  route: RootStackScreenProps<'CopyWrite'>['route'] & {
    params?: CopyWriteModeParams;
  };
};

const DEFAULT_FONT_SIZE = 24;
const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 32;

const CopyWriteModeScreen: React.FC<CopyWriteModeScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const {
    passport: rawPassport,
    destination,
    travelInfo,
    userId: routeUserId,
  } = route.params ?? {};
  const passport = UserDataService.toSerializablePassport(rawPassport ?? null);
  const userId = routeUserId ?? passport?.userId ?? passport?.id ?? rawPassport?.id ?? 'user_001';
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData | null>(null);
  const [fullPassport, setFullPassport] = useState<SerializablePassport | null>(passport);
  const [loadedTravelInfo, setLoadedTravelInfo] = useState<TravelInfoData | null>(
    travelInfo ?? null,
  );

  // Check destination for conditional content
  const isJapan = destination?.id === 'jp' || destination?.name === '日本';

  useEffect(() => {
    // Load user data from database
    const loadUserData = async (): Promise<void> => {
      try {
        await UserDataService.initialize(userId);

        // Load passport data
        const passportData = await UserDataService.getPassport(userId).catch(() => null);
        if (passportData) {
          setFullPassport(passportData);
        }

        // Load personal info
        const personalData = await UserDataService.getPersonalInfo(userId).catch(() => null);
        if (personalData) {
          setPersonalInfo(personalData);
        }

        // Load travel info based on destination
        if (destination?.id) {
          const destId =
            destination.id === 'jp'
              ? 'jp'
              : destination.id === 'th'
                ? 'th'
                : destination.id === 'ca'
                  ? 'canada'
                  : destination.id;
          const travelData = await UserDataService.getTravelInfo(userId, destId).catch(() => null);
          if (travelData) {
            setLoadedTravelInfo(travelData);
          }
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUserData();

    // 保持屏幕常亮，防止抄写时黑屏
    const keepAwake = async (): Promise<void> => {
      try {
        await activateKeepAwakeAsync();
      } catch {
        // Failed to activate keep awake
      }
    };

    keepAwake();

    return () => {
      try {
        deactivateKeepAwake();
      } catch {
        // Failed to deactivate keep awake
      }
    };
  }, [destination?.id, isJapan, userId]);

  const increaseFontSize = (): void => {
    setFontSize((current) => (current < MAX_FONT_SIZE ? current + 2 : current));
  };

  const decreaseFontSize = (): void => {
    setFontSize((current) => (current > MIN_FONT_SIZE ? current - 2 : current));
  };

  // 格式化日期
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) {
      return '';
    }
    // 确保格式为 YYYY-MM-DD
    return dateStr;
  };

  // Parse passport full name (format: "SURNAME, GIVEN NAME MIDDLE NAME")
  const getPassportNames = (): {
    surname: string;
    givenName: string;
    fullGivenNames: string;
  } => {
    const fallbackName =
      fullPassport && 'nameEn' in fullPassport
        ? (fullPassport as { nameEn?: string }).nameEn
        : undefined;
    const fullName = fullPassport?.fullName ?? fallbackName ?? '';
    if (fullName.includes(',')) {
      const [surname, givenNames] = fullName.split(',').map((s) => s.trim());
      // Extract first given name only (exclude middle name)
      const givenName = givenNames.split(' ')[0];
      return { surname, givenName, fullGivenNames: givenNames };
    } else if (fullName.includes(' ')) {
      // Legacy format: "GIVEN SURNAME" or "GIVEN MIDDLE SURNAME"
      const parts = fullName.split(' ');
      return {
        surname: parts[parts.length - 1],
        givenName: parts[0],
        fullGivenNames: parts.slice(0, -1).join(' '),
      };
    }
    return { surname: fullName, givenName: '', fullGivenNames: '' };
  };

  const { surname, givenName } = getPassportNames();

  // 根据目的地显示不同的表格字段
  const getFormFields = () => {
    const isJapan = destination?.id === 'jp' || destination?.name === '日本';

    if (isJapan) {
      // 日本入境卡和海关申报单
      return [
        {
          section: t('copyWriteMode.japanLandingCard'),
          sectionEn: 'Landing Card (Blue Form)',
          fields: [
            {
              label: `${t('copyWriteMode.familyName')} (Family Name)`,
              value: surname,
              instruction: t('copyWriteMode.instructionFamilyName'),
            },
            {
              label: `${t('copyWriteMode.givenName')} (Given Name)`,
              value: givenName,
              instruction: t('copyWriteMode.instructionGivenName'),
            },
            {
              label: `${t('copyWriteMode.dateOfBirth')} (Date of Birth)`,
              value: fullPassport?.dateOfBirth || fullPassport?.birthDate || '',
              instruction: t('copyWriteMode.instructionDateOfBirth'),
            },
            {
              label: `${t('copyWriteMode.nationality')} (Nationality)`,
              value: fullPassport?.nationality || '',
              instruction: t('copyWriteMode.instructionNationality'),
            },
            {
              label: `${t('copyWriteMode.passportNumber')} (Passport Number)`,
              value: fullPassport?.passportNumber || fullPassport?.passportNo || '',
              instruction: t('copyWriteMode.instructionPassportNumber'),
            },
            {
              label: `${t('copyWriteMode.flightNumber')} (Flight Number)`,
              value: loadedTravelInfo?.arrivalFlightNumber || loadedTravelInfo?.flightNumber || '',
              instruction: t('copyWriteMode.instructionFlightNumber'),
            },
            {
              label: `${t('copyWriteMode.purposeOfVisit')} (Purpose of Visit)`,
              value: loadedTravelInfo?.travelPurpose || loadedTravelInfo?.customTravelPurpose || 'TOURISM',
              instruction: t('copyWriteMode.instructionPurposeOfVisit'),
            },
            {
              label: `${t('copyWriteMode.addressInJapan')} (Address in Japan)`,
              value: loadedTravelInfo?.hotelAddress || loadedTravelInfo?.accommodationAddress || '',
              instruction: t('copyWriteMode.instructionAddressInJapan'),
              multiline: true,
            },
          ],
        },
        {
          section: t('copyWriteMode.japanCustomsDeclaration'),
          sectionEn: 'Customs Declaration (Yellow Form)',
          fields: [
            {
              label: `${t('copyWriteMode.name')} (Name)`,
              value: fullPassport?.name || fullPassport?.nameLocal || '',
              instruction: t('copyWriteMode.instructionName'),
            },
            {
              label: `${t('copyWriteMode.prohibitedItems')} (Prohibited Items?)`,
              value: 'NO',
              instruction: t('copyWriteMode.instructionProhibitedItems'),
            },
            {
              label: `${t('copyWriteMode.cashOverLimit')} (Cash > ¥10,000?)`,
              value: 'NO',
              instruction: t('copyWriteMode.instructionTruthfulAnswer'),
            },
            {
              label: `${t('copyWriteMode.commercialGoods')} (Commercial Goods?)`,
              value: 'NO',
              instruction: t('copyWriteMode.instructionTruthfulAnswer'),
            },
            {
              label: `${t('copyWriteMode.totalValueOfGoods')} (Total Value of Goods)`,
              value: loadedTravelInfo?.goodsValue || '¥0',
              instruction: t('copyWriteMode.instructionTotalValue'),
            },
          ],
        },
      ];
    } else {
      // E311 表格 (加拿大)
      const e311Fields = [
        {
          section: t('copyWriteMode.canadaPart1'),
          sectionEn: 'Part 1: Traveler Information',
          fields: [
            {
              label: `${t('copyWriteMode.lastName')} (Last Name)`,
              value: surname,
              instruction: t('copyWriteMode.instructionLastName'),
            },
            {
              label: `${t('copyWriteMode.firstName')} (First Name)`,
              value: givenName,
              instruction: t('copyWriteMode.instructionFirstName'),
            },
            {
              label: `${t('copyWriteMode.middleInitial')} (Initial)`,
              value: '',
              instruction: t('copyWriteMode.instructionMiddleInitial'),
            },
            {
              label: `${t('copyWriteMode.dateOfBirth')} (Date of Birth)`,
              value: fullPassport?.dateOfBirth || fullPassport?.birthDate || '',
              instruction: t('copyWriteMode.instructionDateOfBirthDash'),
            },
            {
              label: `${t('copyWriteMode.citizenship')} (Citizenship)`,
              value: fullPassport?.nationality || '',
              instruction: t('copyWriteMode.instructionCitizenship'),
            },
          ],
        },
        {
          section: t('copyWriteMode.canadaPart2'),
          sectionEn: 'Part 2: Address Information',
          fields: [
            {
              label: `${t('copyWriteMode.homeAddress')} (Home Address)`,
              value: loadedTravelInfo?.hotelAddress || '',
              instruction: t('copyWriteMode.instructionCanadaAddress'),
              multiline: true,
            },
            {
              label: `${t('copyWriteMode.postalCode')} (Postal/ZIP Code)`,
              value: '',
              instruction: t('copyWriteMode.instructionPostalCode'),
            },
          ],
        },
        {
          section: t('copyWriteMode.canadaPart3'),
          sectionEn: 'Part 3: Travel Details',
          fields: [
            {
              label: `${t('copyWriteMode.airlineFlightNumber')} (Airline/Flight Number)`,
              value: loadedTravelInfo?.flightNumber || '',
              instruction: t('copyWriteMode.instructionFlightNumberCanada'),
            },
            {
              label: `${t('copyWriteMode.arrivalDate')} (Arrival Date)`,
              value: formatDate(loadedTravelInfo?.arrivalDate) || '',
              instruction: t('copyWriteMode.instructionDateFormat'),
            },
            {
              label: `${t('copyWriteMode.arrivingFrom')} (Arriving From)`,
              value: personalInfo?.residentCountry || fullPassport?.nationality || '',
              instruction: t('copyWriteMode.instructionArrivingFrom'),
            },
            {
              label: `${t('copyWriteMode.purposeOfTrip')} (Purpose of Trip)`,
              value: loadedTravelInfo?.travelPurpose === '旅游' ? 'Personal' :
                     loadedTravelInfo?.travelPurpose === '商务' ? 'Business' :
                     loadedTravelInfo?.travelPurpose === '学习' ? 'Study' : 'Personal',
              instruction: t('copyWriteMode.instructionPurposeOptions'),
            },
          ],
        },
        {
          section: t('copyWriteMode.canadaPart4'),
          sectionEn: 'Part 4: Customs Declaration (Check YES or NO)',
          fields: [
            {
              label: t('copyWriteMode.currencyOverLimit'),
              labelEn: 'Currency/monetary instruments ≥ CAN$10,000?',
              value: loadedTravelInfo?.hasHighCurrency === '是' ? '✓ YES' : '✗ NO',
              instruction: t('copyWriteMode.instructionTruthfulAnswer'),
              highlight: loadedTravelInfo?.hasHighCurrency === '是',
            },
            {
              label: t('copyWriteMode.commercialGoodsForResale'),
              labelEn: 'Commercial goods, samples, or goods for resale?',
              value: loadedTravelInfo?.hasCommercialGoods === '是' ? '✓ YES' : '✗ NO',
              instruction: t('copyWriteMode.instructionTruthfulAnswer'),
              highlight: loadedTravelInfo?.hasCommercialGoods === '是',
            },
            {
              label: t('copyWriteMode.foodPlantsAnimals'),
              labelEn: 'Food, plants, animals, or related products?',
              value: loadedTravelInfo?.visitedFarm === '是' || loadedTravelInfo?.carryingFood === '是' ? '✓ YES' : '✗ NO',
              instruction: t('copyWriteMode.instructionFoodItems'),
              highlight: loadedTravelInfo?.visitedFarm === '是' || loadedTravelInfo?.carryingFood === '是',
            },
            {
              label: t('copyWriteMode.visitedFarm'),
              labelEn: 'Visited a farm or been in contact with farm animals?',
              value: loadedTravelInfo?.visitedFarm === '是' ? '✓ YES' : '✗ NO',
              instruction: t('copyWriteMode.instructionTruthfulAnswer'),
              highlight: loadedTravelInfo?.visitedFarm === '是',
            },
            {
              label: t('copyWriteMode.firearms'),
              labelEn: 'Firearms or weapons?',
              value: loadedTravelInfo?.hasFirearms === '是' ? '✓ YES' : '✗ NO',
              instruction: t('copyWriteMode.instructionTruthfulAnswer'),
              highlight: loadedTravelInfo?.hasFirearms === '是',
            },
            {
              label: t('copyWriteMode.exceedsDutyFree'),
              labelEn: 'Goods exceed duty-free allowance?',
              value: loadedTravelInfo?.exceedsDutyFree === '是' ? '✓ YES' : '✗ NO',
              instruction: t('copyWriteMode.instructionGiftsLimit'),
              highlight: loadedTravelInfo?.exceedsDutyFree === '是',
            },
          ],
        },
      ];
      return e311Fields;
    }
  }

  const formFields = getFormFields();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          showLabel={false}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('copyWriteMode.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.icon}>✍️</Text>
          <Text style={styles.title}>{t('copyWriteMode.title')}</Text>
          <Text style={styles.subtitle}>
            {t('copyWriteMode.subtitle')}
          </Text>
          <Text style={styles.description}>
            {t('copyWriteMode.description')}
          </Text>
        </View>

        {/* Font Size Controls */}
        <View style={styles.fontControls}>
          <Text style={styles.fontLabel}>{t('copyWriteMode.fontSizeLabel')}</Text>
          <TouchableOpacity
            style={styles.fontButton}
            onPress={decreaseFontSize}
          >
            <Text style={styles.fontButtonText}>A-</Text>
          </TouchableOpacity>
          <Text style={styles.fontCurrent}>{fontSize}pt</Text>
          <TouchableOpacity
            style={styles.fontButton}
            onPress={increaseFontSize}
          >
            <Text style={styles.fontButtonText}>A+</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <Card style={styles.instructionCard}>
          <Text style={styles.instructionIcon}>💡</Text>
          <Text style={styles.instructionTitle}>{t('copyWriteMode.instructionsTitle')}</Text>
          <Text style={styles.instructionText}>
            {t('copyWriteMode.step1')}
            {'\n\n'}
            {t('copyWriteMode.step2')}
            {'\n\n'}
            {t('copyWriteMode.step3')}
          </Text>
        </Card>

        {/* Form Fields */}
        <View style={styles.formSections}>
          {formFields.map((section, sectionIndex) => (
            <View key={sectionIndex}>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { fontSize: fontSize + 2 }]}>
                  {section.section}
                </Text>
                <Text style={styles.sectionTitleEn}>
                  {section.sectionEn}
                </Text>
              </View>

              {/* Fields */}
              {section.fields.map((field, fieldIndex) => (
                <Card
                  key={fieldIndex}
                  style={[
                    styles.fieldCard,
                    field.highlight && styles.fieldCardHighlight,
                  ]}
                >
                  <View style={styles.fieldNumber}>
                    <Text style={styles.fieldNumberText}>
                      {sectionIndex + 1}.{fieldIndex + 1}
                    </Text>
                  </View>

                  <View style={styles.fieldContent}>
                    <Text style={[styles.fieldLabel, { fontSize }]}>
                      {field.label}
                    </Text>
                    {field.labelEn && (
                      <Text style={styles.fieldLabelEn}>
                        {field.labelEn}
                      </Text>
                    )}

                    <View style={[
                      styles.fieldValueBox,
                      field.multiline && styles.fieldValueBoxMultiline,
                    ]}>
                      <Text
                        style={[
                          styles.fieldValue,
                          { fontSize: fontSize + 4 },
                        ]}
                        selectable
                      >
                        {field.value || t('copyWriteMode.valueLeaveBlank')}
                      </Text>
                    </View>

                    {field.instruction && (
                      <View style={styles.fieldInstructionBox}>
                        <Text style={styles.fieldInstructionIcon}>ℹ️</Text>
                        <Text style={[styles.fieldInstruction, { fontSize: fontSize - 4 }]}>
                          {field.instruction}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              ))}
            </View>
          ))}
        </View>

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <Text style={styles.tipsIcon}>⚠️</Text>
          <Text style={[styles.tipsTitle, { fontSize }]}>
            {t('copyWriteMode.tipsTitle')}
          </Text>
          <Text style={[styles.tipsText, { fontSize: fontSize - 2 }]}>
            {isJapan ? (
              <>
                • {t('copyWriteMode.tipJapan1')}
                {'\n\n'}
                • {t('copyWriteMode.tipJapan2')}
                {'\n\n'}
                • {t('copyWriteMode.tipJapan3')}
                {'\n\n'}
                • {t('copyWriteMode.tipJapan4')}
                {'\n\n'}
                • {t('copyWriteMode.tipJapan5')}
              </>
            ) : (
              <>
                • {t('copyWriteMode.tipCanada1')}
                {'\n\n'}
                • {t('copyWriteMode.tipCanada2')}
                {'\n\n'}
                • {t('copyWriteMode.tipCanada3')}
                {'\n\n'}
                • {t('copyWriteMode.tipCanada4')}
                {'\n\n'}
                • {t('copyWriteMode.tipCanada5')}
              </>
            )}
          </Text>
        </Card>

        {/* Sample Card */}
        <Card style={styles.sampleCard}>
          <Text style={styles.sampleIcon}>📄</Text>
          <Text style={[styles.sampleTitle, { fontSize }]}>
            {isJapan ? t('copyWriteMode.sampleTitleJapan') : t('copyWriteMode.sampleTitleCanada')}
          </Text>
          <View style={styles.sampleImagePlaceholder}>
            <Text style={styles.sampleImageText}>
              {isJapan ? t('copyWriteMode.sampleImageTitleJapan') : t('copyWriteMode.sampleImageTitleCanada')}
              {'\n\n'}
              {t('copyWriteMode.sampleSubtitle')}
              {'\n\n'}
              {t('copyWriteMode.sampleDescription')}
            </Text>
          </View>
        </Card>

        {/* Bottom Tip */}
        <View style={styles.bottomTip}>
          <Text style={styles.bottomTipIcon}>✨</Text>
          <Text style={[styles.bottomTipText, { fontSize: fontSize - 2 }]}>
            {t('copyWriteMode.bottomTipTitle')}
            {'\n'}
            {t('copyWriteMode.bottomTipDescription')}
          </Text>
        </View>

        <View style={{ height: spacing.xxl }} />
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
  titleSection: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  fontLabel: {
    ...typography.body1,
    color: colors.text,
    marginRight: spacing.sm,
  },
  fontButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.medium,
    marginHorizontal: spacing.xs,
  },
  fontButtonText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  fontCurrent: {
    ...typography.body1,
    color: colors.text,
    marginHorizontal: spacing.sm,
  },
  instructionCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.primaryLight,
  },
  instructionIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  instructionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  instructionText: {
    ...typography.body1,
    color: colors.text,
    lineHeight: 28,
  },
  formSections: {
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  sectionTitleEn: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  fieldCard: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  fieldCardHighlight: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  fieldNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  fieldNumberText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: 'bold',
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    ...typography.body2,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  fieldLabelEn: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  fieldValueBox: {
    backgroundColor: '#F5F5F5',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 2,
    borderColor: colors.primary,
    minHeight: 60,
    justifyContent: 'center',
  },
  fieldValueBoxMultiline: {
    minHeight: 100,
  },
  fieldValue: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  fieldInstructionBox: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.small,
  },
  fieldInstructionIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  fieldInstruction: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  tipsCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: '#FFF3E0',
  },
  tipsIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  tipsTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  tipsText: {
    ...typography.body1,
    color: colors.text,
    lineHeight: 28,
  },
  bold: {
    fontWeight: 'bold',
    color: colors.error,
  },
  sampleCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  sampleIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  sampleTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  sampleImagePlaceholder: {
    height: 200,
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  sampleImageText: {
    ...typography.body1,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomTip: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    padding: spacing.md,
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  bottomTipIcon: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  bottomTipText: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
    lineHeight: 24,
  },
});

export default CopyWriteModeScreen;
