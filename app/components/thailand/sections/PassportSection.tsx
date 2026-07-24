/**
 * PassportSection Component
 *
 * Displays passport information form section
 * for Thailand Travel Info Screen
 */

import React from 'react';
import { NationalitySelector, PassportNameInput, DateTimeInput } from '../../../components';
import GenderSelector from '../../GenderSelector';
import { FieldWarningIcon, InputWithValidation } from '../ThailandTravelComponents';
import { GENDER_OPTIONS } from '../../../screens/thailand/constants';
import debouncedSaveInstance from '../../../utils/DebouncedSave';

// Import Tamagui shared components
import {
  YStack,
  XStack,
  CollapsibleSection,
  BaseCard,
  BaseInput,
  Text as TamaguiText,
} from '../../tamagui';

type FieldCount = {
  filled: number;
  total: number;
};

type ValidationMap = Record<string, string | undefined>;

type SaveOverrideFn = (data: Record<string, unknown>) => Promise<void>;

type ThailandPassportSectionProps = {
  t: (key: string, options?: Record<string, unknown>) => string;
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount: FieldCount;
  surname: string;
  middleName: string;
  givenName: string;
  nationality: string;
  passportNo: string;
  visaNumber: string;
  dob: string;
  expiryDate: string;
  sex: string;
  setSurname: (value: string) => void;
  setMiddleName: (value: string) => void;
  setGivenName: (value: string) => void;
  setNationality: (value: string) => void;
  setPassportNo: (value: string) => void;
  setVisaNumber: (value: string) => void;
  setDob: (value: string) => void;
  setExpiryDate: (value: string) => void;
  setSex: (value: string) => void;
  errors: ValidationMap;
  warnings: ValidationMap;
  handleFieldBlur: (field: string, value: string) => void;
  lastEditedField?: string | null;
  debouncedSaveData: () => void;
  saveDataToSecureStorageWithOverride?: SaveOverrideFn;
  setLastEditedAt?: (date: Date) => void;
};

const PassportSection: React.FC<ThailandPassportSectionProps> = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  surname,
  middleName,
  givenName,
  nationality,
  passportNo,
  visaNumber,
  dob,
  expiryDate,
  sex,
  setSurname,
  setMiddleName,
  setGivenName,
  setNationality,
  setPassportNo,
  setVisaNumber,
  setDob,
  setExpiryDate,
  setSex,
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

  const handleGenderChange = async (newSex: string) => {
    setSex(newSex);
    await debouncedSaveInstance.flushPendingSave('thailand_travel_info');

    if (saveDataToSecureStorageWithOverride && setLastEditedAt) {
      try {
        await saveDataToSecureStorageWithOverride({ sex: newSex });
        setLastEditedAt(new Date());
      } catch (error) {
        console.error('Failed to save gender:', error);
      }
    } else {
      debouncedSaveData();
    }

    handleFieldBlur('sex', newSex);
  };

  return (
    <CollapsibleSection
      title={t('thailand.travelInfo.sectionTitles.passport', { defaultValue: 'Passport Information' })}
      subtitle={t('thailand.travelInfo.sectionTitles.passportSubtitle', {
        defaultValue: 'Enter your passport details',
      })}
      icon="📘"
      badge={`${badgeFilled}/${badgeTotal}`}
      badgeVariant={badgeVariant}
      expanded={isExpanded}
      onToggle={onToggle}
      variant="default"
    >
      <BaseCard variant="flat" padding="md" backgroundColor="#F0F7FF" marginBottom="$lg">
        <XStack gap="$sm" alignItems="flex-start">
          <TamaguiText fontSize={20}>🛂</TamaguiText>
          <TamaguiText fontSize="$2" color="$textSecondary" flex={1} lineHeight={20}>
            {t('thailand.travelInfo.sectionIntros.passport', {
              defaultValue: 'Please ensure all details match your passport exactly',
            })}
          </TamaguiText>
        </XStack>
      </BaseCard>

      <YStack marginBottom="$md">
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$xs">
          <TamaguiText fontSize="$3" fontWeight="600" color="$textPrimary">
            {t('thailand.travelInfo.fields.passportName.label')}
          </TamaguiText>
          <FieldWarningIcon hasWarning={!!warnings.fullName} hasError={!!errors.fullName} />
        </XStack>
        <PassportNameInput
          surname={surname}
          middleName={middleName}
          givenName={givenName}
          onSurnameChange={setSurname}
          onMiddleNameChange={setMiddleName}
          onGivenNameChange={setGivenName}
          onBlur={() =>
            handleFieldBlur('fullName', [surname, middleName, givenName].filter(Boolean).join(', '))
          }
          helpText={t('thailand.travelInfo.fields.passportName.help')}
          error={!!errors.fullName}
          errorMessage={errors.fullName}
        />
        {warnings.fullName && !errors.fullName ? (
          <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
            {warnings.fullName}
          </TamaguiText>
        ) : null}
      </YStack>

      <NationalitySelector
        label={t('thailand.travelInfo.fields.nationality.label')}
        value={nationality}
        onValueChange={(code) => {
          setNationality(code);
          debouncedSaveData();
        }}
        helpText={t('thailand.travelInfo.fields.nationality.help')}
        error={!!errors.nationality}
        errorMessage={errors.nationality}
      />

      <YStack marginBottom="$md">
        <BaseInput
          label={t('thailand.travelInfo.fields.passportNo.label', { defaultValue: 'Passport Number' })}
          value={passportNo}
          onChangeText={setPassportNo}
          onBlur={() => handleFieldBlur('passportNo', passportNo)}
          helperText={t('thailand.travelInfo.fields.passportNo.help', {
            defaultValue: 'Enter your passport number',
          })}
          error={!!errors.passportNo}
          required
          autoCapitalize="characters"
          testID="passport-number-input"
        />
        {warnings.passportNo && !errors.passportNo ? (
          <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
            ⚠️ {warnings.passportNo}
          </TamaguiText>
        ) : null}
      </YStack>

      <YStack marginBottom="$md">
        <BaseInput
          label={t('thailand.travelInfo.fields.visaNumber.label', { defaultValue: 'Visa Number (Optional)' })}
          value={visaNumber}
          onChangeText={(text) => setVisaNumber(text.toUpperCase())}
          onBlur={() => handleFieldBlur('visaNumber', visaNumber)}
          helperText={t('thailand.travelInfo.fields.visaNumber.help', {
            defaultValue: 'Enter visa number if applicable',
          })}
          error={!!errors.visaNumber}
          required={false}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          keyboardType="ascii-capable"
        />
        {warnings.visaNumber && !errors.visaNumber ? (
          <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
            ⚠️ {warnings.visaNumber}
          </TamaguiText>
        ) : null}
      </YStack>

      <DateTimeInput
        label={t('thailand.travelInfo.fields.dob.label')}
        value={dob}
        onChangeText={(newValue) => {
          setDob(newValue);
          handleFieldBlur('dob', newValue);
        }}
        mode="date"
        dateType="past"
        helpText={t('thailand.travelInfo.fields.dob.help')}
        error={!!errors.dob}
        errorMessage={errors.dob}
      />

      <DateTimeInput
        label={t('thailand.travelInfo.fields.expiryDate.label')}
        value={expiryDate}
        onChangeText={(newValue) => {
          setExpiryDate(newValue);
          handleFieldBlur('expiryDate', newValue);
        }}
        mode="date"
        dateType="future"
        helpText={t('thailand.travelInfo.fields.expiryDate.help')}
        error={!!errors.expiryDate}
        errorMessage={errors.expiryDate}
      />

      <YStack marginBottom="$lg">
        <TamaguiText fontSize="$3" fontWeight="600" color="$textPrimary" marginBottom="$sm">
          {t('thailand.travelInfo.fields.sex.label')}
        </TamaguiText>
        <GenderSelector value={sex} onChange={handleGenderChange} t={t} options={GENDER_OPTIONS} />
      </YStack>
    </CollapsibleSection>
  );
};

export default PassportSection;
