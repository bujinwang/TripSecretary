import React from 'react';
import { View, Text, TouchableOpacity, Switch, type ViewStyle, type TextStyle } from 'react-native';
import Input from '../../Input';
import { NationalitySelector, DateTimeInput, SingaporeDistrictSelector } from '../..';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';
import {
  TRAVEL_PURPOSE_OPTIONS,
  ACCOMMODATION_TYPE_OPTIONS,
} from '../../../screens/singapore/constants';

type FieldCount = {
  filled: number;
  total: number;
};

type ValidationMap = Record<string, string | undefined>;

type HandleFieldChange = (
  field: string,
  value: string | boolean,
  setter?: (nextValue: any) => void,
) => void;

type HandleFieldBlur = (field: string, value: string | boolean | undefined) => void;

type HandleUserInteraction = (field: string, value: string | boolean) => void;

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

type DistrictSelection = {
  code: string;
  name: string;
  nameZh?: string;
};

export interface SingaporeTravelDetailsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  travelPurpose?: string;
  customTravelPurpose?: string;
  boardingCountry?: string;
  arrivalFlightNumber?: string;
  arrivalArrivalDate?: string;
  departureFlightNumber?: string;
  departureDepartureDate?: string;
  isTransitPassenger?: boolean;
  accommodationType?: string;
  customAccommodationType?: string;
  province?: string;
  district?: string;
  subDistrict?: string;
  postalCode?: string;
  hotelAddress?: string;
  setTravelPurpose: (value: string) => void;
  setCustomTravelPurpose: (value: string) => void;
  setBoardingCountry: (value: string) => void;
  setArrivalFlightNumber: (value: string) => void;
  setArrivalArrivalDate: (value: string) => void;
  setDepartureFlightNumber: (value: string) => void;
  setDepartureDepartureDate: (value: string) => void;
  setIsTransitPassenger: (value: boolean) => void;
  setAccommodationType: (value: string) => void;
  setCustomAccommodationType: (value: string) => void;
  setProvince: (value: string) => void;
  setDistrict: (value: string) => void;
  setSubDistrict: (value: string) => void;
  setPostalCode: (value: string) => void;
  setHotelAddress: (value: string) => void;
  errors: ValidationMap;
  warnings: ValidationMap;
  handleFieldChange: HandleFieldChange;
  handleFieldBlur: HandleFieldBlur;
  handleUserInteraction: HandleUserInteraction;
  t: TranslationFn;
  styles: Record<string, ViewStyle | TextStyle>;
}

const TravelDetailsSection: React.FC<SingaporeTravelDetailsSectionProps> = ({
  isExpanded,
  onToggle,
  fieldCount,
  travelPurpose,
  customTravelPurpose,
  boardingCountry,
  arrivalFlightNumber,
  arrivalArrivalDate,
  departureFlightNumber,
  departureDepartureDate,
  isTransitPassenger = false,
  accommodationType,
  customAccommodationType,
  province,
  district,
  subDistrict,
  postalCode,
  hotelAddress,
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
  errors,
  warnings,
  handleFieldChange,
  handleFieldBlur,
  handleUserInteraction,
  t,
  styles,
}) => {
  return (
    <CollapsibleSection
      title={t('singapore.travelInfo.sections.travel', { defaultValue: '🛫 行程信息' })}
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
          {t('singapore.travelInfo.travelPurpose', { defaultValue: '访问目的' })}
        </Text>
        <View style={styles.optionButtonsContainer as ViewStyle}>
          {TRAVEL_PURPOSE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton as ViewStyle,
                travelPurpose === option.value && (styles.optionButtonActive as ViewStyle),
              ]}
              onPress={() => {
                handleFieldChange('travelPurpose', option.value, setTravelPurpose);
                handleUserInteraction('travelPurpose', option.value);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.optionIcon as TextStyle}>{option.icon}</Text>
              <Text
                style={[
                  styles.optionButtonText as TextStyle,
                  travelPurpose === option.value && (styles.optionButtonTextActive as TextStyle),
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {travelPurpose === 'OTHER' ? (
          <View style={styles.customInputContainer as ViewStyle}>
            <Input
              value={customTravelPurpose ?? ''}
              onChangeText={(value) => handleFieldChange('customTravelPurpose', value, setCustomTravelPurpose)}
              onBlur={() => handleFieldBlur('customTravelPurpose', customTravelPurpose)}
              placeholder={t('singapore.travelInfo.customTravelPurposePlaceholder', {
                defaultValue: '请说明访问目的',
              })}
              error={!!errors.customTravelPurpose}
              errorMessage={errors.customTravelPurpose}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
          {t('singapore.travelInfo.boardingCountry', { defaultValue: '登机国家/地区' })}
        </Text>
        <NationalitySelector
          value={boardingCountry ?? ''}
          onValueChange={(value: string) => {
            handleFieldChange('boardingCountry', value, setBoardingCountry);
            handleUserInteraction('boardingCountry', value);
          }}
          onBlur={() => handleFieldBlur('boardingCountry', boardingCountry)}
          error={!!errors.boardingCountry}
          errorMessage={errors.boardingCountry}
        />
      </View>

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
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

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
          {t('singapore.travelInfo.arrivalDate', { defaultValue: '入境日期' })}
        </Text>
        <DateTimeInput
          value={arrivalArrivalDate ?? ''}
          onChangeText={(value: string) => handleFieldChange('arrivalArrivalDate', value, setArrivalArrivalDate)}
          onBlur={(value: string) => handleFieldBlur('arrivalArrivalDate', value)}
          mode="date"
          placeholder="YYYY-MM-DD"
          error={!!errors.arrivalArrivalDate}
          errorMessage={errors.arrivalArrivalDate}
        />
      </View>

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
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

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
          {t('singapore.travelInfo.departureDate', { defaultValue: '离境日期' })}
        </Text>
        <DateTimeInput
          value={departureDepartureDate ?? ''}
          onChangeText={(value: string) => handleFieldChange('departureDepartureDate', value, setDepartureDepartureDate)}
          onBlur={(value: string) => handleFieldBlur('departureDepartureDate', value)}
          mode="date"
          placeholder="YYYY-MM-DD"
          error={!!errors.departureDepartureDate}
          errorMessage={errors.departureDepartureDate}
        />
      </View>

      <View style={styles.fieldContainer as ViewStyle}>
        <View style={styles.toggleContainer as ViewStyle}>
          <Text style={styles.fieldLabel as TextStyle}>
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
        <Text style={styles.helperText as TextStyle}>
          {t('singapore.travelInfo.transitHelper', {
            defaultValue: '如果您不离开机场过境区，请开启此选项',
          })}
        </Text>
      </View>

      {!isTransitPassenger ? (
        <>
          <View style={styles.fieldContainer as ViewStyle}>
            <Text style={styles.fieldLabel as TextStyle}>
              {t('singapore.travelInfo.accommodationType', { defaultValue: '住宿类型' })}
            </Text>
            <View style={styles.optionButtonsContainer as ViewStyle}>
              {ACCOMMODATION_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton as ViewStyle,
                    accommodationType === option.value && (styles.optionButtonActive as ViewStyle),
                  ]}
                  onPress={() => {
                    handleFieldChange('accommodationType', option.value, setAccommodationType);
                    handleUserInteraction('accommodationType', option.value);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionIcon as TextStyle}>{option.icon}</Text>
                  <Text
                    style={[
                      styles.optionButtonText as TextStyle,
                      accommodationType === option.value && (styles.optionButtonTextActive as TextStyle),
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {accommodationType === 'OTHER' ? (
              <View style={styles.customInputContainer as ViewStyle}>
                <Input
                  value={customAccommodationType ?? ''}
                  onChangeText={(value) => handleFieldChange('customAccommodationType', value, setCustomAccommodationType)}
                  onBlur={() => handleFieldBlur('customAccommodationType', customAccommodationType)}
                  placeholder={t('singapore.travelInfo.customAccommodationPlaceholder', {
                    defaultValue: '请说明住宿类型',
                  })}
                  error={!!errors.customAccommodationType}
                  errorMessage={errors.customAccommodationType}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.fieldContainer as ViewStyle}>
            <Text style={styles.fieldLabel as TextStyle}>
              {t('singapore.travelInfo.location', { defaultValue: '新加坡地区' })}
            </Text>
            <SingaporeDistrictSelector
              value={province || district || ''}
              onSelect={(selection?: DistrictSelection) => {
                if (!selection) {
                  return;
                }
                handleFieldChange('province', selection.name, setProvince);
                handleFieldChange('district', selection.name, setDistrict);
                handleUserInteraction('district', selection.name);
              }}
              error={!!errors.district}
              errorMessage={errors.district}
            />
          </View>

          <View style={styles.fieldContainer as ViewStyle}>
            <Text style={styles.fieldLabel as TextStyle}>
              {t('singapore.travelInfo.address', { defaultValue: '详细地址' })}
            </Text>
            <Input
              value={hotelAddress ?? ''}
              onChangeText={(value) => handleFieldChange('hotelAddress', value, setHotelAddress)}
              onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)}
              placeholder={t('singapore.travelInfo.addressPlaceholder', {
                defaultValue: '请输入详细地址',
              })}
              multiline
              numberOfLines={3}
              error={!!errors.hotelAddress}
              errorMessage={errors.hotelAddress}
            />
            {warnings.hotelAddress && !errors.hotelAddress ? (
              <Text style={styles.warningText as TextStyle}>{warnings.hotelAddress}</Text>
            ) : null}
          </View>

          <View style={styles.fieldContainer as ViewStyle}>
            <Text style={styles.fieldLabel as TextStyle}>
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
      ) : null}
    </CollapsibleSection>
  );
};

export default TravelDetailsSection;
