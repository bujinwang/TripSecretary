/**
 * FundsSection Component
 *
 * Displays funds/proof of funds form section for Thailand travel info.
 * Allows adding and managing different types of fund items (cash, cards, bank balance).
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CollapsibleSection } from '../../../components/thailand/ThailandTravelComponents';
import Button from '../../../components/Button';
import { colors, typography, spacing } from '../../../theme';

/**
 * Helper function to normalize amount values for display
 */
const normalizeAmount = (value) => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString();
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const parsed = Number(trimmed.replace(/,/g, ''));
    return Number.isNaN(parsed) ? trimmed : parsed.toLocaleString();
  }
  return `${value}`;
};

/**
 * Get display text for a fund item based on its type and data
 */
const getFundDisplayText = (fund, typeKey, t) => {
  const notProvidedLabel = t('fundItem.detail.notProvided', {
    defaultValue: 'Not provided yet',
  });

  const amountValue = normalizeAmount(fund.amount);
  const currencyValue = fund.currency ? fund.currency.toUpperCase() : '';
  const detailsValue = fund.details || '';

  let displayText;
  if (typeKey === 'DOCUMENT') {
    displayText = detailsValue || notProvidedLabel;
  } else if (typeKey === 'BANK_CARD' || typeKey === 'CREDIT_CARD') {
    const cardLabel = detailsValue || notProvidedLabel;
    const amountLabel = amountValue || notProvidedLabel;
    const currencyLabel = currencyValue || notProvidedLabel;
    displayText = `${cardLabel} • ${amountLabel} ${currencyLabel}`.trim();
  } else if (['CASH', 'BANK_BALANCE', 'INVESTMENT'].includes(typeKey)) {
    const amountLabel = amountValue || notProvidedLabel;
    const currencyLabel = currencyValue || notProvidedLabel;
    displayText = `${amountLabel} ${currencyLabel}`.trim();
  } else {
    displayText = detailsValue || amountValue || currencyValue || notProvidedLabel;
  }

  if ((fund.photoUri || fund.photo) && typeKey !== 'CASH') {
    const photoLabel = t('fundItem.detail.photoAttached', { defaultValue: 'Photo attached' });
    displayText = `${displayText} • ${photoLabel}`;
  }

  return displayText;
};

/**
 * FundsSection - Collapsible form section for proof of funds
 *
 * @param {Object} props
 * @param {boolean} props.isExpanded - Whether the section is expanded
 * @param {function} props.onToggle - Callback when section is toggled
 * @param {function} props.getFieldCount - Function to get field counts
 * @param {function} props.onAddFund - Callback to add a fund item (receives type: 'cash', 'credit_card', or 'bank_balance')
 * @param {Array} props.funds - Array of fund items
 * @param {function} props.onFundItemPress - Callback when a fund item is pressed
 * @param {function} props.t - Translation function
 */
const FundsSection = ({
  isExpanded,
  onToggle,
  getFieldCount,
  onAddFund,
  funds,
  onFundItemPress,
  t,
}) => {
  const typeMeta = {
    CASH: { icon: '💵' },
    BANK_CARD: { icon: '💳' },
    CREDIT_CARD: { icon: '💳' },
    BANK_BALANCE: { icon: '🏦' },
    DOCUMENT: { icon: '📄' },
    INVESTMENT: { icon: '📈' },
    OTHER: { icon: '💰' },
  };

  const defaultTypeLabels = {
    CASH: 'Cash',
    BANK_CARD: 'Bank Card',
    CREDIT_CARD: 'Bank Card',
    BANK_BALANCE: 'Bank Balance',
    DOCUMENT: 'Supporting Document',
    INVESTMENT: 'Investment',
    OTHER: 'Funding',
  };

  return (
    <CollapsibleSection
      title="💰 资金证明"
      subtitle="证明你有足够资金在泰国旅行"
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={getFieldCount('funds')}
    >
      {/* Border Crossing Context for Funds */}
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionIntroIcon}>💳</Text>
        <Text style={styles.sectionIntroText}>
          泰国海关想确保你不会成为负担。只需证明你有足够钱支付旅行费用，通常是每天至少500泰铢。
        </Text>
      </View>

      <View style={styles.fundActions}>
        <Button
          title="添加现金"
          onPress={() => onAddFund('cash')}
          variant="secondary"
          style={styles.fundButton}
        />
        <Button
          title="添加信用卡照片"
          onPress={() => onAddFund('credit_card')}
          variant="secondary"
          style={styles.fundButton}
        />
        <Button
          title="添加银行账户余额"
          onPress={() => onAddFund('bank_balance')}
          variant="secondary"
          style={styles.fundButton}
        />
      </View>

      {funds.length === 0 ? (
        <View style={styles.fundEmptyState}>
          <Text style={styles.fundEmptyText}>
            {t('thailand.travelInfo.funds.empty', { defaultValue: '尚未添加资金证明，请先新建条目。' })}
          </Text>
        </View>
      ) : (
        <View style={styles.fundList}>
          {funds.map((fund, index) => {
            const isLast = index === funds.length - 1;
            const typeKey = (fund.type || 'OTHER').toUpperCase();
            const typeIcon = (typeMeta[typeKey] || typeMeta.OTHER).icon;
            const typeLabel = t(`fundItem.types.${typeKey}`, {
              defaultValue: defaultTypeLabels[typeKey] || defaultTypeLabels.OTHER,
            });
            const displayText = getFundDisplayText(fund, typeKey, t);

            return (
              <TouchableOpacity
                key={fund.id}
                style={[styles.fundListItem, !isLast && styles.fundListItemDivider]}
                onPress={() => onFundItemPress(fund)}
                accessibilityRole="button"
              >
                <View style={styles.fundListItemContent}>
                  <Text style={styles.fundItemIcon}>{typeIcon}</Text>
                  <View style={styles.fundItemDetails}>
                    <Text style={styles.fundItemTitle}>{typeLabel}</Text>
                    <Text style={styles.fundItemSubtitle} numberOfLines={2}>
                      {displayText}
                    </Text>
                  </View>
                </View>
                <Text style={styles.fundListItemArrow}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  sectionIntro: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  sectionIntroIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  sectionIntroText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  fundActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fundButton: {
    flex: 1,
    minWidth: 100,
  },
  fundEmptyState: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  fundEmptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fundList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fundListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  fundListItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fundListItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fundItemIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  fundItemDetails: {
    flex: 1,
  },
  fundItemTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fundItemSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  fundListItemArrow: {
    fontSize: 24,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});

export default FundsSection;
