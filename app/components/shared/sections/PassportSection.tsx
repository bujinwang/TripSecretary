/**
 * Shared PassportSection Component
 *
 * Generic, country-agnostic passport information form section
 * Can be used by any country with customizable labels and translations
 *
 * Usage:
 * <PassportSection
 *   isExpanded={true}
 *   onToggle={() => setExpanded(!expanded)}
 *   fieldCount={{ filled: 8, total: 9 }}
 *   surname={surname}
 *   setSurname={setSurname}
 *   // ... other props
 *   labels={{
 *     title: "Passport Information",
 *     subtitle: "Enter your passport details",
 *     introText: "Please ensure all details match your passport exactly",
 *     // ... other labels
 *   }}
 * />
 */

import React from 'react';
import { NationalitySelector, PassportNameInput, DateTimeInput } from '../../../components';
import GenderSelector from '../../GenderSelector';

// Import Tamagui shared components
import {
  YStack,
  XStack,
  CollapsibleSection,
  BaseCard,
  BaseInput,
  Text as TamaguiText,
} from '../../tamagui';

type GenderOption = { label: string; value: string };

type FieldCount = {
  filled: number;
  total: number;
};

type ErrorMap = Record<string, string | undefined>;

type WarningMap = Record<string, string | undefined>;

export interface PassportSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount: FieldCount;
  surname: string;
  middleName: string;
  givenName: string;
  nationality: string;
  passportNo: string;
  visaNumber?: string;
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
  errors?: ErrorMap;
  warnings?: WarningMap;
  handleFieldBlur?: (field: string, value: unknown) => void;
  debouncedSaveData?: () => void;
  saveDataToSecureStorageWithOverride?: (data: Record<string, unknown>) => Promise<void>;
  setLastEditedAt?: (date: Date) => void;
  labels?: Record<string, string>;
  config?: {
    showVisaNumber?: boolean;
    genderOptions?: GenderOption[];
  };
}

const PassportSection: React.FC<PassportSectionProps> = ({
  // Section control
  isExpanded,
  onToggle,
  fieldCount,

  // Form state
  surname,
  middleName,
  givenName,
  nationality,
  passportNo,
  visaNumber,
  dob,
  expiryDate,
  sex,

  // Setters
  setSurname,
  setMiddleName,
  setGivenName,
  setNationality,
  setPassportNo,
  setVisaNumber,
  setDob,
  setExpiryDate,
  setSex,

  // Validation
  errors = {},
  warnings = {},
  handleFieldBlur,

  // Actions
  debouncedSaveData,
  saveDataToSecureStorageWithOverride,
  setLastEditedAt,

  // Customizable labels/translations
  labels = {},

  // Configuration
  config = {},
}) => {
  // Default labels (can be overridden via props)
  const defaultLabels = {
    // Section
    title: 'Passport Information',
    subtitle: 'Enter your passport details',
    icon: '📘',
    introIcon: '🛂',
    introText: 'Please ensure all details match your passport exactly',

    // Fields
    surnameLabel: 'Surname / Family name',
    middleNameLabel: 'Middle name (optional)',
    givenNameLabel: 'Given name / First name',
    surnamePlaceholder: 'e.g., LI',
    middleNamePlaceholder: 'Optional',
    givenNamePlaceholder: 'e.g., MAOA',
    fullName: 'Full Name (as in passport)',
    fullNameHelp: 'Enter your name exactly as it appears in your passport',
    nationality: 'Nationality',
    nationalityHelp: 'Select your nationality',
    passportNo: 'Passport Number',
    passportNoHelp: 'Enter your passport number',
    visaNumber: 'Visa Number (Optional)',
    visaNumberHelp: 'Enter visa number if applicable',
    dob: 'Date of Birth',
    dobHelp: 'Select your date of birth',
    expiryDate: 'Passport Expiry Date',
    expiryDateHelp: 'Select passport expiry date',
    sex: 'Gender',
  };

  // Default configuration
  const defaultConfig = {
    showVisaNumber: true,
    genderOptions: [
      { label: 'Male', value: 'M' },
      { label: 'Female', value: 'F' },
    ],
  };

  // Merge defaults with provided values
  const l = { ...defaultLabels, ...labels };
  const c = { ...defaultConfig, ...config };

  // Handle gender change with immediate save
  const handleGenderChange = async (newSex) => {
    setSex(newSex);
    if (saveDataToSecureStorageWithOverride && setLastEditedAt) {
      try {
        await saveDataToSecureStorageWithOverride({ sex: newSex });
        setLastEditedAt(new Date());
      } catch (error) {
        console.error('Failed to save gender:', error);
      }
    } else if (debouncedSaveData) {
      debouncedSaveData();
    }
  };

  return (
    <CollapsibleSection
      title={l.title}
      subtitle={l.subtitle}
      icon={l.icon}
      badge={`${fieldCount.filled}/${fieldCount.total}`}
      badgeVariant={
        fieldCount.filled === fieldCount.total
          ? 'success'
          : fieldCount.filled > 0
          ? 'warning'
          : 'danger'
      }
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
          <TamaguiText fontSize="$2" color="$textSecondary" flex={1} lineHeight={20}>
            {l.introText}
          </TamaguiText>
        </XStack>
      </BaseCard>

      {/* Full Name Input */}
      <YStack marginBottom="$md">
        <PassportNameInput
          surname={surname}
          middleName={middleName}
          givenName={givenName}
          onSurnameChange={setSurname}
          onMiddleNameChange={setMiddleName}
          onGivenNameChange={setGivenName}
          onBlur={() =>
            handleFieldBlur &&
            handleFieldBlur('fullName', [surname, middleName, givenName].filter(Boolean).join(', '))
          }
          helpText={l.fullNameHelp}
          error={!!errors.fullName}
          errorMessage={errors.fullName}
          surnameLabel={l.surnameLabel}
          middleNameLabel={l.middleNameLabel}
          givenNameLabel={l.givenNameLabel}
          surnamePlaceholder={l.surnamePlaceholder}
          middleNamePlaceholder={l.middleNamePlaceholder}
          givenNamePlaceholder={l.givenNamePlaceholder}
        />
        {warnings.fullName && !errors.fullName && (
          <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
            ⚠️ {warnings.fullName}
          </TamaguiText>
        )}
      </YStack>

      {/* Nationality Selector */}
      <NationalitySelector
        label={l.nationality}
        value={nationality}
        onValueChange={(code) => {
          setNationality(code);
          debouncedSaveData && debouncedSaveData();
        }}
        helpText={l.nationalityHelp}
        error={!!errors.nationality}
        errorMessage={errors.nationality}
      />

      {/* Passport Number */}
      <YStack marginBottom="$md">
        <BaseInput
          label={l.passportNo}
          value={passportNo}
          onChangeText={setPassportNo}
          onBlur={() => handleFieldBlur && handleFieldBlur('passportNo', passportNo)}
          helperText={l.passportNoHelp}
          error={errors.passportNo}
          required={true}
          autoCapitalize="characters"
          testID="passport-number-input"
        />
        {warnings.passportNo && !errors.passportNo && (
          <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
            ⚠️ {warnings.passportNo}
          </TamaguiText>
        )}
      </YStack>

      {/* Visa Number (optional, can be hidden) */}
      {c.showVisaNumber && (
        <YStack marginBottom="$md">
          <BaseInput
            label={l.visaNumber}
            value={visaNumber}
            onChangeText={(text) => setVisaNumber(text.toUpperCase())}
            onBlur={() => handleFieldBlur && handleFieldBlur('visaNumber', visaNumber)}
            helperText={l.visaNumberHelp}
            error={errors.visaNumber}
            required={false}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            keyboardType="ascii-capable"
          />
          {warnings.visaNumber && !errors.visaNumber && (
            <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
              ⚠️ {warnings.visaNumber}
            </TamaguiText>
          )}
        </YStack>
      )}

      {/* Date of Birth */}
      <DateTimeInput
        label={l.dob}
        value={dob}
        onChangeText={(newValue) => {
          setDob(newValue);
          handleFieldBlur && handleFieldBlur('dob', newValue);
        }}
        mode="date"
        dateType="past"
        helpText={l.dobHelp}
        error={!!errors.dob}
        errorMessage={errors.dob}
      />

      {/* Passport Expiry Date */}
      <DateTimeInput
        label={l.expiryDate}
        value={expiryDate}
        onChangeText={(newValue) => {
          setExpiryDate(newValue);
          handleFieldBlur && handleFieldBlur('expiryDate', newValue);
        }}
        mode="date"
        dateType="future"
        helpText={l.expiryDateHelp}
        error={!!errors.expiryDate}
        errorMessage={errors.expiryDate}
      />

      {/* Gender Selector */}
      <YStack marginBottom="$md">
        <TamaguiText
          fontSize="$2"
          fontWeight="600"
          color="$text"
          marginBottom="$sm"
        >
          {l.sex}
        </TamaguiText>
        <GenderSelector
          value={sex}
          onChange={handleGenderChange}
          options={c.genderOptions}
        />
      </YStack>
    </CollapsibleSection>
  );
};

export default PassportSection;
