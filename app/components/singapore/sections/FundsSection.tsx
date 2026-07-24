/**
 * FundsSection Component
 *
 * Handles proof of funds management for Singapore Travel Info Screen
 */

import React from 'react';
import { View, Text, TouchableOpacity, FlatList, type ViewStyle, type TextStyle } from 'react-native';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';

type SingaporeFundType = 'cash' | 'bank_card' | 'credit_card' | 'travelers_check' | 'other';

type SingaporeFund = {
  id: string | number;
  type: SingaporeFundType;
  currency?: string;
  amount?: number;
  details?: string;
  photo?: string | null;
};

type FieldCount = {
  filled: number;
  total: number;
};

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export interface SingaporeFundsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  funds: SingaporeFund[];
  onAddFund: (type: SingaporeFundType) => void;
  onFundItemPress: (fund: SingaporeFund) => void;
  t: TranslationFn;
  styles: Record<string, ViewStyle | TextStyle>;
}

const fundTypeLabels: Record<SingaporeFundType, string> = {
  cash: '💵 现金',
  bank_card: '💳 银行卡',
  credit_card: '💳 信用卡',
  travelers_check: '📝 旅行支票',
  other: '📋 其他',
};

const fundTypeOptions: Array<{ type: SingaporeFundType; label: string; color: string }> = [
  { type: 'cash', label: '💵 现金', color: '#34C759' },
  { type: 'bank_card', label: '💳 银行卡', color: '#007AFF' },
  { type: 'credit_card', label: '💳 信用卡', color: '#FF9500' },
  { type: 'travelers_check', label: '📝 旅行支票', color: '#5856D6' },
  { type: 'other', label: '📋 其他', color: '#8E8E93' },
];

const FundsSection: React.FC<SingaporeFundsSectionProps> = ({
  isExpanded,
  onToggle,
  fieldCount,
  funds,
  onAddFund,
  onFundItemPress,
  t,
  styles,
}) => {
  const renderFundItem = ({ item }: { item: SingaporeFund }) => (
    <TouchableOpacity
      style={styles.fundItem}
      onPress={() => onFundItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.fundItemHeader as ViewStyle}>
        <Text style={styles.fundItemType as TextStyle}>
          {fundTypeLabels[item.type] || item.type}
        </Text>
        <Text style={styles.fundItemAmount as TextStyle}>
          {item.currency} {item.amount !== undefined ? item.amount.toLocaleString() : ''}
        </Text>
      </View>
      {item.details ? (
        <Text style={styles.fundItemDetails as TextStyle} numberOfLines={2}>
          {item.details}
        </Text>
      ) : null}
      {item.photo ? <Text style={styles.fundItemPhoto as TextStyle}>📷 有照片</Text> : null}
    </TouchableOpacity>
  );

  return (
    <CollapsibleSection
      title={t('singapore.travelInfo.sections.funds', { defaultValue: '💰 资金证明' })}
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      {funds.length > 0 ? (
        <FlatList
          data={funds}
          renderItem={renderFundItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.fundsList as ViewStyle}
          scrollEnabled={false}
        />
      ) : null}

      <View style={styles.addFundContainer as ViewStyle}>
        <Text style={styles.addFundTitle as TextStyle}>
          {t('singapore.travelInfo.addFund', { defaultValue: '添加资金证明' })}
        </Text>
        <View style={styles.fundTypeButtonsContainer as ViewStyle}>
          {fundTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.fundTypeButton as ViewStyle,
                { borderColor: option.color },
              ]}
              onPress={() => onAddFund(option.type)}
              activeOpacity={0.7}
            >
              <Text style={styles.fundTypeButtonText as TextStyle}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.helperTextContainer as ViewStyle}>
        <Text style={styles.helperText as TextStyle}>
          💡 {t('singapore.travelInfo.fundsHelper', {
            defaultValue: '建议准备至少 SGD 500/天的资金证明',
          })}
        </Text>
      </View>
    </CollapsibleSection>
  );
};

export default FundsSection;
