/**
 * TravelDetailsSection Component
 *
 * Handles travel details input for Singapore Travel Info Screen
 */

import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import Input from '../../Input';
import { NationalitySelector, DateTimeInput, SingaporeDistrictSelector } from '../..';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';
import {
  TRAVEL_PURPOSE_OPTIONS,
  ACCOMMODATION_TYPE_OPTIONS,
} from '../../../screens/singapore/constants';

interface FieldCount {
  filled: number;
  total: number;
}

type FieldChangeHandler = <T>(
  field: string,
  value: T,
  setter?: ((value: T) => void) | undefined
) => void;
type FieldBlurHandler = (field: string, value: unknown) => void;
type InteractionHandler = (field: string, value: unknown) => void;
type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

interface TravelDetailsSectionStyles {
  fieldContainer: StyleProp<ViewStyle>;
  fieldLabel: StyleProp<TextStyle>;
  optionButtonsContainer: StyleProp<ViewStyle>;
  optionButton: StyleProp<ViewStyle>;
  optionButtonActive: StyleProp<ViewStyle>;
  optionButtonText: StyleProp<TextStyle>;
  optionButtonTextActive: StyleProp<TextStyle>;
  optionIcon: StyleProp<TextStyle>;
  customInputContainer: StyleProp<ViewStyle>;
  toggleContainer: StyleProp<ViewStyle>;
  helperText: StyleProp<TextStyle>;
  warningText: StyleProp<TextStyle>;
}

interface TravelDetailsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount: FieldCount;
  travelPurpose?: string;
  customTravelPurpose?: string;
  boardingCountry?: string;
  arrivalFlightNumber?: string;
  arrivalArrivalDate?: string;
  departureFlightNumber?: string;
  departureDepartureDate?: string;
  isTransitPassenger: boolean;
  accommodationType?: string;
  customAccommodationType?: string;
  province?: string;
  district?: string;
  subDistrict?: string;
  postalCode?: string;
  hotelAddress?: string;
  setTravelPurpose?: (value: string) => void;
  setCustomTravelPurpose?: (value: string) => void;
  setBoardingCountry?: (value: string) => void;
  setArrivalFlightNumber?: (value: string) => void;
  setArrivalArrivalDate?: (value: string) => void;
  setDepartureFlightNumber?: (value: string) => void;
  setDepartureDepartureDate?: (value: string) => void;
  setIsTransitPassenger?: (value: boolean) => void;
  setAccommodationType?: (value: string) => void;
  setCustomAccommodationType?: (value: string) => void;
  setProvince?: (value: string) => void;
  setDistrict?: (value: string) => void;
  setSubDistrict?: (value: string) => void;
  setPostalCode?: (value: string) => void;
  setHotelAddress?: (value: string) => void;
  errors?: Record<string, string | undefined>;
  warnings?: Record<string, string | undefined>;
  handleFieldChange: FieldChangeHandler;
  handleFieldBlur: FieldBlurHandler;
  handleUserInteraction: InteractionHandler;
  t: TranslationFn;
  styles: TravelDetailsSectionStyles;
}

const TravelDetailsSection = ({
  // Section state
  isExpanded,
  onToggle,
  fieldCount,

  // Form state
  travelPurpose,
  customTravelPurpose,
  boardingCountry,
  arrivalFlightNumber,
  arrivalArrivalDate,
  departureFlightNumber,
  departureDepartureDate,
  isTransitPassenger,
  accommodationType,
  customAccommodationType,
  province,
  district,
  subDistrict,
  postalCode,
  hotelAddress,

  // Setters
  setTravelPurpose,
  setCustomTravelPurpose,
  setBoardingCountry,
  setArrivalFlightNumber,
  setArrivalArrivalDate,
  setDepartureFlightNumber,
  setDepartureDepartureDate,
  setIsTransitPassenger,
  setAccommodationType,
  setCustomAccommodationType,
  setProvince,
  setDistrict,
  setSubDistrict,
  setPostalCode,
  setHotelAddress,

  // Validation
  errors = {},
  warnings = {},
  handleFieldChange,
  handleFieldBlur,
  handleUserInteraction,

  // i18n
  t,

  // Styles
  styles,
}: TravelDetailsSectionProps) => {
  return (
    <CollapsibleSection
      title={t('singapore.travelInfo.sections.travel', { defaultValue: '🛫 行程信息' })}
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      {/* Travel Purpose */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {t('singapore.travelInfo.travelPurpose', { defaultValue: '访问目的' })}
        </Text>
        <View style={styles.optionButtonsContainer}>
          {TRAVEL_PURPOSE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                travelPurpose === option.value && styles.optionButtonActive,
              ]}
              onPress={() => {
                handleFieldChange('travelPurpose', option.value, setTravelPurpose);
                handleUserInteraction('travelPurpose', option.value);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <Text
                style={[
                  styles.optionButtonText,
                  travelPurpose === option.value && styles.optionButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {travelPurpose === 'OTHER' && (
          <View style={styles.customInputContainer}>
            <Input
              value={customTravelPurpose ?? ''}
              onChangeText={(value) => handleFieldChange('customTravelPurpose', value, setCustomTravelPurpose)}
              onBlur={() => handleFieldBlur('customTravelPurpose', customTravelPurpose)}
              placeholder={t('singapore.travelInfo.customTravelPurposePlaceholder', {
                defaultValue: '请说明访问目的'
              })}
              error={!!errors.customTravelPurpose}
              errorMessage={errors.customTravelPurpose}
            />
          </View>
        )}
      </View>

      {/* Boarding Country */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {t('singapore.travelInfo.boardingCountry', { defaultValue: '登机国家/地区' })}
        </Text>
        <NationalitySelector
          value={boardingCountry ?? ''}
          onChange={(value) => {
            handleFieldChange('boardingCountry', value, setBoardingCountry);
            handleUserInteraction('boardingCountry', value);
          }}
          onBlur={() => handleFieldBlur('boardingCountry', boardingCountry)}
          error={!!errors.boardingCountry}
          errorMessage={errors.boardingCountry}
        />
      </View>

      {/* Arrival Flight */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {t('singapore.travelInfo.arrivalFlight', { defaultValue: '入境航班号' })}
        </Text>
        <Input
          value={arrivalFlightNumber ?? ''}
          onChangeText={(value) => handleFieldChange('arrivalFlightNumber', value, setArrivalFlightNumber)}
          onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)}
          placeholder="SQ123"
          autoCapitalize="characters"
          error={!!errors.arrivalFlightNumber}
          errorMessage={errors.arrivalFlightNumber}
        />
      </View>

      {/* Arrival Date */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {t('singapore.travelInfo.arrivalDate', { defaultValue: '入境日期' })}
        </Text>
        <DateTimeInput
          value={arrivalArrivalDate ?? ''}
          onChange={(value) => handleFieldChange('arrivalArrivalDate', value, setArrivalArrivalDate)}
          onBlur={() => handleFieldBlur('arrivalArrivalDate', arrivalArrivalDate)}
          mode="date"
          placeholder="YYYY-MM-DD"
          error={!!errors.arrivalArrivalDate}
          errorMessage={errors.arrivalArrivalDate}
        />
      </View>

      {/* Departure Flight */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {t('singapore.travelInfo.departureFlight', { defaultValue: '离境航班号' })}
        </Text>
        <Input
          value={departureFlightNumber ?? ''}
          onChangeText={(value) => handleFieldChange('departureFlightNumber', value, setDepartureFlightNumber)}
          onBlur={() => handleFieldBlur('departureFlightNumber', departureFlightNumber)}
          placeholder="SQ456"
          autoCapitalize="characters"
          error={!!errors.departureFlightNumber}
          errorMessage={errors.departureFlightNumber}
        />
      </View>

      {/* Departure Date */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {t('singapore.travelInfo.departureDate', { defaultValue: '离境日期' })}
        </Text>
        <DateTimeInput
          value={departureDepartureDate ?? ''}
          onChange={(value) => handleFieldChange('departureDepartureDate', value, setDepartureDepartureDate)}
          onBlur={() => handleFieldBlur('departureDepartureDate', departureDepartureDate)}
          mode="date"
          placeholder="YYYY-MM-DD"
          error={!!errors.departureDepartureDate}
          errorMessage={errors.departureDepartureDate}
        />
      </View>

      {/* Transit Passenger Toggle */}
      <View style={styles.fieldContainer}>
        <View style={styles.toggleContainer}>
          <Text style={styles.fieldLabel}>
            {t('singapore.travelInfo.isTransitPassenger', { defaultValue: '过境旅客' })}
          </Text>
          <Switch
            value={isTransitPassenger}
            onValueChange={(value) => {
              handleFieldChange('isTransitPassenger', value, setIsTransitPassenger);
              handleUserInteraction('isTransitPassenger', value);
            }}
            trackColor={{ false: '#767577', true: '#34C759' }}
            thumbColor={isTransitPassenger ? '#fff' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.helperText}>
          {t('singapore.travelInfo.transitHelper', {
            defaultValue: '如果您不离开机场过境区，请开启此选项'
          })}
        </Text>
      </View>

      {/* Accommodation (Only if not transit) */}
      {!isTransitPassenger && (
        <>
          {/* Accommodation Type */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {t('singapore.travelInfo.accommodationType', { defaultValue: '住宿类型' })}
            </Text>
            <View style={styles.optionButtonsContainer}>
              {ACCOMMODATION_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    accommodationType === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => {
                    handleFieldChange('accommodationType', option.value, setAccommodationType);
                    handleUserInteraction('accommodationType', option.value);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <Text
                    style={[
                      styles.optionButtonText,
                      accommodationType === option.value && styles.optionButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {accommodationType === 'OTHER' && (
              <View style={styles.customInputContainer}>
                <Input
                  value={customAccommodationType ?? ''}
                  onChangeText={(value) => handleFieldChange('customAccommodationType', value, setCustomAccommodationType)}
                  onBlur={() => handleFieldBlur('customAccommodationType', customAccommodationType)}
                  placeholder={t('singapore.travelInfo.customAccommodationPlaceholder', {
                    defaultValue: '请说明住宿类型'
                  })}
                  error={!!errors.customAccommodationType}
                  errorMessage={errors.customAccommodationType}
                />
              </View>
            )}
          </View>

          {/* Singapore District Selector */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {t('singapore.travelInfo.location', { defaultValue: '新加坡地区' })}
            </Text>
            <SingaporeDistrictSelector
              value={province ?? district ?? ''}
              onSelect={(selection) => {
                if (!selection) {
                  return;
                }
                const resolvedName = selection.name ?? '';
                handleFieldChange('province', resolvedName, setProvince);
                handleFieldChange('district', resolvedName, setDistrict);
                handleUserInteraction('district', resolvedName);
              }}
              error={!!errors.district}
              errorMessage={errors.district}
            />
          </View>

          {/* Hotel Address */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {t('singapore.travelInfo.address', { defaultValue: '详细地址' })}
            </Text>
            <Input
              value={hotelAddress ?? ''}
              onChangeText={(value) => handleFieldChange('hotelAddress', value, setHotelAddress)}
              onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)}
              placeholder={t('singapore.travelInfo.addressPlaceholder', {
                defaultValue: '请输入详细地址'
              })}
              multiline
              numberOfLines={3}
              error={!!errors.hotelAddress}
              errorMessage={errors.hotelAddress}
            />
            {warnings.hotelAddress && !errors.hotelAddress && (
              <Text style={styles.warningText}>{warnings.hotelAddress}</Text>
            )}
          </View>

          {/* Postal Code */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {t('singapore.travelInfo.postalCode', { defaultValue: '邮政编码' })}
            </Text>
            <Input
              value={postalCode ?? ''}
              onChangeText={(value) => handleFieldChange('postalCode', value, setPostalCode)}
              onBlur={() => handleFieldBlur('postalCode', postalCode)}
              placeholder="123456"
              keyboardType="numeric"
              maxLength={6}
              error={!!errors.postalCode}
              errorMessage={errors.postalCode}
            />
          </View>
        </>
      )}
    </CollapsibleSection>
  );
};

export default TravelDetailsSection;
