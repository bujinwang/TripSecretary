// FundsSection.js
// Funds proof section for Malaysia Travel Info Screen
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';
import Button from '../../Button';
import { colors, typography, spacing } from '../../../theme';

const FUND_REQUIREMENTS = {
  MINIMUM_PER_DAY_MYR: 100,
  MINIMUM_PER_DAY_THB: 800,
  MINIMUM_PER_DAY_USD: 25,
};

/**
 * Funds section component for Malaysia Travel Info Screen
 * @param {Object} props - Component props
 * @returns {JSX.Element} Funds section component
 */
const FundsSection = ({
  // Section state
  isExpanded,
  onToggle,
  fieldCount,

  // Form values
  funds,

  // Fund management functions
  addFund,
  editFund,

  // i18n
  t,

  // Styles
  styles: customStyles,
}) => {
  return (
    <CollapsibleSection
      title="💰 Funds Proof / Bukti Kewangan"
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionIntroIcon}>💳</Text>
        <Text style={styles.sectionIntroText}>
          Malaysia immigration requires proof of sufficient funds for your stay. The minimum requirement is approximately MYR {FUND_REQUIREMENTS.MINIMUM_PER_DAY_MYR} (~{FUND_REQUIREMENTS.MINIMUM_PER_DAY_THB} THB or ~${FUND_REQUIREMENTS.MINIMUM_PER_DAY_USD} USD) per day.
        </Text>
        <Text style={styles.sectionIntroTextSecondary}>
          Imigresen Malaysia memerlukan bukti dana yang mencukupi untuk penginapan anda. Keperluan minimum adalah kira-kira MYR {FUND_REQUIREMENTS.MINIMUM_PER_DAY_MYR} sehari.
        </Text>
      </View>

      <View style={styles.fundActions}>
        <Button
          title="Add Cash / Tambah Tunai"
          onPress={() => addFund('cash')}
          variant="secondary"
          style={styles.fundButton}
        />
        <Button
          title="Add Credit Card / Tambah Kad Kredit"
          onPress={() => addFund('credit_card')}
          variant="secondary"
          style={styles.fundButton}
        />
        <Button
          title="Add Bank Balance / Tambah Baki Bank"
          onPress={() => addFund('bank_balance')}
          variant="secondary"
          style={styles.fundButton}
        />
      </View>

      {funds.length === 0 ? (
        <View style={styles.fundEmptyState}>
          <Text style={styles.fundEmptyText}>
            No funds added yet. Please add at least one fund proof.
          </Text>
          <Text style={styles.fundEmptyTextSecondary}>
            Tiada dana ditambah lagi. Sila tambah sekurang-kurangnya satu bukti dana.
          </Text>
        </View>
      ) : (
        <View style={styles.fundList}>
          {funds.map((fund) => (
            <TouchableOpacity
              key={fund.id}
              style={styles.fundItem}
              onPress={() => editFund(fund)}
            >
              <Text style={styles.fundItemIcon}>
                {fund.type === 'cash' ? '💵' : fund.type === 'credit_card' ? '💳' : '🏦'}
              </Text>
              <View style={styles.fundItemContent}>
                <Text style={styles.fundItemType}>
                  {fund.type === 'cash' ? 'Cash / Tunai' :
                   fund.type === 'credit_card' ? 'Credit Card / Kad Kredit' :
                   'Bank Balance / Baki Bank'}
                </Text>
                <Text style={styles.fundItemAmount}>
                  {fund.currency} {fund.amount || 'Not specified'}
                </Text>
              </View>
              <Text style={styles.fundItemArrow}>›</Text>
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

export default FundsSection;
