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
  setDistrict,
  setDistrictId,
  setSubDistrict,
  setSubDistrictId,
  setPostalCode,
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
  styles: parentStyles,
}) => {
  // Use parent styles if provided, otherwise use local styles
  const styles = parentStyles || localStyles;
  const accommodationOptions = [
    { value: 'HOTEL', label: '酒店', icon: '🏨' },
    { value: 'HOSTEL', label: '青年旅舍', icon: '🏠' },
    { value: 'GUESTHOUSE', label: '民宿', icon: '🏡' },
    { value: 'RESORT', label: '度假村', icon: '🏖️' },
    { value: 'APARTMENT', label: '公寓', icon: '🏢' },
    { value: 'FRIEND', label: '朋友家', icon: '👥' },
    { value: 'OTHER', label: '其他', icon: '🏘️' },
  ];

  // Only Hotel accommodation requires province and address (not detailed location)
  const needsDetailedLocation = accommodationType !== 'HOTEL';

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

                      // Clear district/subdistrict/postal code when switching to Hotel
                      // since these fields are not needed for hotels
                      const dataToSave = {
                        accommodationType: option.value,
                        customAccommodationType: option.value !== 'OTHER' ? '' : customAccommodationType
                      };

                      if (option.value === 'HOTEL') {
                        // Clear location details that are not needed for hotels
                        dataToSave.district = '';
                        dataToSave.subDistrict = '';
                        dataToSave.postalCode = '';

                        // Clear state immediately
                        setDistrict('');
                        setDistrictId(null);
                        setSubDistrict('');
                        setSubDistrictId(null);
                        setPostalCode('');
                      }

                      try {
                        await saveDataToSecureStorageWithOverride(dataToSave);
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

          {needsDetailedLocation && province && (
            <DistrictSelector
              label="区/县"
              provinceCode={province}
              value={district}
              selectedDistrictId={districtId}
              onSelect={handleDistrictSelect}
              helpText="选择酒店所在的区/县"
              error={!!errors.district}
              errorMessage={errors.district}
            />
          )}

          {needsDetailedLocation && district && districtId && (
            <SubDistrictSelector
              label="街道/分区"
              districtId={districtId}
              value={subDistrict}
              selectedSubDistrictId={subDistrictId}
              onSelect={handleSubDistrictSelect}
              helpText="选择酒店所在的街道/分区"
              error={!!errors.subDistrict}
              errorMessage={errors.subDistrict}
            />
          )}

          {needsDetailedLocation && (
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
          )}

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

          {/* Photo Upload Card */}
          <View style={styles.photoUploadCard}>
            <View style={styles.photoUploadHeader}>
              <Text style={styles.photoUploadTitle}>🏨 酒店预订凭证（可选）</Text>
            </View>

            <View style={styles.photoInfoBox}>
              <Text style={styles.photoInfoIcon}>💡</Text>
              <Text style={styles.photoInfoText}>
                上传酒店预订凭证可以帮助海关快速确认你的住宿安排
              </Text>
            </View>

            {!hotelReservationPhoto ? (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleHotelReservationPhotoUpload}
              >
                <View style={styles.uploadButtonContent}>
                  <View style={styles.uploadIconCircle}>
                    <Text style={styles.uploadIcon}>📷</Text>
                  </View>
                  <Text style={styles.uploadButtonText}>点击上传预订凭证</Text>
                  <Text style={styles.uploadButtonSubtext}>支持 JPG, PNG 格式</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.photoPreviewContainer}>
                <Image
                  source={{ uri: hotelReservationPhoto }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={handleHotelReservationPhotoUpload}
                >
                  <Text style={styles.changePhotoIcon}>🔄</Text>
                  <Text style={styles.changePhotoText}>更换凭证</Text>
                </TouchableOpacity>
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
    gap: spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
    minWidth: 100,
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
    color: colors.text,
  },
  optionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  input: {
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
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
  photoUploadCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  photoUploadHeader: {
    marginBottom: spacing.sm,
  },
  photoUploadTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    fontSize: 16,
  },
  photoInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  photoInfoIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  photoInfoText: {
    ...typography.caption,
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: spacing.lg,
    backgroundColor: '#F0F7FF',
  },
  uploadButtonContent: {
    alignItems: 'center',
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  uploadIcon: {
    fontSize: 32,
  },
  uploadButtonText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  uploadButtonSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  photoPreviewContainer: {
    position: 'relative',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  changePhotoIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  changePhotoText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '600',
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
});

export default AccommodationSubSection;
