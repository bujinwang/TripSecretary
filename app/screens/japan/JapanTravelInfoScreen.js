import React from 'react';
import { TravelInfoScreenTemplate } from '../../templates';
import { japanTravelInfoConfig } from '../../config/destinations/japan/travelInfoConfig';
import { Text as TamaguiText } from '../../components/tamagui';

// Import field components (shared across countries)
import {
  PassportNameInput,
  DateTimeInput,
  NationalitySelector,
  GenderSelector,
  TravelPurposeSelector,
} from '../../components';
import Input from '../../components/Input';
import { YStack } from '../../components/tamagui';

const JapanTravelInfoScreen = ({ navigation, route }) => {
  return (
    <TravelInfoScreenTemplate
      config={japanTravelInfoConfig}
      route={route}
      navigation={navigation}
    >
      {/* Header with back button + title */}
      <TravelInfoScreenTemplate.Header />

      {/* Loading indicator */}
      <TravelInfoScreenTemplate.LoadingIndicator />

      {/* Scrollable content */}
      <TravelInfoScreenTemplate.ScrollContainer>
        {/* Hero section with flag */}
        <TravelInfoScreenTemplate.HeroSection
          subtitle={<TamaguiText>Complete your entry information</TamaguiText>}
        />

        {/* Save status indicator */}
        <TravelInfoScreenTemplate.StatusIndicator />

        {/* Privacy notice */}
        <TravelInfoScreenTemplate.PrivacyNotice />

        {/* ========================================
            PASSPORT SECTION
            ======================================== */}
        <TravelInfoScreenTemplate.Section
          name="passport"
          icon="📘"
          fieldCount={{ completed: 7, total: 7 }}
        >
          <YStack gap="$md">
            <PassportNameInput
              label="Surname"
              value=""
              onChangeText={() => {}}
              placeholder="e.g., TANAKA"
            />
            <PassportNameInput
              label="Given Name"
              value=""
              onChangeText={() => {}}
              placeholder="e.g., YUKI"
            />
            <Input
              label="Passport Number"
              value=""
              onChangeText={() => {}}
              placeholder="e.g., M12345678"
            />
            <NationalitySelector
              label="Nationality"
              value=""
              onValueChange={() => {}}
            />
            <DateTimeInput
              label="Date of Birth"
              value={null}
              onChange={() => {}}
              mode="date"
            />
            <DateTimeInput
              label="Expiry Date"
              value={null}
              onChange={() => {}}
              mode="date"
            />
            <GenderSelector
              label="Gender"
              value=""
              onValueChange={() => {}}
            />
          </YStack>
        </TravelInfoScreenTemplate.Section>

        {/* ========================================
            PERSONAL INFORMATION SECTION
            ======================================== */}
        <TravelInfoScreenTemplate.Section
          name="personal"
          icon="👤"
          fieldCount={{ completed: 4, total: 6 }}
        >
          <YStack gap="$md">
            <Input
              label="Occupation"
              value=""
              onChangeText={() => {}}
              placeholder="e.g., Software Engineer"
            />
            <Input
              label="City of Residence"
              value=""
              onChangeText={() => {}}
              placeholder="e.g., TOKYO"
            />
            <Input
              label="Phone Number"
              value=""
              onChangeText={() => {}}
              placeholder="+81 90 1234 5678"
              keyboardType="phone-pad"
            />
            <Input
              label="Email"
              value=""
              onChangeText={() => {}}
              placeholder="example@email.com"
              keyboardType="email-address"
            />
          </YStack>
        </TravelInfoScreenTemplate.Section>

        {/* ========================================
            FUNDS SECTION
            ======================================== */}
        <TravelInfoScreenTemplate.Section
          name="funds"
          icon="💰"
          fieldCount={{ completed: 1, total: 1 }}
        >
          <YStack gap="$md">
            <Input
              label="Available Funds (JPY)"
              value=""
              onChangeText={() => {}}
              placeholder="e.g., 100000"
              keyboardType="numeric"
            />
          </YStack>
        </TravelInfoScreenTemplate.Section>

        {/* ========================================
            TRAVEL DETAILS SECTION
            ======================================== */}
        <TravelInfoScreenTemplate.Section
          name="travel"
          icon="✈️"
          fieldCount={{ completed: 6, total: 9 }}
        >
          <YStack gap="$md">
            <TravelPurposeSelector
              label="Travel Purpose"
              value=""
              onValueChange={() => {}}
            />
            <Input
              label="Arrival Flight Number"
              value=""
              onChangeText={() => {}}
              placeholder="e.g., JL123"
            />
            <DateTimeInput
              label="Arrival Date"
              value={null}
              onChange={() => {}}
              mode="date"
            />
            <Input
              label="Accommodation Type"
              value=""
              onChangeText={() => {}}
              placeholder="e.g., Hotel"
            />
            <Input
              label="Prefecture"
              value=""
              onChangeText={() => {}}
              placeholder="e.g., Tokyo"
            />
            <Input
              label="City"
              value=""
              onChangeText={() => {}}
              placeholder="e.g., Shinjuku"
            />
            <Input
              label="Hotel Address"
              value=""
              onChangeText={() => {}}
              placeholder="Full address"
              multiline
            />
          </YStack>
        </TravelInfoScreenTemplate.Section>

        {/* Submit button with smart state */}
        <TravelInfoScreenTemplate.SubmitButton
          label={<TamaguiText>Continue to Entry Flow</TamaguiText>}
          icon="✈️"
        />
      </TravelInfoScreenTemplate.ScrollContainer>
    </TravelInfoScreenTemplate>
  );
};

export default JapanTravelInfoScreen;
