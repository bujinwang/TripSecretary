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

const FundsSection = ({
  // Section control
  isExpanded,
  onToggle,
  fieldCount,

  // Form state
  funds = [],

  // Actions
  addFund,
  handleFundItemPress,

  // Customizable labels/translations
  labels = {},

  // Configuration
  config = {},
}) => {
  // Default labels (can be overridden via props)
  const defaultLabels = {
    // Section
    title: 'Proof of Funds',
    subtitle: 'Show you have sufficient money for your trip',
    icon: '💰',
    introIcon: '💳',
    introText: 'Immigration wants to ensure you won\'t be a burden. Simply prove you have enough money to cover your expenses.',

    // Buttons
    addCash: 'Add Cash',
    addCreditCard: 'Add Credit Card Photo',
    addBankBalance: 'Add Bank Balance',
    addBankCard: 'Add Bank Card',
    addDocument: 'Add Document',

    // Empty state
    empty: 'No funds added yet. Please add at least one proof of funds.',

    // Fund types (for display)
    fundTypes: {
      cash: 'Cash',
      credit_card: 'Credit Card',
      bank_card: 'Bank Card',
      bank_balance: 'Bank Balance',
      document: 'Document',
      other: 'Other',
    },

    // Details
    notProvided: 'Not provided',
    photoAttached: 'Photo attached',
  };

  // Default configuration
  const defaultConfig = {
    fundTypes: ['cash', 'credit_card', 'bank_balance'], // Which fund types to show as buttons
    showCustomFundType: false, // Whether to show "Add Other" button
  };

  // Merge defaults with provided values
  const l = { ...defaultLabels, ...labels };
  const c = { ...defaultConfig, ...config };

  // Fund type metadata
  const typeMeta = {
    CASH: { icon: '💵', label: l.fundTypes.cash },
    BANK_CARD: { icon: '💳', label: l.fundTypes.bank_card },
    CREDIT_CARD: { icon: '💳', label: l.fundTypes.credit_card },
    BANK_BALANCE: { icon: '🏦', label: l.fundTypes.bank_balance },
    DOCUMENT: { icon: '📄', label: l.fundTypes.document },
    OTHER: { icon: '💰', label: l.fundTypes.other },
  };

  // Button configuration based on fund types
  const fundTypeButtons = [];
  if (c.fundTypes.includes('cash')) {
    fundTypeButtons.push({ type: 'cash', label: l.addCash });
  }
  if (c.fundTypes.includes('credit_card')) {
    fundTypeButtons.push({ type: 'credit_card', label: l.addCreditCard });
  }
  if (c.fundTypes.includes('bank_balance')) {
    fundTypeButtons.push({ type: 'bank_balance', label: l.addBankBalance });
  }
  if (c.fundTypes.includes('bank_card')) {
    fundTypeButtons.push({ type: 'bank_card', label: l.addBankCard });
  }
  if (c.fundTypes.includes('document')) {
    fundTypeButtons.push({ type: 'document', label: l.addDocument });
  }

  return (
    <CollapsibleSection
      title={l.title}
      subtitle={l.subtitle}
      icon={l.icon}
      badge={funds.length > 0 ? `${funds.length}` : '0'}
      badgeVariant={funds.length > 0 ? 'success' : 'danger'}
      expanded={isExpanded}
      onToggle={onToggle}
      variant="default"
    >
      {/* Context Info Card */}
      <BaseCard
        variant="flat"
        padding="md"
        backgroundColor="#F0F7FF"
        marginBottom="$lg"
        borderLeftWidth={4}
        borderLeftColor="$primary"
      >
        <XStack gap="$sm" alignItems="flex-start">
          <TamaguiText fontSize={20}>{l.introIcon}</TamaguiText>
          <TamaguiText fontSize="$2" color="#2C5AA0" flex={1} lineHeight={20}>
            {l.introText}
          </TamaguiText>
        </XStack>
      </BaseCard>

      {/* Fund Type Buttons */}
      <XStack gap="$sm" marginBottom="$lg" flexWrap="wrap">
        {fundTypeButtons.map((btn) => (
          <BaseButton
            key={btn.type}
            variant="secondary"
            size="md"
            onPress={() => {
              if (addFund && typeof addFund === 'function') {
                addFund(btn.type);
              } else {
                console.error('[FundsSection] addFund is not a function:', addFund);
              }
            }}
            flex={1}
            minWidth="45%"
          >
            {btn.label}
          </BaseButton>
        ))}
      </XStack>

      {/* Funds List or Empty State */}
      {funds.length === 0 ? (
        <BaseCard variant="flat" padding="xl" backgroundColor="#F5F5F5">
          <YStack alignItems="center" justifyContent="center" minHeight={100}>
            <TamaguiText fontSize="$2" color="$textSecondary" textAlign="center">
              {l.empty}
            </TamaguiText>
          </YStack>
        </BaseCard>
      ) : (
        <YStack
          backgroundColor="$card"
          borderRadius="$md"
          borderWidth={1}
          borderColor="#E0E0E0"
        >
          {funds.map((fund, index) => {
            const isLast = index === funds.length - 1;
            const typeKey = (fund.type || 'OTHER').toUpperCase();
            const typeInfo = typeMeta[typeKey] || typeMeta.OTHER;

            // Build display text
            const amountValue = fund.amount ? `${fund.amount} ${fund.currency || ''}`.trim() : '';
            const detailsValue = fund.details || '';

            let displayText;
            if (amountValue && detailsValue) {
              displayText = `${amountValue} • ${detailsValue}`;
            } else {
              displayText = detailsValue || amountValue || l.notProvided;
            }

            // Add photo indicator
            if ((fund.photoUri || fund.photo) && typeKey !== 'CASH') {
              displayText = `${displayText} • ${l.photoAttached}`;
            }

            return (
              <BaseCard
                key={fund.id || `fund-${index}`}
                variant="flat"
                padding="none"
                pressable
                onPress={() => handleFundItemPress(fund)}
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
                      <TamaguiText
                        fontSize="$2"
                        fontWeight="600"
                        color="$text"
                        marginBottom="$xs"
                      >
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
