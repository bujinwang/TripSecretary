/**
 * TravelDetailsSection Component
 *
 * Displays travel information section (flights, dates, accommodation)
 * for Thailand Travel Info Screen
 *
 * Note: This is a large component that could be further broken down into:
 * - FlightInfoSubSection
 * - AccommodationSubSection
 * - DateSelectionSubSection
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing } from '../../../theme';
import { NationalitySelector, DateTimeInput } from '../../../components';
import { ProvinceSelector, DistrictSelector, SubDistrictSelector } from '../../../components';
import { CollapsibleSection, InputWithValidation } from '../ThailandTravelComponents';
import Input from '../../../components/Input';

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
  // Styles from parent (optional)
  styles: parentStyles,
}) => {
  // Use parent styles if provided, otherwise use local styles
  const styles = parentStyles || localStyles;

  return (
    <CollapsibleSection
      title="✈️ 旅行计划"
      subtitle="告诉泰国你的旅行安排"
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      {/* Border Crossing Context for Travel Info */}
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionIntroIcon}>✈️</Text>
        <Text style={styles.sectionIntroText}>
          海关想知道你为什么来泰国、何时来、何时走、在哪里住。这有助于他们确认你是合法游客。
        </Text>
      </View>

      {/* Travel Purpose */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>为什么来泰国？</Text>
        <View style={styles.optionsContainer}>
          {[
            { value: 'HOLIDAY', label: '度假旅游', icon: '🏖️', tip: '最受欢迎的选择！' },
            { value: 'MEETING', label: '会议', icon: '👔', tip: '商务会议或活动' },
            { value: 'SPORTS', label: '体育活动', icon: '⚽', tip: '运动或比赛' },
            { value: 'BUSINESS', label: '商务', icon: '💼', tip: '商务考察或工作' },
            { value: 'INCENTIVE', label: '奖励旅游', icon: '🎁', tip: '公司奖励旅行' },
            { value: 'CONVENTION', label: '会展', icon: '🎪', tip: '参加会议或展览' },
            { value: 'EDUCATION', label: '教育', icon: '📚', tip: '学习或培训' },
            { value: 'EMPLOYMENT', label: '就业', icon: '💻', tip: '工作签证' },
            { value: 'EXHIBITION', label: '展览', icon: '🎨', tip: '参观展览或展会' },
            { value: 'MEDICAL', label: '医疗', icon: '🏥', tip: '医疗旅游或治疗' },
            { value: 'OTHER', label: '其他', icon: '✏️', tip: '请详细说明' },
          ].map((option) => {
            const isActive = travelPurpose === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  isActive && styles.optionButtonActive,
                ]}
                onPress={() => {
                  setTravelPurpose(option.value);
                  if (option.value !== 'OTHER') {
                    setCustomTravelPurpose('');
                  }
                  debouncedSaveData();
                }}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.optionText,
                    isActive && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {travelPurpose === 'OTHER' && (
          <Input
            label="请输入旅行目的"
            value={customTravelPurpose}
            onChangeText={setCustomTravelPurpose}
            onBlur={() => handleFieldBlur('customTravelPurpose', customTravelPurpose)}
            placeholder="请输入您的旅行目的"
            helpText="请用英文填写"
            autoCapitalize="words"
          />
        )}
      </View>

      <NationalitySelector
        label="过去14天停留国家或地区"
        value={recentStayCountry}
        onValueChange={(code) => {
          setRecentStayCountry(code);
          handleFieldBlur('recentStayCountry', code);
        }}
        placeholder="请选择最近停留的国家或地区"
        helpText="用于健康申报，通常为您最后停留的国家或地区"
      />

      {/* Arrival Flight Section */}
      <View style={styles.subSectionHeader}>
        <Text style={styles.subSectionTitle}>来程机票（入境泰国）</Text>
      </View>

      <NationalitySelector
        label="登机国家或地区"
        value={boardingCountry}
        onValueChange={(code) => {
          setBoardingCountry(code);
          handleFieldBlur('boardingCountry', code);
        }}
        placeholder="请选择登机国家或地区"
        helpText="请选择您登机的国家或地区"
        error={!!errors.boardingCountry}
        errorMessage={errors.boardingCountry}
      />

      <InputWithValidation
        label="航班号"
        value={arrivalFlightNumber}
        onChangeText={setArrivalFlightNumber}
        onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)}
        helpText="请输入您的抵达航班号"
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
        helpText="格式: YYYY-MM-DD"
        error={!!errors.arrivalArrivalDate}
        errorMessage={errors.arrivalArrivalDate}
      />

      {/* Flight Ticket Upload */}
      <View style={styles.documentUploadSection}>
        <Text style={styles.documentUploadLabel}>📷 机票照片（可选）</Text>
        <Text style={styles.documentUploadNote}>
          💡 提示：请上传英文版本的机票
        </Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleFlightTicketPhotoUpload}
        >
          <Text style={styles.uploadButtonText}>
            {flightTicketPhoto ? '✓ 已上传 - 点击更换' : '📤 上传机票照片'}
          </Text>
        </TouchableOpacity>
        {flightTicketPhoto && (
          <View style={styles.photoPreview}>
            <Image
              source={{ uri: flightTicketPhoto }}
              style={styles.photoPreviewImage}
              resizeMode="cover"
            />
          </View>
        )}
      </View>

      {/* Departure Flight Section */}
      <View style={styles.subSectionHeader}>
        <Text style={styles.subSectionTitle}>去程机票（离开泰国）</Text>
      </View>

      <Input
        label="航班号"
        value={departureFlightNumber}
        onChangeText={setDepartureFlightNumber}
        onBlur={() => handleFieldBlur('departureFlightNumber', departureFlightNumber)}
        helpText="请输入您的离开航班号"
        error={!!errors.departureFlightNumber}
        errorMessage={errors.departureFlightNumber}
        autoCapitalize="characters"
      />

      <DateTimeInput
        label="出发日期"
        value={departureDepartureDate}
        onChangeText={(newValue) => {
          setDepartureDepartureDate(newValue);
          setTimeout(() => {
            handleFieldBlur('departureDepartureDate', newValue);
          }, 0);
        }}
        mode="date"
        dateType="future"
        helpText="格式: YYYY-MM-DD"
        error={!!errors.departureDepartureDate}
        errorMessage={errors.departureDepartureDate}
      />

      {/* Accommodation Section */}
      <View style={styles.subSectionHeader}>
        <Text style={styles.subSectionTitle}>住宿信息</Text>
      </View>

      {/* Transit Passenger Checkbox */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={async () => {
          const newValue = !isTransitPassenger;
          setIsTransitPassenger(newValue);
          if (newValue) {
            setAccommodationType('HOTEL');
            setCustomAccommodationType('');
            setProvince('');
            setDistrict('');
            setDistrictId(null);
            setSubDistrict('');
            setSubDistrictId(null);
            setPostalCode('');
            setHotelAddress('');
          }

          try {
            const overrides = { isTransitPassenger: newValue };
            if (newValue) {
              overrides.accommodationType = 'HOTEL';
              overrides.customAccommodationType = '';
              overrides.province = '';
              overrides.district = '';
              overrides.subDistrict = '';
              overrides.postalCode = '';
              overrides.hotelAddress = '';
            }
            await saveDataToSecureStorageWithOverride(overrides);
            setLastEditedAt(new Date());
          } catch (error) {
            console.error('Failed to save transit passenger status:', error);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, isTransitPassenger && styles.checkboxChecked]}>
          {isTransitPassenger && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          我是过境旅客，不在泰国停留
        </Text>
      </TouchableOpacity>

      {!isTransitPassenger && (
        <>
          {/* Accommodation Type Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>住在哪里？</Text>
            <View style={styles.optionsContainer}>
              {[
                { value: 'HOTEL', label: '酒店', icon: '🏨', tip: '最常见的选择' },
                { value: 'YOUTH_HOSTEL', label: '青年旅舍', icon: '🏠', tip: '经济实惠，交朋友' },
                { value: 'GUEST_HOUSE', label: '民宿', icon: '🏡', tip: '体验当地生活' },
                { value: 'FRIEND_HOUSE', label: '朋友家', icon: '👥', tip: '住在朋友家' },
                { value: 'APARTMENT', label: '公寓', icon: '🏢', tip: '短期租住民宿' },
                { value: 'OTHER', label: '其他', icon: '✏️', tip: '请详细说明' },
              ].map((option) => {
                const isActive = accommodationType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      isActive && styles.optionButtonActive,
                    ]}
                    onPress={async () => {
                      setAccommodationType(option.value);
                      if (option.value !== 'OTHER') {
                        setCustomAccommodationType('');
                      }

                      try {
                        await saveDataToSecureStorageWithOverride({
                          accommodationType: option.value,
                          customAccommodationType: option.value !== 'OTHER' ? '' : customAccommodationType
                        });
                        setLastEditedAt(new Date());
                      } catch (error) {
                        console.error('Failed to save accommodation type:', error);
                      }
                    }}
                  >
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.optionText,
                        isActive && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {accommodationType === 'OTHER' && (
              <Input
                label="请输入住宿类型"
                value={customAccommodationType}
                onChangeText={setCustomAccommodationType}
                onBlur={() => handleFieldBlur('customAccommodationType', customAccommodationType)}
                placeholder="请输入您的住宿类型"
                helpText="请用英文填写"
                autoCapitalize="words"
              />
            )}
          </View>

          {/* Accommodation Details */}
          {accommodationType === 'HOTEL' ? (
            <>
              <ProvinceSelector
                label="省"
                value={province}
                onValueChange={handleProvinceSelect}
                helpText="请选择泰国的省份"
                error={!!errors.province}
                errorMessage={errors.province}
              />
              <Input
                label="地址"
                value={hotelAddress}
                onChangeText={setHotelAddress}
                onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)}
                multiline
                helpText="请输入详细地址"
                error={!!errors.hotelAddress}
                errorMessage={errors.hotelAddress}
                autoCapitalize="words"
              />

              {/* Hotel Reservation Upload */}
              <View style={styles.documentUploadSection}>
                <Text style={styles.documentUploadLabel}>📷 酒店预订照片（可选）</Text>
                <Text style={styles.documentUploadNote}>
                  💡 提示：请上传英文版本的酒店预订确认单
                </Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleHotelReservationPhotoUpload}
                >
                  <Text style={styles.uploadButtonText}>
                    {hotelReservationPhoto ? '✓ 已上传 - 点击更换' : '📤 上传预订照片'}
                  </Text>
                </TouchableOpacity>
                {hotelReservationPhoto && (
                  <View style={styles.photoPreview}>
                    <Image
                      source={{ uri: hotelReservationPhoto }}
                      style={styles.photoPreviewImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>
            </>
          ) : (
            <>
              <ProvinceSelector
                label="省"
                value={province}
                onValueChange={handleProvinceSelect}
                helpText="请选择泰国的省份"
                error={!!errors.province}
                errorMessage={errors.province}
              />
              <DistrictSelector
                label="区（地区）"
                provinceCode={province}
                value={district}
                selectedDistrictId={districtId}
                onSelect={handleDistrictSelect}
                helpText="请选择区或地区（支持中英文搜索）"
                error={!!errors.district}
                errorMessage={errors.district}
              />
              <SubDistrictSelector
                label="乡（子地区）"
                districtId={districtId}
                value={subDistrict}
                selectedSubDistrictId={subDistrictId}
                onSelect={handleSubDistrictSelect}
                helpText="请选择乡或子地区（支持中英文搜索）"
                error={!!errors.subDistrict}
                errorMessage={errors.subDistrict}
              />
              <Input
                label="邮政编码"
                value={postalCode}
                onChangeText={setPostalCode}
                onBlur={() => handleFieldBlur('postalCode', postalCode)}
                keyboardType="number-pad"
                maxLength={5}
                helpText="请输入5位邮政编码"
                error={!!errors.postalCode}
                errorMessage={errors.postalCode}
              />
              <Input
                label="地址"
                value={hotelAddress}
                onChangeText={setHotelAddress}
                onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)}
                multiline
                helpText="请输入详细地址"
                error={!!errors.hotelAddress}
                errorMessage={errors.hotelAddress}
                autoCapitalize="words"
              />
            </>
          )}
        </>
      )}
    </CollapsibleSection>
  );
};

// Local styles (fallback if parent styles not provided)
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  optionButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  optionText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  optionTextActive: {
    color: colors.white,
    fontWeight: '600',
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
  documentUploadSection: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  documentUploadLabel: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  documentUploadNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  uploadButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '600',
  },
  photoPreview: {
    marginTop: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  photoPreviewImage: {
    width: '100%',
    height: 200,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    ...typography.body2,
    color: colors.textPrimary,
    flex: 1,
  },
});

export default TravelDetailsSection;
