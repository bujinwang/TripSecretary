import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import CollapsibleSection from '../../CollapsibleSection';
import USFormHelper from '../../../utils/usa/USFormHelper';

/**
 * FundsSection Component
 * Handles funds/proof of funds management
 *
 * @param {Object} props
 * @param {Function} props.t - Translation function
 * @param {boolean} props.isExpanded - Whether section is expanded
 * @param {Function} props.onToggle - Toggle expansion handler
 * @param {Object} props.fieldCount - Field completion count { total, filled }
 * @param {Array} props.funds - Array of fund items
 * @param {Function} props.addFund - Handler for adding new fund item
 * @param {Function} props.handleFundItemPress - Handler for clicking fund item
 * @param {Object} props.styles - Style object
 */
const FundsSection = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,

  // Form state
  funds,

  // Actions
  addFund,
  handleFundItemPress,

  // Styles
  styles,
}) => {
  return (
    <CollapsibleSection
      title={t('us.travelInfo.sections.funds', { defaultValue: '💰 资金证明' })}
      expanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
      style={styles.sectionCard}
      headerStyle={styles.sectionHeader}
      contentStyle={styles.sectionContent}
    >
      {/* Info Text */}
      <View style={styles.fundsInfoBox}>
        <Text style={styles.fundsInfoIcon}>💡</Text>
        <Text style={styles.fundsInfoText}>
          {t('us.travelInfo.funds.infoText', {
            defaultValue: '准备好资金证明，海关可能会要求查看您有足够的资金支付旅行费用。'
          })}
        </Text>
      </View>

      {/* Fund Items List */}
      {funds.length === 0 ? (
        <Text style={styles.emptyFundsText}>
          {t('us.travelInfo.funds.emptyMessage', {
            defaultValue: '尚未添加资金项目。建议至少添加一项资金证明。'
          })}
        </Text>
      ) : (
        <View style={styles.fundsList}>
          {funds.map((item, index) => {
            const isLast = index === funds.length - 1;
            return (
              <TouchableOpacity
                key={`${item.id}-${index}`}
                style={[
                  styles.fundItem,
                  !isLast && styles.fundItemBorder
                ]}
                onPress={() => handleFundItemPress(item)}
                activeOpacity={0.8}
              >
                <View style={styles.fundItemContent}>
                  <Text style={styles.fundItemIcon}>
                    {USFormHelper.getFundItemIcon(item.type)}
                  </Text>
                  <View style={styles.fundItemDetails}>
                    <Text style={styles.fundItemType}>
                      {USFormHelper.getFundItemLabel(item.type, t)}
                    </Text>
                    <Text style={styles.fundItemValue}>
                      {USFormHelper.getFundItemSummary(item, t)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.rowArrow}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Add Fund Item Button */}
      <TouchableOpacity
        style={styles.addFundItemButton}
        onPress={addFund}
      >
        <Text style={styles.addFundItemIcon}>➕</Text>
        <Text style={styles.addFundItemText}>
          {t('us.travelInfo.funds.addButton', {
            defaultValue: '添加资金项目'
          })}
        </Text>
      </TouchableOpacity>
    </CollapsibleSection>
  );
};

export default FundsSection;
