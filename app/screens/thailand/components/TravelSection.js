/**
 * TravelSection Component
 *
 * Displays travel information form section for Thailand travel info.
 * Includes travel purpose, flights, accommodation with complex conditional rendering.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CollapsibleSection, InputWithValidation } from '../../../components/thailand/ThailandTravelComponents';
import { NationalitySelector, DateTimeInput, ProvinceSelector, DistrictSelector, SubDistrictSelector } from '../../../components';
import Input from '../../../components/Input';
import { colors, typography, spacing } from '../../../theme';

/**
 * TravelSection - Collapsible form section for travel information
 *
 * This is the most complex section with extensive conditional rendering based on:
 * - isTransitPassenger: Controls whether accommodation fields are shown
 * - accommodationType: Controls which address fields are shown (HOTEL vs others)
 *
 * @param {Object} props
 * @param {boolean} props.isExpanded - Whether section is expanded
 * @param {function} props.onToggle - Toggle callback
 * @param {function} props.getFieldCount - Get field counts
 * @param {string} props.travelPurpose - Selected travel purpose
 * @param {function} props.onTravelPurposeChange - Travel purpose change handler
 * @param {string} props.customTravelPurpose - Custom travel purpose value
 * @param {function} props.onCustomTravelPurposeChange - Custom purpose change handler
 * @param {function} props.onDebouncedSave - Debounced save callback
 * @param {function} props.onFieldBlur - Field blur handler
 * @param {string} props.recentStayCountry - Recent stay country
 * @param {function} props.onRecentStayCountryChange - Recent stay change handler
 * @param {string} props.boardingCountry - Boarding country
 * @param {function} props.onBoardingCountryChange - Boarding country change handler
 * @param {Object} props.errors - Validation errors
 * @param {Object} props.warnings - Validation warnings
 * @param {string} props.lastEditedField - Last edited field name
 * @param {string} props.arrivalFlightNumber - Arrival flight number
 * @param {function} props.onArrivalFlightNumberChange - Arrival flight change handler
 * @param {string} props.arrivalArrivalDate - Arrival date
 * @param {function} props.onArrivalDateChange - Arrival date change handler
 * @param {string} props.departureFlightNumber - Departure flight number
 * @param {function} props.onDepartureFlightNumberChange - Departure flight change handler
 * @param {string} props.departureDepartureDate - Departure date
 * @param {function} props.onDepartureDateChange - Departure date change handler
 * @param {boolean} props.isTransitPassenger - Is transit passenger
 * @param {function} props.onTransitPassengerChange - Transit passenger change handler (async)
 * @param {string} props.accommodationType - Accommodation type
 * @param {function} props.onAccommodationTypeChange - Accommodation type change handler (async)
 * @param {string} props.customAccommodationType - Custom accommodation type
 * @param {function} props.onCustomAccommodationTypeChange - Custom accommodation change handler
 * @param {string} props.province - Province value
 * @param {function} props.onProvinceSelect - Province select handler
 * @param {string} props.hotelAddress - Hotel address
 * @param {function} props.onHotelAddressChange - Hotel address change handler
 * @param {string} props.district - District value
 * @param {string} props.districtId - District ID
 * @param {function} props.onDistrictSelect - District select handler
 * @param {string} props.subDistrict - Sub-district value
 * @param {string} props.subDistrictId - Sub-district ID
 * @param {function} props.onSubDistrictSelect - Sub-district select handler
 * @param {string} props.postalCode - Postal code
 * @param {function} props.onPostalCodeChange - Postal code change handler
 */
const TravelSection = ({
  isExpanded,
  onToggle,
  getFieldCount,
  travelPurpose,
  onTravelPurposeChange,
  customTravelPurpose,
  onCustomTravelPurposeChange,
  onDebouncedSave,
  onFieldBlur,
  recentStayCountry,
  onRecentStayCountryChange,
  boardingCountry,
  onBoardingCountryChange,
  errors,
  warnings,
  lastEditedField,
  arrivalFlightNumber,
  onArrivalFlightNumberChange,
  arrivalArrivalDate,
  onArrivalDateChange,
  departureFlightNumber,
  onDepartureFlightNumberChange,
  departureDepartureDate,
  onDepartureDateChange,
  isTransitPassenger,
  onTransitPassengerChange,
  accommodationType,
  onAccommodationTypeChange,
  customAccommodationType,
  onCustomAccommodationTypeChange,
  province,
  onProvinceSelect,
  hotelAddress,
  onHotelAddressChange,
  district,
  districtId,
  onDistrictSelect,
  subDistrict,
  subDistrictId,
  onSubDistrictSelect,
  postalCode,
  onPostalCodeChange,
}) => {
  const travelPurposeOptions = [
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
  ];

  const accommodationOptions = [
    { value: 'HOTEL', label: '酒店', icon: '🏨', tip: '最常见的选择' },
    { value: 'YOUTH_HOSTEL', label: '青年旅舍', icon: '🏠', tip: '经济实惠，交朋友' },
    { value: 'GUEST_HOUSE', label: '民宿', icon: '🏡', tip: '体验当地生活' },
    { value: 'FRIEND_HOUSE', label: '朋友家', icon: '👥', tip: '住在朋友家' },
    { value: 'APARTMENT', label: '公寓', icon: '🏢', tip: '短期租住民宿' },
    { value: 'OTHER', label: '其他', icon: '✏️', tip: '请详细说明' },
  ];

  return (
    <CollapsibleSection
      title="✈️ 旅行计划"
      subtitle="告诉泰国你的旅行安排"
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={getFieldCount('travel')}
    >
      {/* Border Crossing Context for Travel Info */}
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionIntroIcon}>✈️</Text>
        <Text style={styles.sectionIntroText}>
          海关想知道你为什么来泰国、何时来、何时走、在哪里住。这有助于他们确认你是合法游客。
        </Text>
      </View>

      {/* Travel Purpose Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>为什么来泰国？</Text>
        <View style={styles.optionsContainer}>
          {travelPurposeOptions.map((option) => {
            const isActive = travelPurpose === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  isActive && styles.optionButtonActive,
                ]}
                onPress={() => onTravelPurposeChange(option.value)}
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
            onChangeText={onCustomTravelPurposeChange}
            onBlur={() => onFieldBlur('customTravelPurpose', customTravelPurpose)}
            placeholder="请输入您的旅行目的"
            helpText="请用英文填写"
            autoCapitalize="words"
          />
        )}
      </View>

      <NationalitySelector
        label="过去14天停留国家或地区"
        value={recentStayCountry}
        onValueChange={onRecentStayCountryChange}
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
        onValueChange={onBoardingCountryChange}
        placeholder="请选择登机国家或地区"
        helpText="请选择您登机的国家或地区"
        error={!!errors.boardingCountry}
        errorMessage={errors.boardingCountry}
      />

      <InputWithValidation
        label="航班号"
        value={arrivalFlightNumber}
        onChangeText={onArrivalFlightNumberChange}
        onBlur={() => onFieldBlur('arrivalFlightNumber', arrivalFlightNumber)}
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
        onChangeText={onArrivalDateChange}
        mode="date"
        dateType="future"
        helpText="格式: YYYY-MM-DD"
        error={!!errors.arrivalArrivalDate}
        errorMessage={errors.arrivalArrivalDate}
      />

      {/* Departure Flight Section */}
      <View style={styles.subSectionHeader}>
        <Text style={styles.subSectionTitle}>去程机票（离开泰国）</Text>
      </View>

      <Input
        label="航班号"
        value={departureFlightNumber}
        onChangeText={onDepartureFlightNumberChange}
        onBlur={() => onFieldBlur('departureFlightNumber', departureFlightNumber)}
        helpText="请输入您的离开航班号"
        error={!!errors.departureFlightNumber}
        errorMessage={errors.departureFlightNumber}
        autoCapitalize="characters"
      />

      <DateTimeInput
        label="出发日期"
        value={departureDepartureDate}
        onChangeText={onDepartureDateChange}
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
        onPress={onTransitPassengerChange}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, isTransitPassenger && styles.checkboxChecked]}>
          {isTransitPassenger && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          我是过境旅客，不在泰国停留
        </Text>
      </TouchableOpacity>

      {/* Accommodation Type Selection - Only show if not transit passenger */}
      {!isTransitPassenger && (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>住在哪里？</Text>
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
                  onPress={() => onAccommodationTypeChange(option.value)}
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
              onChangeText={onCustomAccommodationTypeChange}
              onBlur={() => onFieldBlur('customAccommodationType', customAccommodationType)}
              placeholder="请输入您的住宿类型"
              helpText="请用英文填写"
              autoCapitalize="words"
            />
          )}
        </View>
      )}

      {/* Address Fields - Conditional based on accommodation type */}
      {!isTransitPassenger && (
        accommodationType === 'HOTEL' ? (
          <>
            <ProvinceSelector
              label="省"
              value={province}
              onValueChange={onProvinceSelect}
              helpText="请选择泰国的省份"
              error={!!errors.province}
              errorMessage={errors.province}
            />
            <Input
              label="地址"
              value={hotelAddress}
              onChangeText={onHotelAddressChange}
              onBlur={() => onFieldBlur('hotelAddress', hotelAddress)}
              multiline
              helpText="请输入详细地址"
              error={!!errors.hotelAddress}
              errorMessage={errors.hotelAddress}
              autoCapitalize="words"
            />
          </>
        ) : (
          <>
            <ProvinceSelector
              label="省"
              value={province}
              onValueChange={onProvinceSelect}
              helpText="请选择泰国的省份"
              error={!!errors.province}
              errorMessage={errors.province}
            />
            <DistrictSelector
              label="区（地区）"
              provinceCode={province}
              value={district}
              selectedDistrictId={districtId}
              onSelect={onDistrictSelect}
              helpText="请选择区或地区（支持中英文搜索）"
              error={!!errors.district}
              errorMessage={errors.district}
            />
            <SubDistrictSelector
              label="乡（子地区）"
              districtId={districtId}
              value={subDistrict}
              selectedSubDistrictId={subDistrictId}
              onSelect={onSubDistrictSelect}
              helpText="选择后我们会自动匹配邮政编码"
              error={!!errors.subDistrict}
              errorMessage={errors.subDistrict}
            />
            <Input
              label="邮政编码"
              value={postalCode}
              onChangeText={onPostalCodeChange}
              onBlur={() => onFieldBlur('postalCode', postalCode)}
              helpText="选择乡 / 街道后会自动填写，可手动修正"
              error={!!errors.postalCode}
              errorMessage={errors.postalCode}
              keyboardType="numeric"
            />
            <Input
              label="详细地址"
              value={hotelAddress}
              onChangeText={onHotelAddressChange}
              onBlur={() => onFieldBlur('hotelAddress', hotelAddress)}
              multiline
              helpText="请输入详细地址（例如：ABC COMPLEX (BUILDING A, SOUTH ZONE), 120 MOO 3, CHAENG WATTANA ROAD）"
              error={!!errors.hotelAddress}
              errorMessage={errors.hotelAddress}
              autoCapitalize="words"
            />
          </>
        )
      )}
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  sectionIntro: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  sectionIntroIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  sectionIntroText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  optionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    minWidth: 100,
    flex: 1,
    minHeight: 80,
  },
  optionButtonActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  optionText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  subSectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  subSectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
});

export default TravelSection;
