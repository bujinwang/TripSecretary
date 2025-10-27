/**
 * FundsSection Component
 *
 * Handles proof of funds management for Singapore Travel Info Screen
 */

import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';

const FundsSection = ({
  // Section state
  isExpanded,
  onToggle,
  fieldCount,

  // Form state
  funds,

  // Handlers
  onAddFund,
  onFundItemPress,

  // i18n
  t,

  // Styles
  styles,
}) => {
  const fundTypeLabels = {
    cash: '💵 现金',
    bank_card: '💳 银行卡',
    credit_card: '💳 信用卡',
    travelers_check: '📝 旅行支票',
    other: '📋 其他',
  };

  const fundTypeOptions = [
    { type: 'cash', label: '💵 现金', color: '#34C759' },
    { type: 'bank_card', label: '💳 银行卡', color: '#007AFF' },
    { type: 'credit_card', label: '💳 信用卡', color: '#FF9500' },
    { type: 'travelers_check', label: '📝 旅行支票', color: '#5856D6' },
    { type: 'other', label: '📋 其他', color: '#8E8E93' },
  ];

  const renderFundItem = ({ item }) => (
    <TouchableOpacity
      style={styles.fundItem}
      onPress={() => onFundItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.fundItemHeader}>
        <Text style={styles.fundItemType}>
          {fundTypeLabels[item.type] || item.type}
        </Text>
        <Text style={styles.fundItemAmount}>
          {item.currency} {item.amount?.toLocaleString()}
        </Text>
      </View>
      {item.details && (
        <Text style={styles.fundItemDetails} numberOfLines={2}>
          {item.details}
        </Text>
      )}
      {item.photo && (
        <Text style={styles.fundItemPhoto}>📷 有照片</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <CollapsibleSection
      title={t('singapore.travelInfo.sections.funds', { defaultValue: '💰 资金证明' })}
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      {/* Fund Items List */}
      {funds && funds.length > 0 && (
        <FlatList
          data={funds}
          renderItem={renderFundItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          style={styles.fundsList}
          scrollEnabled={false}
        />
      )}

      {/* Add Fund Buttons */}
      <View style={styles.addFundContainer}>
        <Text style={styles.addFundTitle}>
          {t('singapore.travelInfo.addFund', { defaultValue: '添加资金证明' })}
        </Text>
        <View style={styles.fundTypeButtonsContainer}>
          {fundTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[styles.fundTypeButton, { borderColor: option.color }]}
              onPress={() => onAddFund(option.type)}
              activeOpacity={0.7}
            >
              <Text style={styles.fundTypeButtonText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Helper Text */}
      <View style={styles.helperTextContainer}>
        <Text style={styles.helperText}>
          💡 {t('singapore.travelInfo.fundsHelper', {
            defaultValue: '建议准备至少 SGD 500/天的资金证明'
        })}
        </Text>
      </View>
    </CollapsibleSection>
  );
};

export default FundsSection;
