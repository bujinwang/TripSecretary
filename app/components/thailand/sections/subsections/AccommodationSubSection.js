/**
 * AccommodationSubSection Component
 *
 * Displays accommodation information including type and address
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
import { ProvinceSelector, DistrictSelector, SubDistrictSelector } from '../../../../components';
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

  // Only Hotel accommodation requires province and address (not detailed location)
  const needsDetailedLocation = accommodationType !== 'HOTEL';

  return (
    <>
      {/* Accommodation Section */}
      <YStack
        marginTop="$lg"
        marginBottom="$md"
        paddingBottom="$sm"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <TamaguiText fontSize="$2" fontWeight="600" color="$text">
          住宿信息
        </TamaguiText>
      </YStack>

      {/* Transit Passenger Checkbox */}
      <BaseCard
        variant="flat"
        padding="md"
        pressable
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
        marginBottom="$md"
      >
        <XStack gap="$sm" alignItems="center">
          <YStack
            width={24}
            height={24}
            borderWidth={2}
            borderColor={isTransitPassenger ? '$primary' : '$borderColor'}
            borderRadius={4}
            justifyContent="center"
            alignItems="center"
            backgroundColor={isTransitPassenger ? '$primary' : 'transparent'}
          >
            {isTransitPassenger && (
              <TamaguiText color="$white" fontSize={16} fontWeight="bold">
                ✓
              </TamaguiText>
            )}
          </YStack>
          <TamaguiText fontSize="$2" color="$text" flex={1}>
            我是转机乘客（不在泰国过夜）
          </TamaguiText>
        </XStack>
      </BaseCard>

      {!isTransitPassenger && (
        <>
          <YStack marginBottom="$md">
            <TamaguiText fontSize="$2" fontWeight="600" color="$text" marginBottom="$sm">
              住宿类型
            </TamaguiText>
            <XStack flexWrap="wrap" gap="$sm">
              {accommodationOptions.map((option) => {
                const isActive = accommodationType === option.value;
                return (
                  <BaseCard
                    key={option.value}
                    variant="flat"
                    padding="sm"
                    pressable
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
                    borderWidth={1}
                    borderColor={isActive ? '$primary' : '$borderColor'}
                    backgroundColor={isActive ? '$primary' : '$card'}
                    minWidth={100}
                  >
                    <XStack gap="$xs" alignItems="center">
                      <TamaguiText fontSize={20}>{option.icon}</TamaguiText>
                      <TamaguiText
                        fontSize="$2"
                        color={isActive ? '$white' : '$text'}
                        fontWeight={isActive ? '600' : '400'}
                      >
                        {option.label}
                      </TamaguiText>
                    </XStack>
                  </BaseCard>
                );
              })}
            </XStack>
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
            <YStack marginBottom="$md">
              <BaseInput
                label="邮政编码"
                value={postalCode}
                helperText="选择街道后自动填充，或手动输入"
                error={errors.postalCode}
                keyboardType="numeric"
                editable={false}
                opacity={0.6}
              />
            </YStack>
          )}

          <YStack marginBottom="$md">
            <BaseInput
              label="酒店地址"
              value={hotelAddress}
              onChangeText={(text) => setHotelAddress(text.toUpperCase())}
              onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)}
              helperText="例如：123 SUKHUMVIT ROAD"
              error={errors.hotelAddress}
              autoCapitalize="characters"
              multiline
              numberOfLines={3}
            />
            {warnings.hotelAddress && !errors.hotelAddress && (
              <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
                ⚠️ {warnings.hotelAddress}
              </TamaguiText>
            )}
          </YStack>

          {/* Photo Upload Card */}
          <BaseCard
            variant="elevated"
            padding="md"
            marginTop="$md"
            marginBottom="$lg"
          >
            <YStack gap="$sm">
              <TamaguiText fontSize="$2" fontWeight="600" color="$text">
                🏨 酒店预订凭证（可选）
              </TamaguiText>

              <BaseCard variant="flat" padding="sm" backgroundColor="#FEF3C7">
                <XStack gap="$xs" alignItems="flex-start">
                  <TamaguiText fontSize={16}>💡</TamaguiText>
                  <TamaguiText fontSize="$1" color="#92400E" flex={1} lineHeight={18}>
                    上传酒店预订凭证可以帮助海关快速确认你的住宿安排
                  </TamaguiText>
                </XStack>
              </BaseCard>

              {!hotelReservationPhoto ? (
                <BaseCard
                  variant="flat"
                  padding="lg"
                  pressable
                  onPress={handleHotelReservationPhotoUpload}
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
                      点击上传预订凭证
                    </TamaguiText>
                    <TamaguiText fontSize="$1" color="$textSecondary">
                      支持 JPG, PNG 格式
                    </TamaguiText>
                  </YStack>
                </BaseCard>
              ) : (
                <YStack>
                  <Image
                    source={{ uri: hotelReservationPhoto }}
                    style={{ width: '100%', height: 200, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                  <BaseButton
                    variant="primary"
                    size="md"
                    onPress={handleHotelReservationPhotoUpload}
                    marginTop="$sm"
                    icon={<TamaguiText fontSize={16}>🔄</TamaguiText>}
                  >
                    更换凭证
                  </BaseButton>
                </YStack>
              )}
            </YStack>
          </BaseCard>
        </>
      )}
    </>
  );
};

export default AccommodationSubSection;
