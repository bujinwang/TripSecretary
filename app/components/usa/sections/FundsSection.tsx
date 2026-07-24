import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { CollapsibleSection } from '../../tamagui';
import USFormHelper from '../../../utils/usa/USFormHelper';
import { colors, spacing, typography, borderRadius } from '../../../theme';

type FieldCount = {
  filled: number;
  total: number;
};

type USFund = {
  id: string | number;
  type?: string;
  currency?: string;
  amount?: number | string | null;
  details?: string;
  photo?: string | null;
};

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

type FundsSectionStyles = ReturnType<typeof createStyles>;
type FundsSectionStyleKey = keyof FundsSectionStyles;
type StyleOverrides = Partial<Record<FundsSectionStyleKey, ViewStyle | TextStyle>>;

export interface USAFundsSectionProps {
  t: TranslationFn;
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  funds: USFund[];
  addFund: (type?: string) => void;
  handleFundItemPress: (fund: USFund) => void;
  styles?: StyleOverrides;
}

const FundsSection: React.FC<USAFundsSectionProps> = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  funds,
  addFund,
  handleFundItemPress,
  styles: styleOverrides,
}) => {
  const sectionStyles = React.useMemo(
    () => (styleOverrides ? ({ ...defaultStyles, ...styleOverrides } as FundsSectionStyles) : defaultStyles),
    [styleOverrides],
  );

  return (
    <CollapsibleSection
      title={t('us.travelInfo.sections.funds', { defaultValue: '💰 资金证明' })}
      expanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
      style={sectionStyles.sectionCard}
      headerStyle={sectionStyles.sectionHeader}
      contentStyle={sectionStyles.sectionContent}
    >
      <View style={sectionStyles.fundsInfoBox}>
        <Text style={sectionStyles.fundsInfoIcon}>💡</Text>
        <Text style={sectionStyles.fundsInfoText}>
          {t('us.travelInfo.funds.infoText', {
            defaultValue: '准备好资金证明，海关可能会要求查看您有足够的资金支付旅行费用。',
          })}
        </Text>
      </View>

      {funds.length === 0 ? (
        <Text style={sectionStyles.emptyFundsText}>
          {t('us.travelInfo.funds.emptyMessage', {
            defaultValue: '尚未添加资金项目。建议至少添加一项资金证明。',
          })}
        </Text>
      ) : (
        <View style={sectionStyles.fundsList}>
          {funds.map((item, index) => {
            const isLast = index === funds.length - 1;
            return (
              <TouchableOpacity
                key={`${item.id}-${index}`}
                style={[
                  sectionStyles.fundItem,
                  !isLast && sectionStyles.fundItemBorder,
                ]}
                onPress={() => handleFundItemPress(item)}
                activeOpacity={0.8}
              >
                <View style={sectionStyles.fundItemContent}>
                  <Text style={sectionStyles.fundItemIcon}>
                    {USFormHelper.getFundItemIcon(item.type)}
                  </Text>
                  <View style={sectionStyles.fundItemDetails}>
                    <Text style={sectionStyles.fundItemType}>
                      {USFormHelper.getFundItemLabel(item.type, t)}
                    </Text>
                    <Text style={sectionStyles.fundItemValue}>
                      {USFormHelper.getFundItemSummary(item, t)}
                    </Text>
                  </View>
                </View>
                <Text style={sectionStyles.rowArrow}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={sectionStyles.addFundItemButton}
        onPress={() => addFund()}
        activeOpacity={0.7}
      >
        <Text style={sectionStyles.addFundItemIcon}>➕</Text>
        <Text style={sectionStyles.addFundItemText}>
          {t('us.travelInfo.funds.addButton', {
            defaultValue: '添加资金项目',
          })}
        </Text>
      </TouchableOpacity>
    </CollapsibleSection>
  );
};

export default FundsSection;

const createStyles = () =>
  StyleSheet.create({
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    sectionHeader: {
      paddingHorizontal: spacing.sm,
    },
    sectionContent: {
      gap: spacing.md,
    },
    fundsInfoBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.primaryLight,
      borderRadius: borderRadius.sm,
      padding: spacing.sm,
    },
    fundsInfoIcon: {
      fontSize: 18,
    },
    fundsInfoText: {
      ...typography.caption,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 18,
    },
    emptyFundsText: {
      ...typography.caption,
      color: colors.textSecondary,
      backgroundColor: colors.backgroundLight,
      borderRadius: borderRadius.sm,
      padding: spacing.sm,
    },
    fundsList: {
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.borderLight,
      overflow: 'hidden',
    },
    fundItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.card,
    },
    fundItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    fundItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    fundItemIcon: {
      fontSize: 24,
    },
    fundItemDetails: {
      flex: 1,
      gap: 2,
    },
    fundItemType: {
      ...typography.body1,
      color: colors.text,
      fontWeight: '600',
    },
    fundItemValue: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    rowArrow: {
      fontSize: 20,
      color: colors.textSecondary,
    },
    addFundItemButton: {
      marginTop: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      alignSelf: 'flex-start',
      backgroundColor: colors.white,
    },
    addFundItemIcon: {
      fontSize: 18,
      color: colors.primary,
    },
    addFundItemText: {
      ...typography.body1,
      color: colors.primary,
      fontWeight: '600',
    },
  });

const defaultStyles = createStyles();
