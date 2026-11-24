/**
 * TravelDetailsSection Component
 *
 * Displays travel information section (flights, dates, accommodation)
 * for Hong Kong Travel Info Screen
 *
 * Note: Simplified version without subsections for initial implementation
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing } from '../../../theme';
import { CollapsibleSection, InputWithValidation } from '../../thailand/ThailandTravelComponents';
import { NationalitySelector, DateTimeInput } from '../../../components';
import HongKongDistrictSelector from '../../../components/HongKongDistrictSelector';
import OptionSelector from '../../thailand/OptionSelector';
import { PREDEFINED_TRAVEL_PURPOSES, PREDEFINED_ACCOMMODATION_TYPES } from '../../../screens/hongkong/constants';

type FieldCount = {
  filled: number;
  total: number;
};

type ValidationMap = Record<string, string | undefined>;

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

type HongKongTravelDetailsSectionProps = {
  t: TranslationFn;
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  travelPurpose: string;
  customTravelPurpose: string;
  recentStayCountry?: string;
  boardingCountry?: string;
  arrivalFlightNumber: string;
  arrivalArrivalDate: string;
  flightTicketPhoto?: string | null;
  departureFlightNumber: string;
  departureDepartureDate: string;
  isTransitPassenger: boolean;
  accommodationType: string;
  customAccommodationType: string;
  province?: string;
  district?: string;
  districtId?: string;
  subDistrict?: string;
  subDistrictId?: string;
  postalCode?: string;
  hotelAddress: string;
  hotelReservationPhoto?: string | null;
  setTravelPurpose: (value: string) => void;
  setCustomTravelPurpose: (value: string) => void;
  setRecentStayCountry: (value: string) => void;
  setBoardingCountry: (value: string) => void;
  setArrivalFlightNumber: (value: string) => void;
  setArrivalArrivalDate: (value: string) => void;
  setDepartureFlightNumber: (value: string) => void;
  setDepartureDepartureDate: (value: string) => void;
  setIsTransitPassenger: (value: boolean) => void;
  setAccommodationType: (value: string) => void;
  setCustomAccommodationType: (value: string) => void;
  setPostalCode: (value: string) => void;
  setHotelAddress: (value: string) => void;
  errors: ValidationMap;
  warnings: ValidationMap;
  handleFieldBlur: (field: string, value: string | boolean | null | undefined) => void;
  lastEditedField?: string | null;
  debouncedSaveData?: () => void;
  saveDataToSecureStorageWithOverride?: (data: Record<string, unknown>) => Promise<void>;
  setLastEditedAt?: (date: Date) => void;
  handleProvinceSelect?: (province: string) => void;
  handleDistrictSelect?: (selection: unknown) => void;
  handleSubDistrictSelect?: (selection: unknown) => void;
  handleFlightTicketPhotoUpload?: () => void;
  handleHotelReservationPhotoUpload?: () => void;
  handleUserInteraction?: (field: string, value: string) => void;
  styles?: typeof localStyles;
};

const TravelDetailsSection: React.FC<HongKongTravelDetailsSectionProps> = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  travelPurpose,
  customTravelPurpose,
  recentStayCountry,
  boardingCountry,
  arrivalFlightNumber,
  arrivalArrivalDate,
  flightTicketPhoto,
  departureFlightNumber,
  departureDepartureDate,
  isTransitPassenger,
  accommodationType,
  customAccommodationType,
  province,
  district,
  districtId,
  subDistrict,
  subDistrictId,
  postalCode,
  hotelAddress,
  hotelReservationPhoto,
  setTravelPurpose,
  setCustomTravelPurpose,
  setRecentStayCountry,
  setBoardingCountry,
  setArrivalFlightNumber,
  setArrivalArrivalDate,
  setDepartureFlightNumber,
  setDepartureDepartureDate,
  setIsTransitPassenger,
  setAccommodationType,
  setCustomAccommodationType,
  setPostalCode,
  setHotelAddress,
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField,
  debouncedSaveData,
  saveDataToSecureStorageWithOverride,
  setLastEditedAt,
  handleProvinceSelect,
  handleDistrictSelect,
  handleSubDistrictSelect,
  handleFlightTicketPhotoUpload,
  handleHotelReservationPhotoUpload,
  handleUserInteraction,
  styles: parentStyles,
}) => {
  const styles = parentStyles || localStyles;

  const purposeOptions = PREDEFINED_TRAVEL_PURPOSES.map((value) => ({
    value,
    label: value === 'OTHER' ? '其他' : value,
  }));

  const accommodationOptions = PREDEFINED_ACCOMMODATION_TYPES.map((value) => ({
    value,
    label: value === 'OTHER' ? '其他' : value,
  }));

  return (
    <CollapsibleSection
      title="✈️ 旅行计划"
      subtitle="告诉香港你的旅行安排"
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      {/* Border Crossing Context for Travel Info */}
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionIntroIcon}>✈️</Text>
        <Text style={styles.sectionIntroText}>
          海关想知道你为什么来香港、何时来、何时走、在哪里住。这有助于他们确认你是合法游客。
        </Text>
      </View>

      {/* Travel Purpose */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>旅行目的</Text>
        <OptionSelector
          options={purposeOptions}
          value={travelPurpose}
          onSelect={(value: string) => {
            if (handleUserInteraction) {
              handleUserInteraction('travelPurpose', value);
            } else {
              setTravelPurpose(value);
              if (value !== 'OTHER') {
                setCustomTravelPurpose('');
              }
              debouncedSaveData?.();
            }
          }}
          customValue={customTravelPurpose}
          onCustomChange={(text: string) => setCustomTravelPurpose(text.toUpperCase())}
          onCustomBlur={() => {
            const finalPurpose = customTravelPurpose.trim() ? customTravelPurpose : travelPurpose;
            handleFieldBlur('travelPurpose', finalPurpose);
            debouncedSaveData?.();
          }}
          customLabel="请输入旅行目的"
          customPlaceholder="例如：BUSINESS MEETING, CONFERENCE 等"
          customHelpText="请用英文填写您的旅行目的"
        />
      </View>

      <NationalitySelector
        label={t('hongkong.travelInfo.fields.recentStayCountry', { defaultValue: '最近停留的国家' })}
        value={recentStayCountry}
        onValueChange={(code: string) => {
          setRecentStayCountry(code);
          handleFieldBlur('recentStayCountry', code);
        }}
        helpText={t('hongkong.travelInfo.fieldHelp.recentStayCountry', { defaultValue: '请选择您最近停留的国家' })}
        optional
      />

      <NationalitySelector
        label={t('hongkong.travelInfo.fields.boardingCountry', { defaultValue: '登机国家或地区' })}
        value={boardingCountry}
        onValueChange={(code: string) => {
          if (handleUserInteraction) {
            handleUserInteraction('boardingCountry', code);
          } else {
            setBoardingCountry(code);
            debouncedSaveData?.();
          }
        }}
        helpText={t('hongkong.travelInfo.fieldHelp.boardingCountry', { defaultValue: '请选择您登机的国家或地区' })}
      />

      {/* Flight Info */}
      <View style={styles.subSectionHeader}>
        <Text style={styles.subSectionTitle}>航班信息</Text>
      </View>

      <InputWithValidation
        label="抵达航班号"
        value={arrivalFlightNumber}
        onChangeText={(text: string) => setArrivalFlightNumber(text.toUpperCase())}
        onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)}
        helpText="请填写航班号，例如 CX123"
        error={!!errors.arrivalFlightNumber}
        errorMessage={errors.arrivalFlightNumber}
        warning={!!warnings.arrivalFlightNumber}
        warningMessage={warnings.arrivalFlightNumber}
        fieldName="arrivalFlightNumber"
        lastEditedField={lastEditedField ?? undefined}
        autoCapitalize="characters"
      />

      <DateTimeInput
        label="抵达日期"
        value={arrivalArrivalDate}
        onChangeText={(newValue: string) => {
          setArrivalArrivalDate(newValue);
          handleFieldBlur('arrivalArrivalDate', newValue);
        }}
        mode="date"
        dateType="future"
        helpText="选择抵达日期"
        error={!!errors.arrivalArrivalDate}
        errorMessage={errors.arrivalArrivalDate}
      />

      {handleFlightTicketPhotoUpload ? (
        <View style={styles.documentUploadSection}>
          <Text style={styles.helpText}>机票照片（可选）</Text>
          <TouchableOpacity style={styles.photoUploadButton} onPress={handleFlightTicketPhotoUpload}>
            <Text style={styles.photoUploadIcon}>📷</Text>
            <Text style={styles.photoUploadText}>
              {flightTicketPhoto ? '更换机票照片' : '上传机票照片'}
            </Text>
          </TouchableOpacity>
          {flightTicketPhoto ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: flightTicketPhoto }} style={styles.photoImage} />
            </View>
          ) : null}
        </View>
      ) : null}

      <InputWithValidation
        label="离境航班号"
        value={departureFlightNumber}
        onChangeText={(text: string) => setDepartureFlightNumber(text.toUpperCase())}
        onBlur={() => handleFieldBlur('departureFlightNumber', departureFlightNumber)}
        helpText="请填写航班号，例如 CX456"
        error={!!errors.departureFlightNumber}
        errorMessage={errors.departureFlightNumber}
        warning={!!warnings.departureFlightNumber}
        warningMessage={warnings.departureFlightNumber}
        fieldName="departureFlightNumber"
        lastEditedField={lastEditedField ?? undefined}
        autoCapitalize="characters"
      />

      <DateTimeInput
        label="离境日期"
        value={departureDepartureDate}
        onChangeText={(newValue: string) => {
          setDepartureDepartureDate(newValue);
          handleFieldBlur('departureDepartureDate', newValue);
        }}
        mode="date"
        dateType="future"
        helpText="选择离境日期"
        error={!!errors.departureDepartureDate}
        errorMessage={errors.departureDepartureDate}
      />

      {/* Accommodation */}
      <View style={styles.subSectionHeader}>
        <Text style={styles.subSectionTitle}>住宿信息</Text>
      </View>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={async () => {
          const newValue = !isTransitPassenger;
          setIsTransitPassenger(newValue);
          try {
            if (saveDataToSecureStorageWithOverride && setLastEditedAt) {
              await saveDataToSecureStorageWithOverride({ isTransitPassenger: newValue });
              setLastEditedAt(new Date());
            } else {
              debouncedSaveData?.();
            }
          } catch (error) {
            console.error('Failed to save transit status:', error);
          }
        }}
      >
        <View style={[styles.checkbox, isTransitPassenger && styles.checkboxChecked]}>
          {isTransitPassenger ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <Text style={styles.checkboxLabel}>我是过境旅客（不需要住宿）</Text>
      </TouchableOpacity>

      {!isTransitPassenger ? (
        <>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>住宿类型</Text>
            <OptionSelector
              options={accommodationOptions}
              value={accommodationType}
              onSelect={(value: string) => {
                if (handleUserInteraction) {
                  handleUserInteraction('accommodationType', value);
                } else {
                  setAccommodationType(value);
                  if (value !== 'OTHER') {
                    setCustomAccommodationType('');
                  }
                  debouncedSaveData?.();
                }
              }}
              customValue={customAccommodationType}
              onCustomChange={(text: string) => setCustomAccommodationType(text.toUpperCase())}
              onCustomBlur={() => {
                const finalType = customAccommodationType.trim() ? customAccommodationType : accommodationType;
                handleFieldBlur('accommodationType', finalType);
                debouncedSaveData?.();
              }}
              customLabel="请输入住宿类型"
              customPlaceholder="例如：HOSTEL, SERVICED APARTMENT 等"
              customHelpText="请用英文填写您的住宿类型"
            />
          </View>

          <HongKongDistrictSelector
            label="区域"
            province={province}
            district={district}
            districtId={districtId}
            subDistrict={subDistrict}
            subDistrictId={subDistrictId}
            postalCode={postalCode}
            onProvinceSelect={handleProvinceSelect}
            onDistrictSelect={handleDistrictSelect}
            onSubDistrictSelect={handleSubDistrictSelect}
            onPostalCodeChange={setPostalCode}
            error={!!errors.district}
            errorMessage={errors.district}
          />

          <InputWithValidation
            label="酒店地址"
            value={hotelAddress}
            onChangeText={setHotelAddress}
            onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)}
            helpText="请填写酒店或住宿地址"
            error={!!errors.hotelAddress}
            errorMessage={errors.hotelAddress}
            warning={!!warnings.hotelAddress}
            warningMessage={warnings.hotelAddress}
            fieldName="hotelAddress"
            lastEditedField={lastEditedField ?? undefined}
            multiline
            numberOfLines={3}
          />

          {handleHotelReservationPhotoUpload ? (
            <View style={styles.documentUploadSection}>
              <Text style={styles.helpText}>酒店预订单照片（可选）</Text>
              <TouchableOpacity style={styles.photoUploadButton} onPress={handleHotelReservationPhotoUpload}>
                <Text style={styles.photoUploadIcon}>📷</Text>
                <Text style={styles.photoUploadText}>
                  {hotelReservationPhoto ? '更换酒店预订单照片' : '上传酒店预订单照片'}
                </Text>
              </TouchableOpacity>
              {hotelReservationPhoto ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: hotelReservationPhoto }} style={styles.photoImage} />
                </View>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
    </CollapsibleSection>
  );
};

const localStyles = StyleSheet.create({
  sectionIntro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  sectionIntroIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  sectionIntroText: {
    ...typography.body2,
    color: '#2C5AA0',
    flex: 1,
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  subSectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  subSectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    ...typography.body1,
    color: colors.textPrimary,
    flex: 1,
  },
  documentUploadSection: {
    marginBottom: spacing.md,
  },
  helpText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  photoUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: '#F8F9FA',
  },
  photoUploadIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  photoUploadText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  photoPreview: {
    marginTop: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 200,
  },
});

export default TravelDetailsSection;
