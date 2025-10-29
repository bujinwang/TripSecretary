/**
 * FundsInfoSection Component
 *
 * Displays funds information including total funds and individual fund items
 * Extracted from ImmigrationOfficerViewScreen for better maintainability
 */

import React from 'react';
import { Alert, Platform } from 'react-native';
import { YStack, XStack, Text as TamaguiText } from '../../../components/tamagui';
import { calculateTotalFundsInCurrency, convertCurrency } from '../../../utils/currencyConverter';
import OptimizedImage from '../../../components/OptimizedImage';
import { formatCurrency as formatCurrencyHelper, safeArray } from '../helpers';

/**
 * Funds Information Section Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.fundData - Array of fund items
 * @param {string} props.language - Display language ('english', 'thai', 'bilingual')
 * @param {Function} props.t - Translation function
 */
const FundsInfoSection = ({ fundData, language, t }) => {
  const getLabel = (englishKey, thaiText) => {
    if (language === 'english') {
      return t(`progressiveEntryFlow.immigrationOfficer.presentation.${englishKey}`);
    } else if (language === 'thai') {
      return thaiText;
    } else {
      return `${thaiText} / ${t(`progressiveEntryFlow.immigrationOfficer.presentation.${englishKey}`)}`;
    }
  };

  const formatCurrency = (amount, currency) => {
    // Use centralized helper with no decimals for cleaner display
    return formatCurrencyHelper(amount, currency, {
      decimals: 0,
      showSymbol: true,
      defaultValue: `${amount || 0} ${currency || ''}`,
    });
  };

  const formatAmount = (amount) => {
    try {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      return String(amount);
    }
  };

  const handleFundPhotoPress = () => {
    Alert.alert(
      language === 'english'
        ? 'Fund Proof Photo'
        : language === 'thai'
        ? 'รูปหลักฐานเงินทุน'
        : 'รูปหลักฐานเงินทุน / Fund Proof Photo',
      language === 'english'
        ? 'Tap to view larger image'
        : language === 'thai'
        ? 'แตะเพื่อดูภาพขนาดใหญ่'
        : 'แตะเพื่อดูภาพขนาดใหญ่ / Tap to view larger image'
    );
  };

  if (!fundData || fundData.length === 0) {
    return (
      <YStack backgroundColor="rgba(255, 255, 255, 0.1)" padding="$lg" borderRadius={12} marginBottom="$lg">
        <TamaguiText color="white" fontSize={24} fontWeight="bold" marginBottom="$lg" textAlign="center">
          {getLabel('fundsInformation', 'ข้อมูลเงินทุน')}
        </TamaguiText>
        <YStack marginBottom="$md">
          <TamaguiText color="white" fontSize={18} fontWeight="bold">
            {language === 'english'
              ? 'No fund information available'
              : language === 'thai'
              ? 'ไม่มีข้อมูลเงินทุน'
              : 'ไม่มีข้อมูลเงินทุน / No fund information available'}
          </TamaguiText>
        </YStack>
      </YStack>
    );
  }

  const totalInTHB = calculateTotalFundsInCurrency(fundData, 'THB');

  return (
    <YStack backgroundColor="rgba(255, 255, 255, 0.1)" padding="$lg" borderRadius={12} marginBottom="$lg">
      <TamaguiText color="white" fontSize={24} fontWeight="bold" marginBottom="$lg" textAlign="center">
        {getLabel('fundsInformation', 'ข้อมูลเงินทุน')}
      </TamaguiText>

      {/* Total Funds Summary */}
      <YStack marginBottom="$lg" paddingBottom="$md" borderBottomWidth={1} borderBottomColor="rgba(255, 255, 255, 0.2)">
        <TamaguiText color="white" fontSize={18} fontWeight="bold" marginBottom="$md" opacity={0.9}>
          💰{' '}
          {language === 'english'
            ? t('progressiveEntryFlow.immigrationOfficer.presentation.totalFunds')
            : language === 'thai'
            ? 'เงินทุนรวม'
            : `เงินทุนรวม / ${t('progressiveEntryFlow.immigrationOfficer.presentation.totalFunds')}`}
        </TamaguiText>

        <YStack
          backgroundColor="rgba(76, 175, 80, 0.2)"
          padding="$md"
          borderRadius={12}
          borderWidth={2}
          borderColor="rgba(76, 175, 80, 0.4)"
          marginBottom="$md"
          alignItems="center"
        >
          <TamaguiText color="white" fontSize={16} fontWeight="600" marginBottom="$xs" textAlign="center">
            {language === 'english'
              ? t('progressiveEntryFlow.immigrationOfficer.presentation.totalAmount')
              : language === 'thai'
              ? 'จำนวนรวม'
              : `จำนวนรวม / ${t('progressiveEntryFlow.immigrationOfficer.presentation.totalAmount')}`}
            :
          </TamaguiText>
          <TamaguiText
            color="#4CAF50"
            fontSize={28}
            fontWeight="bold"
            fontFamily={Platform.OS === 'ios' ? 'Courier New' : 'monospace'}
            textAlign="center"
          >
            {formatAmount(totalInTHB)} THB
          </TamaguiText>
        </YStack>

        {/* Individual Fund Items */}
        <YStack marginTop="$md">
          <TamaguiText color="white" fontSize={16} fontWeight="600" marginBottom="$md" opacity={0.9}>
            {language === 'english'
              ? t('progressiveEntryFlow.immigrationOfficer.presentation.fundItems')
              : language === 'thai'
              ? 'รายการเงินทุน'
              : `รายการเงินทุน / ${t('progressiveEntryFlow.immigrationOfficer.presentation.fundItems')}`}
            :
          </TamaguiText>

          {fundData.map((fund, index) => {
            const originalAmount = parseFloat(fund.amount) || 0;
            const originalCurrency = fund.currency || 'THB';
            const convertedAmount = convertCurrency(originalAmount, originalCurrency, 'THB');

            return (
              <YStack
                key={index}
                backgroundColor="rgba(255, 255, 255, 0.05)"
                padding="$md"
                borderRadius={8}
                marginBottom="$sm"
              >
                <XStack justifyContent="space-between" alignItems="center" marginBottom="$sm">
                  <TamaguiText color="white" fontSize={14} fontWeight="600" opacity={0.8}>
                    {fund.type || 'Cash'}
                  </TamaguiText>
                  <YStack alignItems="flex-end">
                    <TamaguiText
                      color="white"
                      fontSize={16}
                      fontWeight="bold"
                      fontFamily={Platform.OS === 'ios' ? 'Courier New' : 'monospace'}
                    >
                      {formatCurrency(originalAmount, originalCurrency)}
                    </TamaguiText>
                    {originalCurrency !== 'THB' && (
                      <TamaguiText
                        color="white"
                        fontSize={13}
                        opacity={0.7}
                        marginTop={2}
                        fontFamily={Platform.OS === 'ios' ? 'Courier New' : 'monospace'}
                      >
                        ≈ {formatAmount(convertedAmount)} THB
                      </TamaguiText>
                    )}
                  </YStack>
                </XStack>

                {fund.photoUri && (
                  <YStack
                    alignItems="center"
                    marginTop="$sm"
                    onPress={handleFundPhotoPress}
                    cursor="pointer"
                    pressStyle={{ opacity: 0.8 }}
                  >
                    <OptimizedImage
                      uri={fund.photoUri}
                      style={{
                        width: 120,
                        height: 80,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      }}
                      resizeMode="cover"
                      lazy={true}
                      lazyLoadDelay={150}
                      placeholder="💰"
                      showLoadingText={false}
                    />
                    <TamaguiText color="white" fontSize={12} opacity={0.6} marginTop="$xs">
                      {language === 'english'
                        ? 'Tap to enlarge'
                        : language === 'thai'
                        ? 'แตะเพื่อขยาย'
                        : 'แตะเพื่อขยาย'}
                    </TamaguiText>
                  </YStack>
                )}
              </YStack>
            );
          })}
        </YStack>
      </YStack>
    </YStack>
  );
};

export default FundsInfoSection;
