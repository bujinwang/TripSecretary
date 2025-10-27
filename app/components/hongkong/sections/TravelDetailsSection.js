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
import { NationalitySelector, DateTimeInput, ProvinceSelector, DistrictSelector, SubDistrictSelector } from '../../../components';
import HongKongDistrictSelector from '../../../components/HongKongDistrictSelector';
import OptionSelector from '../../thailand/OptionSelector';
import { PREDEFINED_TRAVEL_PURPOSES, PREDEFINED_ACCOMMODATION_TYPES } from '../../../screens/hongkong/constants';

const TravelDetailsSection = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  // Form state - Travel purpose
  travelPurpose,
  customTravelPurpose,
  recentStayCountry,
  boardingCountry,
  // Form state - Arrival
  arrivalFlightNumber,
  arrivalArrivalDate,
  flightTicketPhoto,
  // Form state - Departure
  departureFlightNumber,
  departureDepartureDate,
  // Form state - Accommodation
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
  // Setters
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
  setProvince,
  setDistrict,
  setDistrictId,
  setSubDistrict,
  setSubDistrictId,
  setPostalCode,
  setHotelAddress,
  // Validation
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField,
  // Actions
  debouncedSaveData,
  saveDataToSecureStorageWithOverride,
  setLastEditedAt,
  handleProvinceSelect,
  handleDistrictSelect,
  handleSubDistrictSelect,
  handleFlightTicketPhotoUpload,
  handleHotelReservationPhotoUpload,
  // User interaction
  handleUserInteraction,
  // Styles from parent (optional)
  styles: parentStyles,
}) => {
  // Use parent styles if provided, otherwise use local styles
  const styles = parentStyles || localStyles;

  const purposeOptions = PREDEFINED_TRAVEL_PURPOSES.map(value => ({
    value,
    label: value === 'OTHER' ? '其他' : value
  }));

  const accommodationOptions = PREDEFINED_ACCOMMODATION_TYPES.map(value => ({
    value,
    label: value === 'OTHER' ? '其他' : value
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
          onSelect={(value) => {
            if (handleUserInteraction) {
              handleUserInteraction('travelPurpose', value);
            } else {
              setTravelPurpose(value);
              if (value !== 'OTHER') {
                setCustomTravelPurpose('');
              }
              debouncedSaveData();
            }
          }}
          customValue={customTravelPurpose}
          onCustomChange={(text) => setCustomTravelPurpose(text.toUpperCase())}
          onCustomBlur={() => {
            const finalPurpose = customTravelPurpose.trim() ? customTravelPurpose : travelPurpose;
            handleFieldBlur('travelPurpose', finalPurpose);
            debouncedSaveData();
          }}
          customLabel="请输入旅行目的"
          customPlaceholder="例如：BUSINESS MEETING, CONFERENCE 等"
          customHelpText="请用英文填写您的旅行目的"
        />
      </View>

      <NationalitySelector
        label="最近停留的国家"
        value={recentStayCountry}
        onValueChange={(code) => {
          setRecentStayCountry(code);
          handleFieldBlur('recentStayCountry', code);
        }}
        helpText="请选择您最近停留的国家"
        optional={true}
      />

      <NationalitySelector
        label="登机国家或地区"
        value={boardingCountry}
        onValueChange={(code) => {
          if (handleUserInteraction) {
            handleUserInteraction('boardingCountry', code);
          } else {
            setBoardingCountry(code);
            debouncedSaveData();
          }
        }}
        helpText="请选择您登机的国家或地区"
      />

      {/* Flight Info */}
      <View style={styles.subSectionHeader}>
        <Text style={styles.subSectionTitle}>航班信息</Text>
      </View>

      <InputWithValidation
        label="抵达航班号"
        value={arrivalFlightNumber}
        onChangeText={(text) => setArrivalFlightNumber(text.toUpperCase())}
        onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)}
        helpText="请填写航班号，例如 CX123"
        error={!!errors.arrivalFlightNumber}
        errorMessage={errors.arrivalFlightNumber}
        warning={!!warnings.arrivalFlightNumber}
        warningMessage={warnings.arrivalFlightNumber}
        fieldName="arrivalFlightNumber"
        lastEditedField={lastEditedField}
        autoCapitalize="characters"
      />

      <DateTimeInput
        label="抵达日期"
        value={arrivalArrivalDate}
        onChangeText={(newValue) => {
          setArrivalArrivalDate(newValue);
          handleFieldBlur('arrivalArrivalDate', newValue);
        }}
        mode="date"
        dateType="future"
        helpText="选择抵达日期"
        error={!!errors.arrivalArrivalDate}
        errorMessage={errors.arrivalArrivalDate}
      />

      {handleFlightTicketPhotoUpload && (
        <View style={styles.documentUploadSection}>
          <Text style={styles.helpText}>机票照片（可选）</Text>
          <TouchableOpacity
            style={styles.photoUploadButton}
            onPress={handleFlightTicketPhotoUpload}
          >
            <Text style={styles.photoUploadIcon}>📷</Text>
            <Text style={styles.photoUploadText}>
              {flightTicketPhoto ? '更换机票照片' : '上传机票照片'}
            </Text>
          </TouchableOpacity>
          {flightTicketPhoto && (
            <View style={styles.photoPreview}>
              <Image source={{ uri: flightTicketPhoto }} style={styles.photoImage} />
            </View>
          )}
        </View>
      )}

      <InputWithValidation
        label="离境航班号"
        value={departureFlightNumber}
        onChangeText={(text) => setDepartureFlightNumber(text.toUpperCase())}
        onBlur={() => handleFieldBlur('departureFlightNumber', departureFlightNumber)}
        helpText="请填写航班号，例如 CX456"
        error={!!errors.departureFlightNumber}
        errorMessage={errors.departureFlightNumber}
        warning={!!warnings.departureFlightNumber}
        warningMessage={warnings.departureFlightNumber}
        fieldName="departureFlightNumber"
        lastEditedField={lastEditedField}
        autoCapitalize="characters"
      />

      <DateTimeInput
        label="离境日期"
        value={departureDepartureDate}
        onChangeText={(newValue) => {
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

      {/* Transit Passenger Checkbox */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={async () => {
          const newValue = !isTransitPassenger;
          setIsTransitPassenger(newValue);
          try {
            await saveDataToSecureStorageWithOverride({ isTransitPassenger: newValue });
            setLastEditedAt(new Date());
          } catch (error) {
            console.error('Failed to save transit status:', error);
          }
        }}
      >
        <View style={[styles.checkbox, isTransitPassenger && styles.checkboxChecked]}>
          {isTransitPassenger && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>我是过境旅客（不需要住宿）</Text>
      </TouchableOpacity>

      {!isTransitPassenger && (
        <>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>住宿类型</Text>
            <OptionSelector
              options={accommodationOptions}
              value={accommodationType}
              onSelect={(value) => {
                if (handleUserInteraction) {
                  handleUserInteraction('accommodationType', value);
                } else {
                  setAccommodationType(value);
                  if (value !== 'OTHER') {
                    setCustomAccommodationType('');
                  }
                  debouncedSaveData();
                }
              }}
              customValue={customAccommodationType}
              onCustomChange={(text) => setCustomAccommodationType(text.toUpperCase())}
              onCustomBlur={() => {
                const finalType = customAccommodationType.trim() ? customAccommodationType : accommodationType;
                handleFieldBlur('accommodationType', finalType);
                debouncedSaveData();
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
            lastEditedField={lastEditedField}
            multiline
            numberOfLines={3}
          />

          {handleHotelReservationPhotoUpload && (
            <View style={styles.documentUploadSection}>
              <Text style={styles.helpText}>酒店预订单照片（可选）</Text>
              <TouchableOpacity
                style={styles.photoUploadButton}
                onPress={handleHotelReservationPhotoUpload}
              >
                <Text style={styles.photoUploadIcon}>📷</Text>
                <Text style={styles.photoUploadText}>
                  {hotelReservationPhoto ? '更换酒店预订单照片' : '上传酒店预订单照片'}
                </Text>
              </TouchableOpacity>
              {hotelReservationPhoto && (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: hotelReservationPhoto }} style={styles.photoImage} />
                </View>
              )}
            </View>
          )}
        </>
      )}
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
