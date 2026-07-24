// FundsSection.js
// Funds proof section for Malaysia Travel Info Screen
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle, type TextStyle } from 'react-native';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';
import Button from '../../Button';
import { colors, typography, spacing } from '../../../theme';

type MalaysiaFundType = 'cash' | 'credit_card' | 'bank_balance';

type FieldCount = {
  filled: number;
  total: number;
};

export interface MalaysiaFund {
  id: string;
  type: MalaysiaFundType;
  currency?: string;
  amount?: number | string;
}

export interface MalaysiaFundsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  funds: MalaysiaFund[];
  addFund: (type: MalaysiaFundType) => void;
  editFund: (fund: MalaysiaFund) => void;
  t?: (key: string, options?: Record<string, unknown>) => string;
  styles?: Partial<typeof styles> & Record<string, ViewStyle | TextStyle>;
}

const FUND_REQUIREMENTS = {
  MINIMUM_PER_DAY_MYR: 100,
  MINIMUM_PER_DAY_THB: 800,
  MINIMUM_PER_DAY_USD: 25,
};

const MalaysiaFundsSection: React.FC<MalaysiaFundsSectionProps> = ({
  isExpanded,
  onToggle,
  fieldCount,
  funds,
  addFund,
  editFund,
  t,
  styles: customStyles,
}) => {
  const sectionStyles = { ...styles, ...customStyles } as typeof styles;

  const translate = (key: string, defaultValue: string) =>
    (t && t(key, { defaultValue })) || defaultValue;

  return (
    <CollapsibleSection
      title="💰 Funds Proof / Bukti Kewangan"
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      <View style={sectionStyles.sectionIntro}>
        <Text style={sectionStyles.sectionIntroIcon}>💳</Text>
        <Text style={sectionStyles.sectionIntroText}>
          {`Malaysia immigration requires proof of sufficient funds for your stay. The minimum requirement is approximately MYR ${FUND_REQUIREMENTS.MINIMUM_PER_DAY_MYR} (~${FUND_REQUIREMENTS.MINIMUM_PER_DAY_THB} THB or ~$${FUND_REQUIREMENTS.MINIMUM_PER_DAY_USD} USD) per day.`}
        </Text>
        <Text style={sectionStyles.sectionIntroTextSecondary}>
          {translate(
            'malaysia.travelInfo.funds.requirementMalay',
            `Imigresen Malaysia memerlukan bukti dana yang mencukupi untuk penginapan anda. Keperluan minimum adalah kira-kira MYR ${FUND_REQUIREMENTS.MINIMUM_PER_DAY_MYR} sehari.`,
          )}
        </Text>
      </View>

      <View style={sectionStyles.fundActions}>
        <Button
          title="Add Cash / Tambah Tunai"
          onPress={() => addFund('cash')}
          variant="secondary"
          style={sectionStyles.fundButton}
        />
        <Button
          title="Add Credit Card / Tambah Kad Kredit"
          onPress={() => addFund('credit_card')}
          variant="secondary"
          style={sectionStyles.fundButton}
        />
        <Button
          title="Add Bank Balance / Tambah Baki Bank"
          onPress={() => addFund('bank_balance')}
          variant="secondary"
          style={sectionStyles.fundButton}
        />
      </View>

      {funds.length === 0 ? (
        <View style={sectionStyles.fundEmptyState}>
          <Text style={sectionStyles.fundEmptyText}>
            {translate('malaysia.travelInfo.funds.empty', 'No funds added yet. Please add at least one fund proof.')}
          </Text>
          <Text style={sectionStyles.fundEmptyTextSecondary}>
            {translate(
              'malaysia.travelInfo.funds.emptyMalay',
              'Tiada dana ditambah lagi. Sila tambah sekurang-kurangnya satu bukti dana.',
            )}
          </Text>
        </View>
      ) : (
        <View style={sectionStyles.fundList}>
          {funds.map((fund) => (
            <TouchableOpacity
              key={fund.id}
              style={sectionStyles.fundItem}
              onPress={() => editFund(fund)}
            >
              <Text style={sectionStyles.fundItemIcon}>
                {fund.type === 'cash' ? '💵' : fund.type === 'credit_card' ? '💳' : '🏦'}
              </Text>
              <View style={sectionStyles.fundItemContent}>
                <Text style={sectionStyles.fundItemType}>
                  {fund.type === 'cash'
                    ? 'Cash / Tunai'
                    : fund.type === 'credit_card'
                    ? 'Credit Card / Kad Kredit'
                    : 'Bank Balance / Baki Bank'}
                </Text>
                <Text style={sectionStyles.fundItemAmount}>
                  {fund.currency ? `${fund.currency} ` : ''}
                  {fund.amount || translate('malaysia.travelInfo.funds.notSpecified', 'Not specified')}
                </Text>
              </View>
              <Text style={sectionStyles.fundItemArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  sectionIntro: {
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  sectionIntroIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  sectionIntroText: {
    ...typography.body2,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  sectionIntroTextSecondary: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
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
  },
  fundEmptyText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  fundEmptyTextSecondary: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fundList: {
    gap: spacing.sm,
  },
  fundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fundItemIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  fundItemContent: {
    flex: 1,
  },
  fundItemType: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  fundItemAmount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fundItemArrow: {
    ...typography.body1,
    color: colors.textSecondary,
  },
});

export default MalaysiaFundsSection;
