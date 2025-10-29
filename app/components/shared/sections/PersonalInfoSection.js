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

const PersonalInfoSection = ({
  // Section control
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

  // Setters
  setOccupation,
  setCustomOccupation,
  setCityOfResidence,
  setResidentCountry,
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
        label={l.residentCountry}
        value={residentCountry}
        onValueChange={(code) => {
          setResidentCountry(code);
          setPhoneCode(getPhoneCode(code));
          debouncedSaveData && debouncedSaveData();
        }}
        helpText={l.residentCountryHelp}
        error={!!errors.residentCountry}
        errorMessage={errors.residentCountry}
      />

      {/* Phone Number (Code + Number) */}
      <XStack gap="$md" marginBottom="$md">
        <YStack flex={0.3}>
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
        <YStack flex={0.7}>
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
