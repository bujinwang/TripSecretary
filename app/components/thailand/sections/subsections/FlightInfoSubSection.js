/**
 * FlightInfoSubSection Component
 *
 * Displays arrival and departure flight information
 * Part of TravelDetailsSection
 */

import React from 'react';
import { Image } from 'react-native';
import {
  YStack,
  XStack,
  BaseCard,
  BaseInput,
  BaseButton,
  Text as TamaguiText,
} from '../../../tamagui';
import { DateTimeInput } from '@app/components';

const FlightInfoSubSection = ({
  // Form state
  arrivalFlightNumber,
  arrivalArrivalDate,
  flightTicketPhoto,
  departureFlightNumber,
  departureDepartureDate,
  departureFlightTicketPhoto,
  // Setters
  setArrivalFlightNumber,
  setArrivalArrivalDate,
  setDepartureFlightNumber,
  setDepartureDepartureDate,
  // Validation
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField,
  // Actions
  handleFlightTicketPhotoUpload,
  handleDepartureFlightTicketPhotoUpload,
}) => {
  return (
    <>
      {/* Arrival Flight Section */}
      <YStack
        marginTop="$lg"
        marginBottom="$md"
        paddingBottom="$sm"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <TamaguiText fontSize="$2" fontWeight="600" color="$text">
          来程机票（入境泰国）
        </TamaguiText>
      </YStack>

      <YStack marginBottom="$md">
        <BaseInput
          label="航班号（来程）"
          value={arrivalFlightNumber}
          onChangeText={(text) => setArrivalFlightNumber(text.toUpperCase())}
          onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)}
          helperText="例如：MU5067"
          error={errors.arrivalFlightNumber}
          autoCapitalize="characters"
          placeholder="MU5067"
        />
        {warnings.arrivalFlightNumber && !errors.arrivalFlightNumber && (
          <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
            ⚠️ {warnings.arrivalFlightNumber}
          </TamaguiText>
        )}
      </YStack>

      <DateTimeInput
        label="抵达日期"
        value={arrivalArrivalDate}
        onChangeText={(newValue) => {
          setArrivalArrivalDate(newValue);
          handleFieldBlur('arrivalArrivalDate', newValue);
        }}
        mode="date"
        dateType="future"
        helpText="选择到达泰国的日期"
        error={!!errors.arrivalArrivalDate}
        errorMessage={errors.arrivalArrivalDate}
      />

      {/* Photo Upload Card */}
      <BaseCard
        variant="elevated"
        padding="md"
        marginTop="$md"
        marginBottom="$lg"
      >
        <YStack gap="$sm">
          <TamaguiText fontSize="$2" fontWeight="600" color="$text">
            📸 机票照片（可选）
          </TamaguiText>

          <BaseCard variant="flat" padding="sm" backgroundColor="#FEF3C7">
            <XStack gap="$xs" alignItems="flex-start">
              <TamaguiText fontSize={16}>💡</TamaguiText>
              <TamaguiText fontSize="$1" color="#92400E" flex={1} lineHeight={18}>
                上传机票照片可以帮助海关快速确认你的行程
              </TamaguiText>
            </XStack>
          </BaseCard>

          {!flightTicketPhoto ? (
            <BaseCard
              variant="flat"
              padding="lg"
              pressable
              onPress={handleFlightTicketPhotoUpload}
              borderWidth={2}
              borderColor="$primary"
              borderStyle="dashed"
              backgroundColor="#F0F7FF"
            >
              <YStack alignItems="center" gap="$sm">
                <YStack
                  width={64}
                  height={64}
                  borderRadius={32}
                  backgroundColor="$primary"
                  justifyContent="center"
                  alignItems="center"
                >
                  <TamaguiText fontSize={32}>📷</TamaguiText>
                </YStack>
                <TamaguiText fontSize="$2" fontWeight="600" color="$primary">
                  点击上传机票照片
                </TamaguiText>
                <TamaguiText fontSize="$1" color="$textSecondary">
                  支持 JPG, PNG 格式
                </TamaguiText>
              </YStack>
            </BaseCard>
          ) : (
            <YStack>
              <Image
                source={{ uri: flightTicketPhoto }}
                style={{ width: '100%', height: 200, borderRadius: 8 }}
                resizeMode="cover"
              />
              <BaseButton
                variant="primary"
                size="md"
                onPress={handleFlightTicketPhotoUpload}
                marginTop="$sm"
                icon={<TamaguiText fontSize={16}>🔄</TamaguiText>}
              >
                更换照片
              </BaseButton>
            </YStack>
          )}
        </YStack>
      </BaseCard>

      {/* Departure Flight Section */}
      <YStack
        marginTop="$lg"
        marginBottom="$md"
        paddingBottom="$sm"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <TamaguiText fontSize="$2" fontWeight="600" color="$text">
          去程机票（离开泰国）
        </TamaguiText>
      </YStack>

      <YStack marginBottom="$md">
        <BaseInput
          label="航班号（去程）"
          value={departureFlightNumber}
          onChangeText={(text) => setDepartureFlightNumber(text.toUpperCase())}
          onBlur={() => handleFieldBlur('departureFlightNumber', departureFlightNumber)}
          helperText="例如：MU5068"
          error={errors.departureFlightNumber}
          autoCapitalize="characters"
          placeholder="MU5068"
        />
        {warnings.departureFlightNumber && !errors.departureFlightNumber && (
          <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
            ⚠️ {warnings.departureFlightNumber}
          </TamaguiText>
        )}
      </YStack>

      <DateTimeInput
        label="离开日期"
        value={departureDepartureDate}
        onChangeText={(newValue) => {
          setDepartureDepartureDate(newValue);
          setTimeout(() => {
            handleFieldBlur('departureDepartureDate', newValue);
          }, 100);
        }}
        mode="date"
        dateType="future"
        helpText="选择离开泰国的日期"
        error={!!errors.departureDepartureDate}
        errorMessage={errors.departureDepartureDate}
      />

      {/* Departure Flight Photo Upload Card */}
      <BaseCard
        variant="elevated"
        padding="md"
        marginTop="$md"
        marginBottom="$lg"
      >
        <YStack gap="$sm">
          <TamaguiText fontSize="$2" fontWeight="600" color="$text">
            📸 离境机票照片（可选）
          </TamaguiText>

          <BaseCard variant="flat" padding="sm" backgroundColor="#FEF3C7">
            <XStack gap="$xs" alignItems="flex-start">
              <TamaguiText fontSize={16}>💡</TamaguiText>
              <TamaguiText fontSize="$1" color="#92400E" flex={1} lineHeight={18}>
                上传离境机票照片可以帮助海关确认你的返程计划
              </TamaguiText>
            </XStack>
          </BaseCard>

          {!departureFlightTicketPhoto ? (
            <BaseCard
              variant="flat"
              padding="lg"
              pressable
              onPress={handleDepartureFlightTicketPhotoUpload}
              borderWidth={2}
              borderColor="$primary"
              borderStyle="dashed"
              backgroundColor="#F0F7FF"
            >
              <YStack alignItems="center" gap="$sm">
                <YStack
                  width={64}
                  height={64}
                  borderRadius={32}
                  backgroundColor="$primary"
                  justifyContent="center"
                  alignItems="center"
                >
                  <TamaguiText fontSize={32}>📷</TamaguiText>
                </YStack>
                <TamaguiText fontSize="$2" fontWeight="600" color="$primary">
                  点击上传离境机票照片
                </TamaguiText>
                <TamaguiText fontSize="$1" color="$textSecondary">
                  支持 JPG, PNG 格式
                </TamaguiText>
              </YStack>
            </BaseCard>
          ) : (
            <YStack>
              <Image
                source={{ uri: departureFlightTicketPhoto }}
                style={{ width: '100%', height: 200, borderRadius: 8 }}
                resizeMode="cover"
              />
              <BaseButton
                variant="primary"
                size="md"
                onPress={handleDepartureFlightTicketPhotoUpload}
                marginTop="$sm"
                icon={<TamaguiText fontSize={16}>🔄</TamaguiText>}
              >
                更换照片
              </BaseButton>
            </YStack>
          )}
        </YStack>
      </BaseCard>
    </>
  );
};

export default FlightInfoSubSection;
