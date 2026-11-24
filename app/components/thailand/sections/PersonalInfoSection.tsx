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
import debouncedSaveInstance from '../../../utils/DebouncedSave';

import {
  YStack,
  XStack,
  CollapsibleSection,
  BaseCard,
  BaseInput,
  Text as TamaguiText,
} from '../../tamagui';
import { getPhoneCode } from '../../../data/phoneCodes';

type FieldCount = {
  filled: number;
  total: number;
};

type ValidationMap = Record<string, string | undefined>;

type SaveOverrideFn = (data: Record<string, unknown>) => Promise<void>;

type ThailandPersonalInfoSectionProps = {
  t: (key: string, options?: Record<string, unknown>) => string;
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount: FieldCount;
  occupation: string;
  customOccupation: string;
  cityOfResidence: string;
  residentCountry: string;
  phoneCode: string;
  phoneNumber: string;
  email: string;
  cityOfResidenceLabel: string;
  cityOfResidenceHelpText?: string;
  cityOfResidencePlaceholder?: string;
  setOccupation: (value: string) => void;
  setCustomOccupation: (value: string) => void;
  setCityOfResidence: (value: string) => void;
  setResidentCountry: (value: string) => void;
  setPhoneCode: (value: string) => void;
  setPhoneNumber: (value: string) => void;
  setEmail: (value: string) => void;
  errors: ValidationMap;
  warnings: ValidationMap;
  handleFieldBlur: (field: string, value: string) => void;
  lastEditedField?: string | null;
  debouncedSaveData: () => void;
  saveDataToSecureStorageWithOverride?: SaveOverrideFn;
  setLastEditedAt?: (date: Date) => void;
};

const PersonalInfoSection: React.FC<ThailandPersonalInfoSectionProps> = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  occupation,
  customOccupation,
  cityOfResidence,
  residentCountry,
  phoneCode,
  phoneNumber,
  email,
  cityOfResidenceLabel,
  cityOfResidenceHelpText,
  cityOfResidencePlaceholder,
  setOccupation,
  setCustomOccupation,
  setCityOfResidence,
  setResidentCountry,
  setPhoneCode,
  setPhoneNumber,
  setEmail,
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField,
  debouncedSaveData,
  saveDataToSecureStorageWithOverride,
  setLastEditedAt,
}) => {
  const badgeFilled = fieldCount?.filled ?? 0;
  const badgeTotal = fieldCount?.total ?? 0;
  const badgeVariant = badgeFilled === badgeTotal ? 'success' : badgeFilled > 0 ? 'warning' : 'danger';

  const handleOccupationChange = async (value: string) => {
    setOccupation(value);
    handleFieldBlur('occupation', value);

    if (value !== 'OTHER') {
      setCustomOccupation('');
      await debouncedSaveInstance.flushPendingSave('thailand_travel_info');

      if (saveDataToSecureStorageWithOverride && setLastEditedAt) {
        try {
          await saveDataToSecureStorageWithOverride({
            occupation: value,
            customOccupation: '',
          });
          setLastEditedAt(new Date());
        } catch (error) {
          console.error('Failed to save occupation:', error);
        }
      }
    } else {
      debouncedSaveData();
    }
  };

  return (
    <CollapsibleSection
      title={t('thailand.travelInfo.sectionTitles.personal', { defaultValue: 'Personal Information' })}
      subtitle={t('thailand.travelInfo.sectionTitles.personalSubtitle', {
        defaultValue: 'Contact and occupation details',
      })}
      icon="👤"
      badge={`${badgeFilled}/${badgeTotal}`}
      badgeVariant={badgeVariant}
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
          <TamaguiText fontSize={24}>📱</TamaguiText>
          <TamaguiText fontSize="$2" color="#2C5AA0" flex={1} lineHeight={20}>
            {t('thailand.travelInfo.sectionIntros.personal', {
              defaultValue: 'Contact information for immigration purposes',
            })}
          </TamaguiText>
        </XStack>
      </BaseCard>

      <OccupationSelector
        label={t('thailand.travelInfo.fields.occupation.label')}
        value={occupation}
        onValueChange={(value) => {
          void handleOccupationChange(value);
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
        helpText={
          !errors.occupation && warnings.occupation
            ? warnings.occupation
            : t('thailand.travelInfo.fields.occupation.help')
        }
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
          error={!!errors.cityOfResidence}
          autoCapitalize="characters"
          placeholder={cityOfResidencePlaceholder}
        />
        {warnings.cityOfResidence && !errors.cityOfResidence ? (
          <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
            ⚠️ {warnings.cityOfResidence}
          </TamaguiText>
        ) : null}
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
        <YStack width={140} maxWidth={180}>
          <BaseInput
            label={t('thailand.travelInfo.fields.phoneCode.label', { defaultValue: 'Code' })}
            value={phoneCode}
            onChangeText={setPhoneCode}
            onBlur={() => handleFieldBlur('phoneCode', phoneCode)}
            keyboardType="phone-pad"
            maxLength={5}
            error={!!errors.phoneCode}
            fullWidth={false}
          />
        </YStack>
        <YStack flex={1}>
          <BaseInput
            label={t('thailand.travelInfo.fields.phoneNumber.label', { defaultValue: 'Phone Number' })}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            onBlur={() => handleFieldBlur('phoneNumber', phoneNumber)}
            keyboardType="phone-pad"
            helperText={t('thailand.travelInfo.fields.phoneNumber.help', {
              defaultValue: 'Your contact number',
            })}
            error={!!errors.phoneNumber}
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
          error={!!errors.email}
          testID="email-input"
        />
        {warnings.email && !errors.email ? (
          <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
            ⚠️ {warnings.email}
          </TamaguiText>
        ) : null}
      </YStack>
    </CollapsibleSection>
  );
};

export default PersonalInfoSection;
