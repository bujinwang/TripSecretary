/**
 * FundsSection Component
 *
 * Displays funds/proof of money section
 * for Hong Kong Travel Info Screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../../../theme';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';
import Button from '../../../components/Button';

type FieldCount = {
  filled: number;
  total: number;
};

type HongKongFund = {
  id: string | number;
  type?: string;
  amount?: number | string | null;
  currency?: string;
  details?: string;
  photoUri?: string | null;
  photo?: string | null;
};

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

type HongKongFundsSectionProps = {
  t: TranslationFn;
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  funds: HongKongFund[];
  addFund: (type: string) => void;
  handleFundItemPress: (fund: HongKongFund) => void;
  styles?: typeof localStyles;
};

const FundsSection: React.FC<HongKongFundsSectionProps> = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  funds,
  addFund,
  handleFundItemPress,
  styles: parentStyles,
}) => {
  const styles = parentStyles || localStyles;

  return (
    <CollapsibleSection
      title="💰 资金证明"
      subtitle="证明你有足够资金在香港旅行"
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionIntroIcon}>💳</Text>
        <Text style={styles.sectionIntroText}>
          香港海关想确保你不会成为负担。只需证明你有足够钱支付旅行费用。
        </Text>
      </View>

      <View style={styles.fundActions}>
        <Button title="添加现金" onPress={() => addFund('cash')} variant="secondary" style={styles.fundButton} />
        <Button
          title="添加信用卡照片"
          onPress={() => addFund('credit_card')}
          variant="secondary"
          style={styles.fundButton}
        />
        <Button
          title="添加银行账户余额"
          onPress={() => addFund('bank_balance')}
          variant="secondary"
          style={styles.fundButton}
        />
      </View>

      {funds.length === 0 ? (
        <View style={styles.fundEmptyState}>
          <Text style={styles.fundEmptyText}>
            {t('hongkong.travelInfo.funds.empty', { defaultValue: '尚未添加资金证明，请先新建条目。' })}
          </Text>
        </View>
      ) : (
        <View style={styles.fundList}>
          {funds.map((fund, index) => {
            const isLast = index === funds.length - 1;
            const typeKey = (fund.type || 'OTHER').toUpperCase();
            const typeMeta: Record<string, { icon: string }> = {
              CASH: { icon: '💵' },
              BANK_CARD: { icon: '💳' },
              CREDIT_CARD: { icon: '💳' },
              BANK_BALANCE: { icon: '🏦' },
              DOCUMENT: { icon: '📄' },
              OTHER: { icon: '💰' },
            };

            const typeIcon = typeMeta[typeKey]?.icon || '💰';
            const typeLabel = t(`fundItem.type.${typeKey.toLowerCase()}`, {
              defaultValue: fund.type || 'Other',
            });

            const amountValue = fund.amount ? `${fund.amount} ${fund.currency || 'HKD'}` : '';
            const detailsValue = fund.details || '';
            const currencyValue = fund.currency || '';
            const notProvidedLabel = t('fundItem.detail.notProvided', { defaultValue: 'Not provided' });

            let displayText: string;
            if (amountValue && detailsValue) {
              displayText = `${amountValue} • ${detailsValue}`;
            } else {
              displayText = detailsValue || amountValue || currencyValue || notProvidedLabel;
            }

            if ((fund.photoUri || fund.photo) && typeKey !== 'CASH') {
              const photoLabel = t('fundItem.detail.photoAttached', { defaultValue: 'Photo attached' });
              displayText = `${displayText} • ${photoLabel}`;
            }

            return (
              <TouchableOpacity
                key={fund.id}
                style={[styles.fundListItem, !isLast && styles.fundListItemDivider]}
                onPress={() => handleFundItemPress(fund)}
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

const localStyles = StyleSheet.create({
  sectionIntro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  sectionIntroIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  sectionIntroText: {
    ...typography.body2,
    color: '#2C5AA0',
    flex: 1,
    lineHeight: 20,
  },
  fundActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  fundButton: {
    flex: 1,
    minWidth: '45%',
  },
  fundEmptyState: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  fundEmptyText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fundList: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fundListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  fundListItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  fundListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fundItemIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  fundItemDetails: {
    flex: 1,
  },
  fundItemTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  fundItemSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  fundListItemArrow: {
    ...typography.h2,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});

export default FundsSection;
