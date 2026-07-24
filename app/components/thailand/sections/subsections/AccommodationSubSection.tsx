/**
 * AccommodationSubSection Component
 *
 * Displays accommodation information including type and address
 * Part of TravelDetailsSection
 */

import React, { useCallback, useMemo } from 'react';
import { Image } from 'react-native';
import {
  YStack,
  XStack,
  BaseCard,
  BaseInput,
  BaseButton,
  Text as TamaguiText,
} from '../../../tamagui';
import { ProvinceSelector, DistrictSelector, SubDistrictSelector } from '@app/components';
import Input from '@app/components/Input';
import debouncedSaveInstance from '@app/utils/DebouncedSave';
import type { RegionRecord } from '@app/components/ProvinceSelector';
import type { DistrictRecord } from '@app/components/DistrictSelector';
import type { SubDistrictRecord } from '@app/components/SubDistrictSelector';

type ValidationMap = Record<string, string | undefined>;

type SaveOverrideFn = (data: Record<string, unknown>) => Promise<void>;

type AccommodationSubSectionProps = {
  isTransitPassenger: boolean;
  accommodationType: string;
  customAccommodationType: string;
  province?: string;
  district?: string;
  districtId?: string | null;
  subDistrict?: string;
  subDistrictId?: string | null;
  postalCode?: string;
  hotelAddress: string;
  hotelReservationPhoto?: string | null;
  setIsTransitPassenger: (value: boolean) => void;
  setAccommodationType: (value: string) => void;
  setCustomAccommodationType: (value: string) => void;
  setHotelAddress: (value: string) => void;
  setDistrict: (value: string) => void;
  setDistrictId: (value: string | null) => void;
  setSubDistrict: (value: string) => void;
  setSubDistrictId: (value: string | null) => void;
  setPostalCode: (value: string) => void;
  errors: ValidationMap;
  warnings: ValidationMap;
  handleFieldBlur: (field: string, value: string) => void;
  lastEditedField?: string | null;
  debouncedSaveData: () => void;
  saveDataToSecureStorageWithOverride?: SaveOverrideFn;
  setLastEditedAt?: (date: Date) => void;
  handleProvinceSelect?: (province: string) => void;
  handleDistrictSelect?: (selection: DistrictRecord) => void;
  handleSubDistrictSelect?: (selection: SubDistrictRecord) => void;
  handleHotelReservationPhotoUpload?: () => void;
  regionsData?: RegionRecord[];
  getDistrictsFunc?: (provinceCode: string) => DistrictRecord[] | null | undefined;
  getSubDistrictsFunc?: (districtId: string) => SubDistrictRecord[] | null | undefined;
  setProvince?: (value: string) => void;
};

const AccommodationSubSection: React.FC<AccommodationSubSectionProps> = ({
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
  setIsTransitPassenger,
  setAccommodationType,
  setCustomAccommodationType,
  setHotelAddress,
  setDistrict,
  setDistrictId,
  setSubDistrict,
  setSubDistrictId,
  setPostalCode,
  errors,
  warnings,
  handleFieldBlur,
  debouncedSaveData,
  saveDataToSecureStorageWithOverride,
  setLastEditedAt,
  handleProvinceSelect,
  handleDistrictSelect,
  handleSubDistrictSelect,
  handleHotelReservationPhotoUpload,
  regionsData,
  getDistrictsFunc,
  getSubDistrictsFunc,
  setProvince,
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

  const needsDetailedLocation = accommodationType !== 'HOTEL';

  const handleTransitToggle = async () => {
    const newValue = !isTransitPassenger;
    setIsTransitPassenger(newValue);

    if (!newValue) {
      return;
    }

    setAccommodationType('HOTEL');
    setCustomAccommodationType('');
    setDistrict('');
    setDistrictId(null);
    setSubDistrict('');
    setSubDistrictId(null);
    setPostalCode('');
    handleProvinceSelect?.('');

    await debouncedSaveInstance.flushPendingSave('thailand_travel_info');

    if (saveDataToSecureStorageWithOverride && setLastEditedAt) {
      try {
        await saveDataToSecureStorageWithOverride({
          isTransitPassenger: true,
          accommodationType: 'HOTEL',
          customAccommodationType: '',
          province: '',
          district: '',
          subDistrict: '',
          postalCode: '',
          hotelAddress: '',
        });
        setLastEditedAt(new Date());
      } catch (error) {
        console.error('Failed to save transit passenger status:', error);
      }
    }
  };

  const handleAccommodationSelect = async (value: string) => {
    setAccommodationType(value);
    if (value !== 'OTHER') {
      setCustomAccommodationType('');
    }

    await debouncedSaveInstance.flushPendingSave('thailand_travel_info');

    const dataToSave: Record<string, unknown> = {
      accommodationType: value,
      customAccommodationType: value !== 'OTHER' ? '' : customAccommodationType,
    };

    if (value === 'HOTEL') {
      dataToSave.district = '';
      dataToSave.subDistrict = '';
      dataToSave.postalCode = '';

      setDistrict('');
      setDistrictId(null);
      setSubDistrict('');
      setSubDistrictId(null);
      setPostalCode('');
    }

    if (saveDataToSecureStorageWithOverride && setLastEditedAt) {
      try {
        await saveDataToSecureStorageWithOverride(dataToSave);
        setLastEditedAt(new Date());
      } catch (error) {
        console.error('Failed to save accommodation type:', error);
      }
    } else {
      debouncedSaveData();
    }
  };

  const provinceOptions = useMemo<RegionRecord[]>(
    () => (Array.isArray(regionsData) ? regionsData : []),
    [regionsData],
  );

  const safeGetDistricts = useCallback(
    (provinceCode: string): DistrictRecord[] => {
      if (!provinceCode || !getDistrictsFunc) {
        return [];
      }
      const result = getDistrictsFunc(provinceCode);
      return Array.isArray(result) ? result : [];
    },
    [getDistrictsFunc],
  );

  const safeGetSubDistricts = useCallback(
    (districtCode: string): SubDistrictRecord[] => {
      if (!districtCode || !getSubDistrictsFunc) {
        return [];
      }
      const result = getSubDistrictsFunc(districtCode);
      return Array.isArray(result) ? result : [];
    },
    [getSubDistrictsFunc],
  );

  const handleDistrictSelection = useCallback(
    (selection: DistrictRecord) => {
      setDistrict(selection.nameEn ?? String(selection.id));
      setDistrictId(selection.id ?? null);
      handleDistrictSelect?.(selection);
    },
    [handleDistrictSelect, setDistrict, setDistrictId],
  );

  const handleSubDistrictSelection = useCallback(
    (selection: SubDistrictRecord) => {
      setSubDistrict(selection.nameEn ?? String(selection.id));
      setSubDistrictId(selection.id ?? null);
      const nextPostalCode = selection.postalCode ? String(selection.postalCode) : '';
      setPostalCode(nextPostalCode);
      handleSubDistrictSelect?.(selection);
    },
    [handleSubDistrictSelect, setPostalCode, setSubDistrict, setSubDistrictId],
  );

  return (
    <>
      <YStack marginTop="$lg" marginBottom="$md" paddingBottom="$sm" borderBottomWidth={1} borderBottomColor="$borderColor">
        <TamaguiText fontSize="$2" fontWeight="600" color="$text">
          住宿信息
        </TamaguiText>
      </YStack>

      <BaseCard variant="flat" padding="md" pressable onPress={handleTransitToggle} marginBottom="$md">
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
            {isTransitPassenger ? (
              <TamaguiText color="$white" fontSize={16} fontWeight="bold">
                ✓
              </TamaguiText>
            ) : null}
          </YStack>
          <TamaguiText fontSize="$2" color="$text" flex={1}>
            我是转机乘客（不在泰国过夜）
          </TamaguiText>
        </XStack>
      </BaseCard>

      {!isTransitPassenger ? (
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
                    onPress={() => {
                      void handleAccommodationSelect(option.value);
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
            {accommodationType === 'OTHER' ? (
              <Input
                placeholder="请详细说明住宿类型（英文）"
                value={customAccommodationType}
                onChangeText={(text) => setCustomAccommodationType(text.toUpperCase())}
                onBlur={() => handleFieldBlur('customAccommodationType', customAccommodationType)}
                autoCapitalize="characters"
                style={styles.input}
              />
            ) : null}
          </YStack>

          <ProvinceSelector
            label="省份"
            value={province}
            onValueChange={(value) => {
              setProvince?.(value);
              handleProvinceSelect?.(value);
            }}
            helpText="选择酒店所在的省份"
            error={!!errors.province}
            errorMessage={errors.province}
            regionsData={provinceOptions}
          />

          {needsDetailedLocation && province ? (
            <DistrictSelector
              label="区/县"
              provinceCode={province}
              value={district}
              selectedDistrictId={districtId ?? undefined}
              onSelect={handleDistrictSelection}
              helpText="选择酒店所在的区/县"
              error={!!errors.district}
              errorMessage={errors.district}
              getDistrictsFunc={safeGetDistricts}
            />
          ) : null}

          {needsDetailedLocation && district && districtId ? (
            <SubDistrictSelector
              label="街道/分区"
              districtId={districtId}
              value={subDistrict}
              selectedSubDistrictId={subDistrictId ?? undefined}
              onSelect={handleSubDistrictSelection}
              helpText="选择酒店所在的街道/分区"
              error={!!errors.subDistrict}
              errorMessage={errors.subDistrict}
              getSubDistrictsFunc={safeGetSubDistricts}
            />
          ) : null}

          {needsDetailedLocation ? (
            <YStack marginBottom="$md">
              <BaseInput
                label="邮政编码"
                value={postalCode}
                helperText="选择街道后自动填充，或手动输入"
                error={!!errors.postalCode}
                keyboardType="numeric"
                editable={false}
                opacity={0.6}
              />
            </YStack>
          ) : null}

          <YStack marginBottom="$md">
            <BaseInput
              label="酒店地址"
              value={hotelAddress}
              onChangeText={(text) => setHotelAddress(text.toUpperCase())}
              onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)}
              helperText="例如：123 SUKHUMVIT ROAD"
              error={!!errors.hotelAddress}
              autoCapitalize="characters"
              multiline
              numberOfLines={3}
            />
            {warnings.hotelAddress && !errors.hotelAddress ? (
              <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
                ⚠️ {warnings.hotelAddress}
              </TamaguiText>
            ) : null}
          </YStack>

          <BaseCard variant="elevated" padding="md" marginTop="$md" marginBottom="$lg">
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
      ) : null}
    </>
  );
};

const styles = {
  input: {
    marginTop: 8,
  },
} as const;

export default AccommodationSubSection;
