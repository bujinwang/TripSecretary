/**
 * PersonalInfoSection Component
 *
 * Displays personal information form section (occupation, contact, etc.)
 * for Thailand Travel Info Screen
 */

import React from 'react';
import { NationalitySelector } from '../../../components';
import { InputWithValidation } from '../ThailandTravelComponents';
import OccupationSelector from '../../OccupationSelector';
import Input from '../../../components/Input';
import { getPhoneCode } from '../../../data/phoneCodes';

// Import Tamagui shared components
import {
  YStack,
  XStack,
  CollapsibleSection,
  BaseCard,
  BaseInput,
  Text as TamaguiText,
} from '../../tamagui';

const PersonalInfoSection = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  // Form state
  occupation,
  customOccupation,
  cityOfResidence,
  residentCountry,
  phoneCode,
  phoneNumber,
  email,
  // Computed values
  cityOfResidenceLabel,
  cityOfResidenceHelpText,
  cityOfResidencePlaceholder,
  // Setters
  setOccupation,
  setCustomOccupation,
  setCityOfResidence,
  setResidentCountry,
  setPhoneCode,
  setPhoneNumber,
  setEmail,
  // Validation
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField,
  // Actions
  debouncedSaveData,
}) => {

  return (
    <CollapsibleSection
      title={t('thailand.travelInfo.sectionTitles.personal', { defaultValue: 'Personal Information' })}
      subtitle={t('thailand.travelInfo.sectionTitles.personalSubtitle', { defaultValue: 'Contact and occupation details' })}
      icon="👤"
      badge={`${fieldCount.filled}/${fieldCount.total}`}
      badgeVariant={fieldCount.filled === fieldCount.total ? 'success' : fieldCount.filled > 0 ? 'warning' : 'danger'}
      expanded={isExpanded}
      onToggle={onToggle}
      variant="default"
    >
      {/* Contact Context Info - Using Tamagui BaseCard */}
      <BaseCard variant="flat" padding="md" backgroundColor="#F0F7FF" marginBottom="$lg" borderLeftWidth={4} borderLeftColor="$primary">
        <XStack gap="$sm" alignItems="flex-start">
          <TamaguiText fontSize={24}>📱</TamaguiText>
          <TamaguiText fontSize="$2" color="#2C5AA0" flex={1} lineHeight={20}>
            {t('thailand.travelInfo.sectionIntros.personal', {
              defaultValue: 'Contact information for immigration purposes'
            })}
          </TamaguiText>
        </XStack>
      </BaseCard>

      <OccupationSelector
        label={t('thailand.travelInfo.fields.occupation.label')}
        value={occupation}
        onValueChange={(value) => {
          setOccupation(value);
          if (value !== 'OTHER') {
            setCustomOccupation('');
            handleFieldBlur('occupation', value);
          }
          debouncedSaveData();
        }}
        customValue={customOccupation}
        onCustomChange={(text) => {
          setCustomOccupation(text.toUpperCase());
        }}
        onCustomBlur={() => {
          const finalOccupation = customOccupation.trim() ? customOccupation : occupation;
          handleFieldBlur('occupation', finalOccupation);
          debouncedSaveData();
        }}
        customLabel={t('thailand.travelInfo.fields.occupation.label')}
        customPlaceholder="e.g., ACCOUNTANT, ENGINEER"
        customHelpText={t('thailand.travelInfo.fields.occupation.help')}
        helpText={!errors.occupation && warnings.occupation ? warnings.occupation : t('thailand.travelInfo.fields.occupation.help')}
        error={!!errors.occupation}
        errorMessage={errors.occupation}
      />

      <YStack marginBottom="$md">
        <BaseInput
          label={cityOfResidenceLabel}
          value={cityOfResidence}
          onChangeText={(text) => {
            setCityOfResidence(text.toUpperCase());
          }}
          onBlur={() => handleFieldBlur('cityOfResidence', cityOfResidence)}
          helperText={cityOfResidenceHelpText}
          error={errors.cityOfResidence}
          autoCapitalize="characters"
          placeholder={cityOfResidencePlaceholder}
        />
        {warnings.cityOfResidence && !errors.cityOfResidence && (
          <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
            ⚠️ {warnings.cityOfResidence}
          </TamaguiText>
        )}
      </YStack>

      <NationalitySelector
        label={t('thailand.travelInfo.fields.residentCountry.label')}
        value={residentCountry}
        onValueChange={(code) => {
          setResidentCountry(code);
          setPhoneCode(getPhoneCode(code));
          debouncedSaveData();
        }}
        helpText={t('thailand.travelInfo.fields.residentCountry.help')}
        error={!!errors.residentCountry}
        errorMessage={errors.residentCountry}
      />

      <XStack gap="$md" marginBottom="$md">
        <YStack flex={0.3}>
          <BaseInput
            label={t('thailand.travelInfo.fields.phoneCode.label', { defaultValue: 'Code' })}
            value={phoneCode}
            onChangeText={setPhoneCode}
            onBlur={() => handleFieldBlur('phoneCode', phoneCode)}
            keyboardType="phone-pad"
            maxLength={5}
            error={errors.phoneCode}
            fullWidth={false}
          />
        </YStack>
        <YStack flex={0.7}>
          <BaseInput
            label={t('thailand.travelInfo.fields.phoneNumber.label', { defaultValue: 'Phone Number' })}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            onBlur={() => handleFieldBlur('phoneNumber', phoneNumber)}
            keyboardType="phone-pad"
            helperText={t('thailand.travelInfo.fields.phoneNumber.help', { defaultValue: 'Your contact number' })}
            error={errors.phoneNumber}
            fullWidth={false}
          />
        </YStack>
      </XStack>

      <YStack marginBottom="$md">
        <BaseInput
          label={t('thailand.travelInfo.fields.email.label', { defaultValue: 'Email Address' })}
          value={email}
          onChangeText={setEmail}
          onBlur={() => handleFieldBlur('email', email)}
          keyboardType="email-address"
          helperText={t('thailand.travelInfo.fields.email.help', { defaultValue: 'Your email address' })}
          error={errors.email}
          testID="email-input"
        />
        {warnings.email && !errors.email && (
          <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
            ⚠️ {warnings.email}
          </TamaguiText>
        )}
      </YStack>
    </CollapsibleSection>
  );
};

export default PersonalInfoSection;
