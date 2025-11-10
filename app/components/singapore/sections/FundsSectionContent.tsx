/**
 * FundsSectionContent Component
 *
 * Renders the funds/proof of funds form section
 * Extracted from Singapore Travel Info Screen for better organization
 */

import React from 'react';
import { View, Text, TouchableOpacity, type ViewStyle, type TextStyle } from 'react-native';
import Button from '../../Button';

type SingaporeFundTypeUpper = 'CASH' | 'BANK_CARD' | 'CREDIT_CARD' | 'BANK_BALANCE' | 'DOCUMENT' | 'INVESTMENT' | 'OTHER';

type SingaporeFund = {
  id: string | number;
  type?: string;
  currency?: string;
  amount?: number | string | null;
  details?: string;
  photo?: string | null;
};

type FundsFormState = {
  funds: SingaporeFund[];
};

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export interface SingaporeFundsSectionContentProps {
  formState: FundsFormState;
  addFund: (type: string) => void;
  handleFundItemPress: (fund: SingaporeFund) => void;
  t: TranslationFn;
  styles: Record<string, ViewStyle | TextStyle>;
}

const typeMeta: Record<SingaporeFundTypeUpper, { icon: string }> = {
  CASH: { icon: '💵' },
  BANK_CARD: { icon: '💳' },
  CREDIT_CARD: { icon: '💳' },
  BANK_BALANCE: { icon: '🏦' },
  DOCUMENT: { icon: '📄' },
  INVESTMENT: { icon: '📈' },
  OTHER: { icon: '💰' },
};

const defaultTypeLabels: Record<SingaporeFundTypeUpper, string> = {
  CASH: 'Cash',
  BANK_CARD: 'Bank Card',
  CREDIT_CARD: 'Bank Card',
  BANK_BALANCE: 'Bank Balance',
  DOCUMENT: 'Supporting Document',
  INVESTMENT: 'Investment',
  OTHER: 'Funding',
};

const normalizeAmount = (value: SingaporeFund['amount']): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString();
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    const parsed = Number(trimmed.replace(/,/g, ''));
    return Number.isNaN(parsed) ? trimmed : parsed.toLocaleString();
  }
  return String(value);
};

const FundsSectionContent: React.FC<SingaporeFundsSectionContentProps> = ({
  formState,
  addFund,
  handleFundItemPress,
  t,
  styles,
}) => {
  const { funds } = formState;

  const renderFundItem = (fund: SingaporeFund, index: number) => {
    const isLast = index === funds.length - 1;
    const typeKey = ((fund.type ?? 'OTHER').toUpperCase() as SingaporeFundTypeUpper) || 'OTHER';
    const typeIcon = (typeMeta[typeKey] || typeMeta.OTHER).icon;
    const typeLabel = t(`fundItem.types.${typeKey}`, {
      defaultValue: defaultTypeLabels[typeKey] || defaultTypeLabels.OTHER,
    });
    const notProvidedLabel = t('fundItem.detail.notProvided', {
      defaultValue: 'Not provided yet',
    });

    const amountValue = normalizeAmount(fund.amount);
    const currencyValue = fund.currency ? fund.currency.toUpperCase() : '';
    const detailsValue = fund.details || '';

    let displayText: string;
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

    if (fund.photo && typeKey !== 'CASH') {
      const photoLabel = t('fundItem.detail.photoAttached', { defaultValue: 'Photo attached' });
      displayText = `${displayText} • ${photoLabel}`;
    }

    return (
      <TouchableOpacity
        key={fund.id}
        style={[
          styles.fundListItem as ViewStyle,
          !isLast && (styles.fundListItemDivider as ViewStyle),
        ]}
        onPress={() => handleFundItemPress(fund)}
        accessibilityRole="button"
      >
        <View style={styles.fundListItemContent as ViewStyle}>
          <Text style={styles.fundItemIcon as TextStyle}>{typeIcon}</Text>
          <View style={styles.fundItemDetails as ViewStyle}>
            <Text style={styles.fundItemTitle as TextStyle}>{typeLabel}</Text>
            <Text style={styles.fundItemSubtitle as TextStyle} numberOfLines={2}>
              {displayText}
            </Text>
          </View>
        </View>
        <Text style={styles.fundListItemArrow as TextStyle}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={styles.fundActions as ViewStyle}>
        <Button
          title="添加现金"
          onPress={() => addFund('cash')}
          variant="secondary"
          style={styles.fundButton as ViewStyle}
        />
        <Button
          title="添加信用卡照片"
          onPress={() => addFund('credit_card')}
          variant="secondary"
          style={styles.fundButton as ViewStyle}
        />
        <Button
          title="添加银行账户余额"
          onPress={() => addFund('bank_balance')}
          variant="secondary"
          style={styles.fundButton as ViewStyle}
        />
      </View>

      {funds.length === 0 ? (
        <View style={styles.fundEmptyState as ViewStyle}>
          <Text style={styles.fundEmptyText as TextStyle}>
            {t('singapore.travelInfo.funds.empty', { defaultValue: '尚未添加资金证明，请先新建条目。' })}
          </Text>
        </View>
      ) : (
        <View style={styles.fundList as ViewStyle}>
          {funds.map((fund, index) => renderFundItem(fund, index))}
        </View>
      )}
    </>
  );
};

export default FundsSectionContent;
