// 入境通 - Singapore SGAC Selection Screen (新加坡SGAC选择)
// 基于SGAC新加坡数字入境卡系统

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import UserDataService from '../../services/data/UserDataService';
import SingaporeEntryGuideService from '../../services/entryGuide/SingaporeEntryGuideService';
import type { RootStackScreenProps } from '../../types/navigation';
import type {
  SerializablePassport,
  PersonalInfoData,
  FundItemData,
  TravelInfoData,
  AllUserData,
} from '../../types/data';

type SGACMethod = 'online' | 'airport';

interface SGACOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  method: SGACMethod;
  requirements: string[];
}

interface SGACEntryInfo {
  passport: SerializablePassport | null;
  personalInfo: PersonalInfoData | null;
  funds: FundItemData[];
  travel: TravelInfoData | null;
}

type OptionStatus = 'ready' | 'incomplete' | 'unknown';

type SGACSelectionProps = RootStackScreenProps<'SGACSelection'>;

const OPTIONAL_WARNINGS: Record<SGACMethod, Set<string>> = {
  online: new Set(['sgac_missing']),
  airport: new Set(['sgac_missing', 'sgac_too_early', 'sgac_too_late']),
};

const mapUserDataToPayload = (data: SGACEntryInfo | null): Partial<AllUserData> | undefined => {
  if (!data) {
    return undefined;
  }

  return {
    passport: data.passport ?? undefined,
    personalInfo: data.personalInfo ?? undefined,
    funds: data.funds,
    travel: data.travel ?? undefined,
  };
};

const getDestinationId = (destination?: Record<string, unknown> | null): string => {
  if (destination && typeof destination === 'object' && 'id' in destination) {
    const idValue = (destination as { id?: unknown }).id;
    if (typeof idValue === 'string' && idValue.trim().length > 0) {
      return idValue;
    }
  }
  return 'sg';
};

const sgacOptions: SGACOption[] = [
  {
    id: 'online',
    title: '在线申请 SGAC',
    description: '通过新加坡移民局官方网站在线提交',
    icon: '🌐',
    method: 'online',
    requirements: ['有效的护照', '旅行信息', '联系方式', '资金证明'],
  },
  {
    id: 'airport',
    title: '机场现场申请',
    description: '抵达新加坡樟宜机场后现场申请',
    icon: '✈️',
    method: 'airport',
    requirements: ['护照原件', '旅行文件', '资金证明'],
  },
];

const SGACSelectionScreen: React.FC<SGACSelectionProps> = ({ navigation, route }) => {
  const { t } = useLocale();
  const { passport: rawPassport, destination } = route.params ?? {};
  const passport = UserDataService.toSerializablePassport(rawPassport) as SerializablePassport | null;
  const userId = passport?.id ?? 'user_001';
  const destinationId = getDestinationId(destination as Record<string, unknown> | null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userData, setUserData] = useState<SGACEntryInfo | null>(null);
  const [selectedOption, setSelectedOption] = useState<SGACOption | null>(null);

  const loadUserData = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Initialize UserDataService
      await UserDataService.initialize(userId);

      // Load all user data
      const allUserData = await UserDataService.getAllUserData(userId);
      const fundItems = await UserDataService.getFundItems(userId);
      const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

      const entryInfo: SGACEntryInfo = {
        passport: (allUserData?.passport as SerializablePassport | null) ?? null,
        personalInfo: (allUserData?.personalInfo as PersonalInfoData | null) ?? null,
        funds: Array.isArray(fundItems) ? (fundItems as FundItemData[]) : [],
        travel: (travelInfo as TravelInfoData | null) ?? null,
      };

      setUserData(entryInfo);
    } catch (error) {
      console.error('Failed to load user data:', error);
      Alert.alert(
        t('common.error', { defaultValue: '错误' }),
        t('sgac.loadDataError', { defaultValue: '加载数据失败，请重试' })
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUserData();
  }, [userId, destinationId]);

  const handleOptionSelect = (option: SGACOption): void => {
    setSelectedOption(option);
  };

  const handleContinue = async (): Promise<void> => {
    if (!selectedOption) {
      Alert.alert(
        t('common.warning', { defaultValue: '提示' }),
        t('sgac.selectOption', { defaultValue: '请选择申请方式' })
      );
      return;
    }

    try {
      setIsLoading(true);

      const userDataPayload = mapUserDataToPayload(userData);

      if (selectedOption.method === 'online') {
        // Navigate to SGAC web view for online submission
        navigation.navigate('SGACWebView', {
          passport,
          destination,
          userData: userDataPayload,
          submissionMethod: 'online'
        });
      } else if (selectedOption.method === 'airport') {
        // Show airport submission guidance
        navigation.navigate('SGACAirportGuide', {
          passport,
          destination,
          userData: userDataPayload,
          submissionMethod: 'airport'
        });
      }
    } catch (error) {
      console.error('Failed to proceed with SGAC submission:', error);
      Alert.alert(
        t('common.error', { defaultValue: '错误' }),
        t('sgac.submissionError', { defaultValue: '提交失败，请重试' })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const getOptionStatus = (option: SGACOption): OptionStatus => {
    if (!userData) {
      return 'unknown';
    }

    const validation = SingaporeEntryGuideService.validateEntryRequirements({
      passport: userData.passport,
      travel: userData.travel,
      funds: userData.funds,
    });

    const optionalWarnings = OPTIONAL_WARNINGS[option.method];
    const blockingWarnings = validation.warnings.filter((warning) => !optionalWarnings.has(warning));

    return blockingWarnings.length === 0 ? 'ready' : 'incomplete';
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
          新加坡入境卡申请 🌺
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇸🇬</Text>
          <Text style={styles.title}>
            选择你的SGAC申请方式
          </Text>
          <Text style={styles.subtitle}>
            新加坡数字入境卡 (Singapore Arrival Card)
          </Text>
        </View>

        <View style={styles.contentContainer}>
          {/* SGAC Information */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>
              关于新加坡入境卡 (SGAC)
            </Text>
            <Text style={styles.infoText}>
              SGAC 是新加坡移民局推出的数字入境系统，所有访客都需要提前申请。
              申请通常需要 1-3 个工作日处理。
            </Text>
          </View>

          {/* Application Options */}
          <View style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>
              申请方式选择
            </Text>

            {sgacOptions.map((option) => {
              const status = getOptionStatus(option);
              const isSelected = selectedOption?.id === option.id;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                  onPress={() => handleOptionSelect(option)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionHeader}>
                    <View style={styles.optionIconContainer}>
                      <Text style={styles.optionIcon}>{option.icon}</Text>
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionDescription}>
                        {option.description}
                      </Text>
                    </View>
                    <View style={styles.optionStatus}>
                      {status === 'ready' && (
                        <Text style={styles.statusReady}>✓ 准备就绪</Text>
                      )}
                      {status === 'incomplete' && (
                        <Text style={styles.statusIncomplete}>⚠️ 需要完善</Text>
                      )}
                      {status === 'unknown' && (
                        <Text style={styles.statusUnknown}>⏳ 检查中</Text>
                      )}
                    </View>
                  </View>

                  {/* Requirements List */}
                  <View style={styles.requirementsContainer}>
                    <Text style={styles.requirementsTitle}>需要准备：</Text>
                    {option.requirements.map((req, index) => (
                      <Text key={index} style={styles.requirementItem}>
                        • {req}
                      </Text>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Button */}
          <View style={styles.actionSection}>
            <Button
              title={selectedOption ? `继续 - ${selectedOption.title}` : "请选择申请方式"}
              onPress={handleContinue}
              variant="primary"
              disabled={!selectedOption || isLoading}
              style={styles.continueButton}
            />

            {selectedOption && (
              <Text style={styles.selectedOptionNote}>
                你选择了: {selectedOption.title}
              </Text>
            )}
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>
              需要帮助？
            </Text>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => {
                // Navigate to help screen or show modal
                Alert.alert(
                  'SGAC 帮助',
                  '如需帮助，请访问新加坡移民局官方网站或联系客服。\n\n官方网站: https://www.ica.gov.sg',
                  [{ text: '知道了' }]
                );
              }}
            >
              <Text style={styles.helpButtonText}>
                📞 联系新加坡移民局
              </Text>
            </TouchableOpacity>
          </View>
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
  contentContainer: {
    paddingHorizontal: spacing.md,
  },
  infoSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  optionsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  optionIcon: {
    fontSize: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  optionDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  optionStatus: {
    alignItems: 'flex-end',
  },
  statusReady: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  statusIncomplete: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
  },
  statusUnknown: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  requirementsContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.sm,
  },
  requirementsTitle: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  requirementItem: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionSection: {
    marginBottom: spacing.lg,
  },
  continueButton: {
    marginBottom: spacing.sm,
  },
  selectedOptionNote: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  helpSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  helpButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
  },
  helpButtonText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default SGACSelectionScreen;
