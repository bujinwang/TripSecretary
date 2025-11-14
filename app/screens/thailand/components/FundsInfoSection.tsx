/**
 * FundsInfoSection Component
 *
 * Displays funds information including total funds and individual fund items
 * Extracted from ImmigrationOfficerViewScreen for better maintainability
 */

import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { colors, spacing } from '../../../theme';
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
        ? t('photos.fundProof.title')
        : language === 'thai'
        ? 'รูปหลักฐานเงินทุน'
        : `รูปหลักฐานเงินทุน / ${t('photos.fundProof.title')}`,
      language === 'english'
        ? t('photos.fundProof.tapToViewLargerImage')
        : language === 'thai'
        ? 'แตะเพื่อดูภาพขนาดใหญ่'
        : `แตะเพื่อดูภาพขนาดใหญ่ / ${t('photos.fundProof.tapToViewLargerImage')}`
    );
  };

  if (!fundData || fundData.length === 0) {
    return (
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>
          {getLabel('fundsInformation', 'ข้อมูลเงินทุน')}
        </Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoValue}>
            {language === 'english'
              ? t('funds.noInfoAvailable')
              : language === 'thai'
              ? 'ไม่มีข้อมูลเงินทุน'
              : `ไม่มีข้อมูลเงินทุน / ${t('funds.noInfoAvailable')}`}
          </Text>
        </View>
      </View>
    );
  }

  const totalInTHB = calculateTotalFundsInCurrency(fundData, 'THB');

  return (
    <View style={styles.infoSection}>
      <Text style={styles.sectionTitle}>
        {getLabel('fundsInformation', 'ข้อมูลเงินทุน')}
      </Text>

      {/* Total Funds Summary */}
      <View style={styles.infoGroup}>
        <Text style={styles.groupTitle}>
          💰{' '}
          {language === 'english'
            ? t('progressiveEntryFlow.immigrationOfficer.presentation.totalFunds')
            : language === 'thai'
            ? 'เงินทุนรวม'
            : `เงินทุนรวม / ${t('progressiveEntryFlow.immigrationOfficer.presentation.totalFunds')}`}
        </Text>

        <View style={styles.totalFundsContainer}>
          <Text style={styles.totalFundsLabel}>
            {language === 'english'
              ? t('progressiveEntryFlow.immigrationOfficer.presentation.totalAmount')
              : language === 'thai'
              ? 'จำนวนรวม'
              : `จำนวนรวม / ${t('progressiveEntryFlow.immigrationOfficer.presentation.totalAmount')}`}
            :
          </Text>
          <Text style={styles.totalFundsAmount}>{formatAmount(totalInTHB)} THB</Text>
        </View>

        {/* Individual Fund Items */}
        <View style={styles.fundItemsContainer}>
          <Text style={styles.fundItemsTitle}>
            {language === 'english'
              ? t('progressiveEntryFlow.immigrationOfficer.presentation.fundItems')
              : language === 'thai'
              ? 'รายการเงินทุน'
              : `รายการเงินทุน / ${t('progressiveEntryFlow.immigrationOfficer.presentation.fundItems')}`}
            :
          </Text>

          {fundData.map((fund, index) => {
            const originalAmount = parseFloat(fund.amount) || 0;
            const originalCurrency = fund.currency || 'THB';
            const convertedAmount = convertCurrency(originalAmount, originalCurrency, 'THB');

            return (
              <View key={index} style={styles.fundItem}>
                <View style={styles.fundItemHeader}>
                  <Text style={styles.fundItemType}>{fund.type || t('funds.cash')}</Text>
                  <View style={styles.fundItemAmounts}>
                    <Text style={styles.fundItemAmount}>
                      {formatCurrency(originalAmount, originalCurrency)}
                    </Text>
                    {originalCurrency !== 'THB' && (
                      <Text style={styles.fundItemConvertedAmount}>
                        ≈ {formatAmount(convertedAmount)} THB
                      </Text>
                    )}
                  </View>
                </View>

                {fund.photoUri && (
                  <TouchableOpacity
                    style={styles.fundPhotoContainer}
                    onPress={handleFundPhotoPress}
                  >
                    <OptimizedImage
                      uri={fund.photoUri}
                      style={styles.fundPhoto}
                      resizeMode="cover"
                      lazy={true}
                      lazyLoadDelay={150}
                      placeholder="💰"
                      showLoadingText={false}
                    />
                    <Text style={styles.fundPhotoHint}>
                      {language === 'english'
                        ? t('common.images.tapToEnlarge')
                        : language === 'thai'
                        ? 'แตะเพื่อขยาย'
                        : 'แตะเพื่อขยาย'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  infoGroup: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  groupTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    opacity: 0.9,
  },
  totalFundsContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.4)',
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  totalFundsLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  totalFundsAmount: {
    color: '#4CAF50',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textAlign: 'center',
  },
  fundItemsContainer: {
    marginTop: spacing.md,
  },
  fundItemsTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
    opacity: 0.9,
  },
  fundItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  fundItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fundItemType: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  fundItemAmounts: {
    alignItems: 'flex-end',
  },
  fundItemAmount: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  fundItemConvertedAmount: {
    color: colors.white,
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  fundPhotoContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  fundPhoto: {
    width: 120,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  fundPhotoHint: {
    color: colors.white,
    fontSize: 12,
    opacity: 0.6,
    marginTop: spacing.xs,
  },
  infoRow: {
    marginBottom: spacing.md,
  },
  infoValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FundsInfoSection;
