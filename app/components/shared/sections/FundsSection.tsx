/**
 * Shared FundsSection Component
 *
 * Generic, country-agnostic funds/proof of money section
 * Can be used by any country with customizable labels and fund types
 *
 * Usage:
 * <FundsSection
 *   isExpanded={true}
 *   onToggle={() => setExpanded(!expanded)}
 *   funds={funds}
 *   addFund={addFund}
 *   handleFundItemPress={handleFundItemPress}
 *   labels={{
 *     title: "Proof of Funds",
 *     subtitle: "Show you have sufficient money",
 *     // ... other labels
 *   }}
 *   config={{
 *     fundTypes: ['cash', 'credit_card', 'bank_balance'],
 *   }}
 * />
 */

import React from 'react';
import {
  YStack,
  XStack,
  CollapsibleSection,
  BaseCard,
  BaseButton,
  Text as TamaguiText,
} from '../../tamagui';

type FundType = 'cash' | 'credit_card' | 'bank_card' | 'bank_balance' | 'document' | 'other';

type FundTypeUpper = 'CASH' | 'CREDIT_CARD' | 'BANK_CARD' | 'BANK_BALANCE' | 'DOCUMENT' | 'OTHER';

export interface FundSummary {
  id?: string;
  type?: FundType | string;
  amount?: number | string;
  currency?: string;
  details?: string;
  photoUri?: string;
  photo?: string;
}

export interface FundSectionLabels {
  title: string;
  subtitle: string;
  icon: string;
  introIcon: string;
  introText: string;
  addCash: string;
  addCreditCard: string;
  addBankBalance: string;
  addBankCard: string;
  addDocument: string;
  empty: string;
  fundTypes: Record<FundType, string>;
  notProvided: string;
  photoAttached: string;
}

export interface FundSectionConfig {
  fundTypes: FundType[];
  showCustomFundType: boolean;
}

export interface FundsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: number;
  funds?: FundSummary[];
  addFund?: (type: FundType) => void;
  handleFundItemPress?: (fund: FundSummary) => void;
  labels?: Partial<FundSectionLabels>;
  config?: Partial<FundSectionConfig>;
}

const DEFAULT_LABELS: FundSectionLabels = {
  title: 'Proof of Funds',
  subtitle: 'Show you have sufficient money for your trip',
  icon: '💰',
  introIcon: '💳',
  introText:
    "Immigration wants to ensure you won't be a burden. Simply prove you have enough money to cover your expenses.",
  addCash: 'Add Cash',
  addCreditCard: 'Add Credit Card Photo',
  addBankBalance: 'Add Bank Balance',
  addBankCard: 'Add Bank Card',
  addDocument: 'Add Document',
  empty: 'No funds added yet. Please add at least one proof of funds.',
  fundTypes: {
    cash: 'Cash',
    credit_card: 'Credit Card',
    bank_card: 'Bank Card',
    bank_balance: 'Bank Balance',
    document: 'Document',
    other: 'Other',
  },
  notProvided: 'Not provided',
  photoAttached: 'Photo attached',
};

const DEFAULT_CONFIG: FundSectionConfig = {
  fundTypes: ['cash', 'credit_card', 'bank_balance'],
  showCustomFundType: false,
};

const TYPE_META: Record<FundTypeUpper, { icon: string; label: string }> = {
  CASH: { icon: '💵', label: DEFAULT_LABELS.fundTypes.cash },
  BANK_CARD: { icon: '💳', label: DEFAULT_LABELS.fundTypes.bank_card },
  CREDIT_CARD: { icon: '💳', label: DEFAULT_LABELS.fundTypes.credit_card },
  BANK_BALANCE: { icon: '🏦', label: DEFAULT_LABELS.fundTypes.bank_balance },
  DOCUMENT: { icon: '📄', label: DEFAULT_LABELS.fundTypes.document },
  OTHER: { icon: '💰', label: DEFAULT_LABELS.fundTypes.other },
};

interface FundTypeButtonConfig {
  type: FundType;
  label: string;
}

const FundsSection: React.FC<FundsSectionProps> = ({
  isExpanded,
  onToggle,
  fieldCount, // reserved for analytics or badges
  funds = [],
  addFund,
  handleFundItemPress,
  labels,
  config,
}) => {
  const mergedLabels: FundSectionLabels = {
    ...DEFAULT_LABELS,
    ...labels,
    fundTypes: {
      ...DEFAULT_LABELS.fundTypes,
      ...(labels?.fundTypes ?? {}),
    },
  };

  const mergedConfig: FundSectionConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    fundTypes: config?.fundTypes ?? DEFAULT_CONFIG.fundTypes,
  };

  const typeMeta: Record<FundTypeUpper, { icon: string; label: string }> = {
    CASH: { icon: '💵', label: mergedLabels.fundTypes.cash },
    BANK_CARD: { icon: '💳', label: mergedLabels.fundTypes.bank_card },
    CREDIT_CARD: { icon: '💳', label: mergedLabels.fundTypes.credit_card },
    BANK_BALANCE: { icon: '🏦', label: mergedLabels.fundTypes.bank_balance },
    DOCUMENT: { icon: '📄', label: mergedLabels.fundTypes.document },
    OTHER: { icon: '💰', label: mergedLabels.fundTypes.other },
  };

  const fundTypeButtons: FundTypeButtonConfig[] = [];

  if (mergedConfig.fundTypes.includes('cash')) {
    fundTypeButtons.push({ type: 'cash', label: mergedLabels.addCash });
  }
  if (mergedConfig.fundTypes.includes('credit_card')) {
    fundTypeButtons.push({ type: 'credit_card', label: mergedLabels.addCreditCard });
  }
  if (mergedConfig.fundTypes.includes('bank_balance')) {
    fundTypeButtons.push({ type: 'bank_balance', label: mergedLabels.addBankBalance });
  }
  if (mergedConfig.fundTypes.includes('bank_card')) {
    fundTypeButtons.push({ type: 'bank_card', label: mergedLabels.addBankCard });
  }
  if (mergedConfig.fundTypes.includes('document')) {
    fundTypeButtons.push({ type: 'document', label: mergedLabels.addDocument });
  }

  return (
    <CollapsibleSection
      title={mergedLabels.title}
      subtitle={mergedLabels.subtitle}
      icon={mergedLabels.icon}
      badge={funds.length > 0 ? `${funds.length}` : '0'}
      badgeVariant={funds.length > 0 ? 'success' : 'danger'}
      expanded={isExpanded}
      onToggle={onToggle}
      variant="default"
    >
      <BaseCard
        variant="flat"
        padding="md"
        backgroundColor="#F0F7FF"
        marginBottom="$lg"
        borderLeftWidth={4}
        borderLeftColor="$primary"
      >
        <XStack gap="$sm" alignItems="flex-start">
          <TamaguiText fontSize={20}>{mergedLabels.introIcon}</TamaguiText>
          <TamaguiText fontSize="$2" color="#2C5AA0" flex={1} lineHeight={20}>
            {mergedLabels.introText}
          </TamaguiText>
        </XStack>
      </BaseCard>

      <XStack gap="$sm" marginBottom="$lg" flexWrap="wrap">
        {fundTypeButtons.map((btn) => (
          <BaseButton
            key={btn.type}
            variant="secondary"
            size="md"
            onPress={() => {
              if (addFund) {
                addFund(btn.type);
              } else {
                console.error('[FundsSection] addFund is not defined');
              }
            }}
            flex={1}
            minWidth="45%"
          >
            {btn.label}
          </BaseButton>
        ))}
      </XStack>

      {funds.length === 0 ? (
        <BaseCard variant="flat" padding="xl" backgroundColor="#F5F5F5">
          <YStack alignItems="center" justifyContent="center" minHeight={100}>
            <TamaguiText fontSize="$2" color="$textSecondary" textAlign="center">
              {mergedLabels.empty}
            </TamaguiText>
          </YStack>
        </BaseCard>
      ) : (
        <YStack backgroundColor="$card" borderRadius="$md" borderWidth={1} borderColor="#E0E0E0">
          {funds.map((fund, index) => {
            const isLast = index === funds.length - 1;
            const typeKey = ((fund.type ?? 'OTHER').toString().toUpperCase().replace(/-/g, '_')) as FundTypeUpper;
            const typeInfo = typeMeta[typeKey] ?? typeMeta.OTHER;

            const amountValue = fund.amount ? `${fund.amount} ${fund.currency ?? ''}`.trim() : '';
            const detailsValue = fund.details ?? '';

            let displayText: string;
            if (amountValue && detailsValue) {
              displayText = `${amountValue} • ${detailsValue}`;
            } else {
              displayText = detailsValue || amountValue || mergedLabels.notProvided;
            }

            if ((fund.photoUri || fund.photo) && typeKey !== 'CASH') {
              displayText = `${displayText} • ${mergedLabels.photoAttached}`;
            }

            return (
              <BaseCard
                key={fund.id ?? `fund-${index}`}
                variant="flat"
                padding="none"
                pressable
                onPress={() => handleFundItemPress?.(fund)}
                borderRadius={0}
                borderBottomWidth={!isLast ? 1 : 0}
                borderBottomColor="#E0E0E0"
              >
                <XStack padding="$md" alignItems="center" justifyContent="space-between">
                  <XStack alignItems="center" flex={1}>
                    <TamaguiText fontSize={32} marginRight="$md">
                      {typeInfo.icon}
                    </TamaguiText>
                    <YStack flex={1}>
                      <TamaguiText fontSize="$2" fontWeight="600" color="$text" marginBottom="$xs">
                        {typeInfo.label}
                      </TamaguiText>
                      <TamaguiText fontSize="$2" color="$textSecondary" numberOfLines={2}>
                        {displayText}
                      </TamaguiText>
                    </YStack>
                  </XStack>
                  <TamaguiText fontSize="$4" color="$textSecondary" marginLeft="$sm">
                    ›
                  </TamaguiText>
                </XStack>
              </BaseCard>
            );
          })}
        </YStack>
      )}
    </CollapsibleSection>
  );
};

export default FundsSection;
