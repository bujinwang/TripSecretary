/**
 * FundsSection Component
 *
 * Displays funds/proof of money section
 * for Thailand Travel Info Screen
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
  t,
  isExpanded,
  onToggle,
  fieldCount,
  // Form state
  funds,
  // Actions
  addFund,
  handleFundItemPress,
}) => {
  return (
    <CollapsibleSection
      title={t('thailand.travelInfo.sectionTitles.funds', { defaultValue: '资金证明' })}
      subtitle={t('thailand.travelInfo.sectionTitles.fundsSubtitle', { defaultValue: '证明你有足够资金在泰国旅行' })}
      icon="💰"
      badge={funds.length > 0 ? `${funds.length}` : '0'}
      badgeVariant={funds.length > 0 ? 'success' : 'danger'}
      expanded={isExpanded}
      onToggle={onToggle}
      variant="default"
    >
      {/* Border Crossing Context for Funds */}
      <BaseCard
        variant="flat"
        padding="md"
        backgroundColor="#F0F7FF"
        marginBottom="$lg"
        borderLeftWidth={4}
        borderLeftColor="$primary"
      >
        <XStack gap="$sm" alignItems="flex-start">
          <TamaguiText fontSize={20}>💳</TamaguiText>
          <TamaguiText fontSize="$2" color="#2C5AA0" flex={1} lineHeight={20}>
            {t('thailand.travelInfo.sectionIntros.funds', {
              defaultValue: '泰国海关想确保你不会成为负担。只需证明你有足够钱支付旅行费用，通常是每天至少500泰铢。'
            })}
          </TamaguiText>
        </XStack>
      </BaseCard>

      <XStack gap="$sm" marginBottom="$lg" flexWrap="wrap">
        <BaseButton
          variant="secondary"
          size="md"
          onPress={() => addFund('cash')}
          flex={1}
          minWidth="45%"
        >
          {t('thailand.travelInfo.funds.addCash', { defaultValue: '添加现金' })}
        </BaseButton>
        <BaseButton
          variant="secondary"
          size="md"
          onPress={() => addFund('credit_card')}
          flex={1}
          minWidth="45%"
        >
          {t('thailand.travelInfo.funds.addCreditCard', { defaultValue: '添加信用卡照片' })}
        </BaseButton>
        <BaseButton
          variant="secondary"
          size="md"
          onPress={() => addFund('bank_balance')}
          flex={1}
          minWidth="45%"
        >
          {t('thailand.travelInfo.funds.addBankBalance', { defaultValue: '添加银行账户余额' })}
        </BaseButton>
      </XStack>

      {funds.length === 0 ? (
        <BaseCard
          variant="flat"
          padding="xl"
          backgroundColor="#F5F5F5"
        >
          <YStack alignItems="center" justifyContent="center" minHeight={100}>
            <TamaguiText fontSize="$2" color="$textSecondary" textAlign="center">
              {t('thailand.travelInfo.funds.empty', { defaultValue: '尚未添加资金证明，请先新建条目。' })}
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
            const typeMeta = {
              CASH: { icon: '💵' },
              BANK_CARD: { icon: '💳' },
              CREDIT_CARD: { icon: '💳' },
              BANK_BALANCE: { icon: '🏦' },
              DOCUMENT: { icon: '📄' },
              OTHER: { icon: '💰' },
            };

            const typeIcon = typeMeta[typeKey]?.icon || '💰';
            const typeLabel = t(`fundItem.type.${typeKey.toLowerCase()}`, {
              defaultValue: fund.type || 'Other'
            });

            // Build display text
            const amountValue = fund.amount ? `${fund.amount} ${fund.currency || 'THB'}` : '';
            const detailsValue = fund.details || '';
            const currencyValue = fund.currency || '';
            const notProvidedLabel = t('fundItem.detail.notProvided', { defaultValue: 'Not provided' });

            let displayText;
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
              <BaseCard
                key={fund.id}
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
                      {typeIcon}
                    </TamaguiText>
                    <YStack flex={1}>
                      <TamaguiText
                        fontSize="$2"
                        fontWeight="600"
                        color="$text"
                        marginBottom="$xs"
                      >
                        {typeLabel}
                      </TamaguiText>
                      <TamaguiText
                        fontSize="$2"
                        color="$textSecondary"
                        numberOfLines={2}
                      >
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
