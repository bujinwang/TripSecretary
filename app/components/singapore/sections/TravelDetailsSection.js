/**
 * TravelDetailsSection Component
 *
 * Handles travel details input for Singapore Travel Info Screen
 */

import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import Input from '../../Input';
import { NationalitySelector, DateTimeInput, SingaporeDistrictSelector } from '../..';
import { useLocale } from '../../../i18n/LocaleContext';
import {
  TRAVEL_PURPOSE_OPTIONS,
  ACCOMMODATION_TYPE_OPTIONS,
} from '../../../screens/singapore/constants';

const TravelDetailsSection = ({
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
  errors,
  warnings,
  handleFieldBlur,
  handleUserInteraction,

  // Styles
  styles,
}) => {
  const { t } = useLocale();

  return (
    <View>
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
                setTravelPurpose(option.value);
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
              value={customTravelPurpose}
              onChangeText={setCustomTravelPurpose}
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
          value={boardingCountry}
          onChange={(value) => {
            setBoardingCountry(value);
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
          value={arrivalFlightNumber}
          onChangeText={setArrivalFlightNumber}
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
          value={arrivalArrivalDate}
          onChange={setArrivalArrivalDate}
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
          value={departureFlightNumber}
          onChangeText={setDepartureFlightNumber}
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
          value={departureDepartureDate}
          onChange={setDepartureDepartureDate}
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
              setIsTransitPassenger(value);
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
                    setAccommodationType(option.value);
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
                  value={customAccommodationType}
                  onChangeText={setCustomAccommodationType}
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
              selectedProvince={province}
              selectedDistrict={district}
              onProvinceSelect={setProvince}
              onDistrictSelect={setDistrict}
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
              value={hotelAddress}
              onChangeText={setHotelAddress}
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
              value={postalCode}
              onChangeText={setPostalCode}
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
    </View>
  );
};

export default TravelDetailsSection;
