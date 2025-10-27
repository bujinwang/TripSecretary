/**
 * AccommodationSubSection Component
 *
 * Displays accommodation information including type and address
 * Part of TravelDetailsSection
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing } from '../../../../theme';
import { ProvinceSelector, DistrictSelector, SubDistrictSelector } from '../../../../components';
import { InputWithValidation } from '../../ThailandTravelComponents';
import Input from '../../../../components/Input';
import { PREDEFINED_ACCOMMODATION_TYPES } from '../../../../screens/thailand/constants';

const AccommodationSubSection = ({
  // Form state
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
  setIsTransitPassenger,
  setAccommodationType,
  setCustomAccommodationType,
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
  handleHotelReservationPhotoUpload,
  // Styles from parent
  styles,
}) => {
  const accommodationOptions = [
    { value: 'HOTEL', label: '酒店', icon: '🏨' },
    { value: 'HOSTEL', label: '青年旅舍', icon: '🏠' },
    { value: 'GUESTHOUSE', label: '民宿', icon: '🏡' },
    { value: 'RESORT', label: '度假村', icon: '🏖️' },
    { value: 'APARTMENT', label: '公寓', icon: '🏢' },
    { value: 'FRIEND', label: '朋友家', icon: '👥' },
    { value: 'OTHER', label: '其他', icon: '🏘️' },
  ];

  return (
    <>
      {/* Accommodation Section */}
      <View style={styles.subSectionHeader}>
        <Text style={styles.subSectionTitle}>住宿信息</Text>
      </View>

      {/* Transit Passenger Checkbox */}
      <TouchableOpacity
        style={styles.transitCheckboxContainer}
        onPress={async () => {
          const newValue = !isTransitPassenger;
          setIsTransitPassenger(newValue);
          if (newValue) {
            // Clear accommodation details for transit passengers
            setAccommodationType('HOTEL');
            setCustomAccommodationType('');
            const overrides = {
              isTransitPassenger: true,
              accommodationType: 'HOTEL',
              customAccommodationType: '',
              province: '',
              district: '',
              subDistrict: '',
              postalCode: '',
              hotelAddress: '',
            };
            handleProvinceSelect('');
            try {
              await saveDataToSecureStorageWithOverride(overrides);
              setLastEditedAt(new Date());
            } catch (error) {
              console.error('Failed to save transit passenger status:', error);
            }
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, isTransitPassenger && styles.checkboxChecked]}>
          {isTransitPassenger && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          我是转机乘客（不在泰国过夜）
        </Text>
      </TouchableOpacity>

      {!isTransitPassenger && (
        <>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>住宿类型</Text>
            <View style={styles.optionsContainer}>
              {accommodationOptions.map((option) => {
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
                placeholder="请详细说明住宿类型（英文）"
                value={customAccommodationType}
                onChangeText={(text) => setCustomAccommodationType(text.toUpperCase())}
                onBlur={() => handleFieldBlur('customAccommodationType', customAccommodationType)}
                autoCapitalize="characters"
                style={styles.input}
              />
            )}
          </View>

          <ProvinceSelector
            label="省份"
            value={province}
            onValueChange={handleProvinceSelect}
            helpText="选择酒店所在的省份"
            error={!!errors.province}
            errorMessage={errors.province}
          />

          {province && (
            <DistrictSelector
              label="区/县"
              provinceCode={province}
              value={district}
              onValueChange={handleDistrictSelect}
              helpText="选择酒店所在的区/县"
              error={!!errors.district}
              errorMessage={errors.district}
            />
          )}

          {district && districtId && (
            <SubDistrictSelector
              label="街道/分区"
              districtId={districtId}
              value={subDistrict}
              onValueChange={handleSubDistrictSelect}
              helpText="选择酒店所在的街道/分区"
              error={!!errors.subDistrict}
              errorMessage={errors.subDistrict}
            />
          )}

          <InputWithValidation
            label="邮政编码"
            value={postalCode}
            onChangeText={(text) => {
              // Auto-filled by SubDistrictSelector, but allow manual edit
              // Handled by parent through handleSubDistrictSelect
            }}
            helpText="选择街道后自动填充，或手动输入"
            error={!!errors.postalCode}
            errorMessage={errors.postalCode}
            fieldName="postalCode"
            lastEditedField={lastEditedField}
            keyboardType="numeric"
            editable={false}
            style={styles.disabledInput}
          />

          <InputWithValidation
            label="酒店地址"
            value={hotelAddress}
            onChangeText={(text) => setHotelAddress(text.toUpperCase())}
            onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)}
            helpText="例如：123 SUKHUMVIT ROAD"
            error={!!errors.hotelAddress}
            errorMessage={errors.hotelAddress}
            warning={!!warnings.hotelAddress}
            warningMessage={warnings.hotelAddress}
            fieldName="hotelAddress"
            lastEditedField={lastEditedField}
            autoCapitalize="characters"
            multiline
            numberOfLines={3}
          />

          <View style={styles.documentUploadSection}>
            <Text style={styles.fieldLabel}>酒店预订凭证（可选）</Text>
            <Text style={styles.helpText}>
              上传酒店预订凭证可以帮助海关快速确认你的住宿安排
            </Text>
            <TouchableOpacity
              style={styles.photoUploadButton}
              onPress={handleHotelReservationPhotoUpload}
            >
              <Text style={styles.photoUploadIcon}>📷</Text>
              <Text style={styles.photoUploadText}>
                {hotelReservationPhoto ? '更换预订凭证' : '上传预订凭证'}
              </Text>
            </TouchableOpacity>
            {hotelReservationPhoto && (
              <View style={styles.photoPreview}>
                <Image
                  source={{ uri: hotelReservationPhoto }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>
        </>
      )}
    </>
  );
};

const localStyles = StyleSheet.create({
  subSectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subSectionTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  transitCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  checkboxLabel: {
    ...typography.body2,
    color: colors.text,
    flex: 1,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
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
    borderColor: colors.border,
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: '#f8f9fa',
  },
  photoUploadIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  photoUploadText: {
    ...typography.body2,
    color: colors.primary,
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

export default AccommodationSubSection;
