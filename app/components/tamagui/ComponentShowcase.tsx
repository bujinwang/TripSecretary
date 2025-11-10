/**
 * ComponentShowcase - Comprehensive showcase of all Tamagui components
 *
 * This screen demonstrates all the shared Tamagui components with various
 * configurations and states. Useful for testing and documentation.
 */

import React, { useState } from 'react';
import { Alert } from 'react-native';
import { ScrollView, YStack, Heading, Text } from 'tamagui';
import { BaseCard } from './BaseCard';
import { BaseButton } from './BaseButton';
import { BaseInput } from './BaseInput';
import { CollapsibleSection } from './CollapsibleSection';
import { ProgressOverviewCard } from './ProgressOverviewCard';

export const ComponentShowcase: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [loadingButton, setLoadingButton] = useState(false);

  const handleLoadingDemo = () => {
    setLoadingButton(true);
    setTimeout(() => setLoadingButton(false), 2000);
  };

  return (
    <ScrollView backgroundColor="$background">
      <YStack padding="$md" gap="$lg" paddingBottom="$xxl">
        {/* Header */}
        <YStack gap="$sm">
          <Heading size="$5" color="$text">
            Component Library
          </Heading>
          <Text fontSize="$2" color="$textSecondary">
            Shared Tamagui components for all country screens
          </Text>
        </YStack>

        {/* BaseCard Section */}
        <YStack gap="$md">
          <Heading size="$4" color="$text">
            BaseCard
          </Heading>

          <BaseCard variant="elevated" padding="md">
            <Text fontSize="$2" fontWeight="600">
              Elevated Card
            </Text>
            <Text fontSize="$1" color="$textSecondary" marginTop="$xs">
              Card with shadow elevation (default)
            </Text>
          </BaseCard>

          <BaseCard variant="bordered" padding="md">
            <Text fontSize="$2" fontWeight="600">
              Bordered Card
            </Text>
            <Text fontSize="$1" color="$textSecondary" marginTop="$xs">
              Card with border, no elevation
            </Text>
          </BaseCard>

          <BaseCard variant="flat" padding="md">
            <Text fontSize="$2" fontWeight="600">
              Flat Card
            </Text>
            <Text fontSize="$1" color="$textSecondary" marginTop="$xs">
              Simple card without border or elevation
            </Text>
          </BaseCard>

          <BaseCard
            variant="elevated"
            padding="md"
            pressable
            onPress={() => Alert.alert('Card pressed!')}
          >
            <Text fontSize="$2" fontWeight="600">
              Pressable Card
            </Text>
            <Text fontSize="$1" color="$textSecondary" marginTop="$xs">
              Tap me! This card responds to press events
            </Text>
          </BaseCard>
        </YStack>

        {/* BaseButton Section */}
        <YStack gap="$md">
          <Heading size="$4" color="$text">
            BaseButton
          </Heading>

          <YStack gap="$sm">
            <BaseButton variant="primary" fullWidth>
              Primary Button
            </BaseButton>

            <BaseButton variant="secondary" fullWidth>
              Secondary Button
            </BaseButton>

            <BaseButton variant="outlined" fullWidth>
              Outlined Button
            </BaseButton>

            <BaseButton variant="ghost" fullWidth>
              Ghost Button
            </BaseButton>

            <BaseButton variant="danger" fullWidth>
              Danger Button
            </BaseButton>

            <BaseButton variant="primary" disabled fullWidth>
              Disabled Button
            </BaseButton>

            <BaseButton
              variant="primary"
              loading={loadingButton}
              onPress={handleLoadingDemo}
              fullWidth
            >
              Loading Button (Click me)
            </BaseButton>
          </YStack>

          <Text fontSize="$2" fontWeight="600" marginTop="$sm">
            Button Sizes
          </Text>
          <YStack gap="$sm">
            <BaseButton variant="primary" size="sm" fullWidth>
              Small Button
            </BaseButton>
            <BaseButton variant="primary" size="md" fullWidth>
              Medium Button (default)
            </BaseButton>
            <BaseButton variant="primary" size="lg" fullWidth>
              Large Button
            </BaseButton>
          </YStack>
        </YStack>

        {/* BaseInput Section */}
        <YStack gap="$md">
          <Heading size="$4" color="$text">
            BaseInput
          </Heading>

          <BaseInput
            label="Basic Input"
            placeholder="Enter text..."
            value={inputValue}
            onChangeText={setInputValue}
            helperText="This is a helper text"
          />

          <BaseInput
            label="Required Field"
            placeholder="This field is required"
            required
          />

          <BaseInput
            label="Email Address"
            placeholder="email@example.com"
            value={emailValue}
            onChangeText={setEmailValue}
            error={
              emailValue && !emailValue.includes('@')
                ? 'Please enter a valid email'
                : undefined
            }
          />

          <BaseInput
            label="Success State"
            placeholder="Valid input"
            value="john@example.com"
            success="Email is valid!"
          />

          <BaseInput
            label="With Character Count"
            placeholder="Max 50 characters"
            maxLength={50}
            showCount
          />

          <BaseInput label="Disabled Input" placeholder="Disabled" disabled />

          <BaseInput
            label="Small Input"
            placeholder="Small size"
            size="sm"
          />

          <BaseInput
            label="Large Input"
            placeholder="Large size"
            size="lg"
          />
        </YStack>

        {/* CollapsibleSection Section */}
        <YStack gap="$md">
          <Heading size="$4" color="$text">
            CollapsibleSection
          </Heading>

          <CollapsibleSection
            title="Personal Information"
            subtitle="Update your personal details"
            icon="👤"
            badge="7/10"
            badgeVariant="warning"
            defaultExpanded={true}
          >
            <YStack gap="$sm">
              <Text fontSize="$2">Name: John Doe</Text>
              <Text fontSize="$2">Date of Birth: 1990-05-15</Text>
              <Text fontSize="$2">Nationality: USA</Text>
            </YStack>
          </CollapsibleSection>

          <CollapsibleSection
            title="Passport Details"
            subtitle="View passport information"
            icon="📘"
            badge="4/4"
            badgeVariant="success"
          >
            <YStack gap="$sm">
              <Text fontSize="$2">Passport No: AB1234567</Text>
              <Text fontSize="$2">Expiry: 2030-12-31</Text>
            </YStack>
          </CollapsibleSection>

          <CollapsibleSection
            title="Travel Information"
            subtitle="Flight and accommodation details"
            icon="✈️"
            badge="0/5"
            badgeVariant="danger"
            collapsedContent={
              <Text fontSize="$1" color="$textSecondary">
                Tap to add travel information
              </Text>
            }
          >
            <YStack gap="$sm">
              <Text fontSize="$2">Arrival Date: 2024-06-15</Text>
              <Text fontSize="$2">Hotel: Grand Hotel</Text>
            </YStack>
          </CollapsibleSection>

          <CollapsibleSection
            title="Minimal Variant"
            subtitle="No card styling"
            variant="minimal"
          >
            <Text fontSize="$2">This section has minimal styling</Text>
          </CollapsibleSection>
        </YStack>

        {/* ProgressOverviewCard Section */}
        <YStack gap="$md">
          <Heading size="$4" color="$text">
            ProgressOverviewCard
          </Heading>

          <ProgressOverviewCard
            completedFields={7}
            totalFields={10}
            sections={[
              { name: 'Passport', icon: '📘', completed: true, completedFields: 4, fieldCount: 4 },
              { name: 'Personal Info', icon: '👤', completed: false, completedFields: 3, fieldCount: 6 },
              { name: 'Travel Details', icon: '✈️', completed: false, completedFields: 0, fieldCount: 5 },
            ]}
          />

          <ProgressOverviewCard
            completedFields={15}
            totalFields={15}
            title="All Complete!"
            completionMessage="Great! You've filled in all required information."
          />

          <ProgressOverviewCard
            completedFields={2}
            totalFields={20}
            title="Just Started"
            showPercentage={true}
          />
        </YStack>

        {/* Combined Example */}
        <YStack gap="$md">
          <Heading size="$4" color="$text">
            Combined Example
          </Heading>

          <CollapsibleSection
            title="Form Example"
            subtitle="A complete form using all components"
            icon="📝"
            defaultExpanded={true}
          >
            <YStack gap="$md">
              <BaseInput
                label="Full Name"
                placeholder="Enter your full name"
                required
              />

              <BaseInput
                label="Email"
                placeholder="email@example.com"
                required
              />

              <BaseInput
                label="Phone Number"
                placeholder="+1 (555) 000-0000"
              />

              <BaseButton variant="primary" fullWidth>
                Submit Form
              </BaseButton>
            </YStack>
          </CollapsibleSection>
        </YStack>
      </YStack>
    </ScrollView>
  );
};

export default ComponentShowcase;
