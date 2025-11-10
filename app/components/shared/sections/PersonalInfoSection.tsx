/**
 * Shared PersonalInfoSection Component
 *
 * Generic, country-agnostic personal information form section
 * Can be used by any country with customizable labels and translations
 *
 * Usage:
 * <PersonalInfoSection
 *   isExpanded={true}
 *   onToggle={() => setExpanded(!expanded)}
 *   fieldCount={{ filled: 6, total: 6 }}
 *   occupation={occupation}
 *   setOccupation={setOccupation}
 *   // ... other props
 *   labels={{
 *     title: "Personal Information",
 *     subtitle: "Contact and occupation details",
 *     // ... other labels
 *   }}
 * />
 */

import React from 'react';
import { NationalitySelector } from '../../../components';
import OccupationSelector from '../../OccupationSelector';
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

interface FieldCount {
  filled: number;
  total: number;
}

type ErrorMap = Record<string, string | undefined>;

type WarningMap = Record<string, string | undefined>;

export interface PersonalInfoSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount: FieldCount;
  occupation: string;
  customOccupation: string;
  cityOfResidence: string;
  residentCountry?: string;
  countryOfResidence?: string;
  phoneCode: string;
  phoneNumber: string;
  email: string;
  setOccupation: (value: string) => void;
  setCustomOccupation: (value: string) => void;
  setCityOfResidence: (value: string) => void;
  setResidentCountry?: (value: string) => void;
  setCountryOfResidence?: (value: string) => void;
  setPhoneCode?: (value: string) => void;
  setPhoneNumber: (value: string) => void;
  setEmail: (value: string) => void;
  errors?: ErrorMap;
  warnings?: WarningMap;
  handleFieldBlur?: (field: string, value: unknown) => void;
  debouncedSaveData?: () => void;
  labels?: Record<string, string>;
  config?: Record<string, any>;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  // Section control
  isExpanded,
  onToggle,
  fieldCount,

  // Form state
  occupation,
  customOccupation,
  cityOfResidence,
  residentCountry,
  countryOfResidence,
  phoneCode,
  phoneNumber,
  email,

  // Setters
  setOccupation,
  setCustomOccupation,
  setCityOfResidence,
  setResidentCountry,
  setCountryOfResidence,
  setPhoneCode,
  setPhoneNumber,
  setEmail,

  // Validation
  errors = {},
  warnings = {},
  handleFieldBlur,

  // Actions
  debouncedSaveData,

  // Customizable labels/translations
  labels = {},

  // Configuration
  config = {},
}) => {
  // Default labels (can be overridden via props)
  const defaultLabels = {
    // Section
    title: 'Personal Information',
    subtitle: 'Contact and occupation details',
    icon: '👤',
    introIcon: '📱',
    introText: 'Contact information for immigration purposes',

    // Fields
    occupation: 'Occupation',
    occupationHelp: 'Select or enter your occupation',
    occupationCustomLabel: 'Enter your occupation',
    occupationCustomPlaceholder: 'e.g., ACCOUNTANT, ENGINEER',
    occupationCustomHelp: 'Enter your occupation in English',

    cityOfResidence: 'City of Residence',
    cityOfResidenceHelp: 'City where you currently live',
    cityOfResidencePlaceholder: 'e.g., BANGKOK, LONDON',

    residentCountry: 'Country of Residence',
    residentCountryHelp: 'Country where you currently live',
    countryOfResidence: 'Country of Residence',
    countryOfResidenceHelp: 'Country where you currently live',

    phoneCode: 'Code',
    phoneNumber: 'Phone Number',
    phoneNumberHelp: 'Your contact number',

    email: 'Email Address',
    emailHelp: 'Your email address',
  };

  // Default configuration
  const defaultConfig = {
    uppercaseCity: true,
    uppercaseOccupation: true,
  };

  // Merge defaults with provided values
  const l = { ...defaultLabels, ...labels };
  const c = { ...defaultConfig, ...config };

  // Support both residentCountry and countryOfResidence prop names
  const resolvedCountry = countryOfResidence ?? residentCountry ?? '';
  const updateCountry = (code) => {
    setResidentCountry?.(code);
    setCountryOfResidence?.(code);
  };
  const countryFieldName =
    config?.fields?.countryOfResidence?.fieldName ||
    config?.fields?.residentCountry?.fieldName ||
    'countryOfResidence';
  const countryLabel = l.countryOfResidence ?? l.residentCountry;
  const countryHelpText = l.countryOfResidenceHelp ?? l.residentCountryHelp;
  const countryError = errors?.countryOfResidence || errors?.residentCountry;

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
          <TamaguiText fontSize={24}>{l.introIcon}</TamaguiText>
          <TamaguiText fontSize="$2" color="#2C5AA0" flex={1} lineHeight={20}>
            {l.introText}
          </TamaguiText>
        </XStack>
      </BaseCard>

      {/* Occupation Selector */}
      <OccupationSelector
        label={l.occupation}
        value={occupation}
        onValueChange={(value) => {
          setOccupation(value);
          if (value !== 'OTHER') {
            setCustomOccupation('');
            handleFieldBlur && handleFieldBlur('occupation', value);
          }
          debouncedSaveData && debouncedSaveData();
        }}
        customValue={customOccupation}
        onCustomChange={(text) => {
          const processedText = c.uppercaseOccupation ? text.toUpperCase() : text;
          setCustomOccupation(processedText);
        }}
        onCustomBlur={() => {
          const finalOccupation = customOccupation.trim() ? customOccupation : occupation;
          handleFieldBlur && handleFieldBlur('occupation', finalOccupation);
          debouncedSaveData && debouncedSaveData();
        }}
        customLabel={l.occupationCustomLabel}
        customPlaceholder={l.occupationCustomPlaceholder}
        customHelpText={l.occupationCustomHelp}
        helpText={
          !errors.occupation && warnings.occupation
            ? warnings.occupation
            : l.occupationHelp
        }
        error={!!errors.occupation}
        errorMessage={errors.occupation}
      />

      {/* City of Residence */}
      <YStack marginBottom="$md">
        <BaseInput
          label={l.cityOfResidence}
          value={cityOfResidence}
          onChangeText={(text) => {
            const processedText = c.uppercaseCity ? text.toUpperCase() : text;
            setCityOfResidence(processedText);
          }}
          onBlur={() => handleFieldBlur && handleFieldBlur('cityOfResidence', cityOfResidence)}
          helperText={l.cityOfResidenceHelp}
          error={errors.cityOfResidence}
          autoCapitalize={c.uppercaseCity ? 'characters' : 'words'}
          placeholder={l.cityOfResidencePlaceholder}
        />
        {warnings.cityOfResidence && !errors.cityOfResidence && (
          <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
            ⚠️ {warnings.cityOfResidence}
          </TamaguiText>
        )}
      </YStack>

      {/* Country of Residence */}
      <NationalitySelector
        label={countryLabel}
        value={resolvedCountry}
        onValueChange={(code) => {
          updateCountry(code);
          setPhoneCode?.(getPhoneCode(code));
          handleFieldBlur?.(countryFieldName, code);
          debouncedSaveData && debouncedSaveData();
        }}
        helpText={countryHelpText}
        error={!!countryError}
        errorMessage={countryError}
      />

      {/* Phone Number (Code + Number) */}
      <XStack gap="$md" marginBottom="$md">
        <YStack width={140} maxWidth={180}>
          <BaseInput
            label={l.phoneCode}
            value={phoneCode}
            onChangeText={setPhoneCode}
            onBlur={() => handleFieldBlur && handleFieldBlur('phoneCode', phoneCode)}
            keyboardType="phone-pad"
            maxLength={5}
            error={errors.phoneCode}
            fullWidth={false}
          />
        </YStack>
        <YStack flex={1}>
          <BaseInput
            label={l.phoneNumber}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            onBlur={() => handleFieldBlur && handleFieldBlur('phoneNumber', phoneNumber)}
            keyboardType="phone-pad"
            helperText={l.phoneNumberHelp}
            error={errors.phoneNumber}
            fullWidth={false}
          />
        </YStack>
      </XStack>

      {/* Email Address */}
      <YStack marginBottom="$md">
        <BaseInput
          label={l.email}
          value={email}
          onChangeText={setEmail}
          onBlur={() => handleFieldBlur && handleFieldBlur('email', email)}
          keyboardType="email-address"
          helperText={l.emailHelp}
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
