/**
 * TravelPurposeSubSection Component
 *
 * Displays travel purpose selection and boarding/recent stay countries
 * Part of TravelDetailsSection
 */

import React from 'react';
import { NationalitySelector, TravelPurposeSelector } from '@app/components';
import debouncedSaveInstance from '@app/utils/DebouncedSave';
import { useLocale } from '../../../../i18n/LocaleContext';

type SaveOverrideFn = (data: Record<string, unknown>) => Promise<void>;

type ThailandTravelPurposeSubSectionProps = {
  travelPurpose: string;
  customTravelPurpose: string;
  recentStayCountry?: string;
  boardingCountry?: string;
  setTravelPurpose: (value: string) => void;
  setCustomTravelPurpose: (value: string) => void;
  setRecentStayCountry: (value: string) => void;
  setBoardingCountry: (value: string) => void;
  handleFieldBlur: (field: string, value: string) => void;
  debouncedSaveData: () => void;
  saveDataToSecureStorageWithOverride?: SaveOverrideFn;
  setLastEditedAt?: (date: Date) => void;
};

const TravelPurposeSubSection: React.FC<ThailandTravelPurposeSubSectionProps> = ({
  travelPurpose,
  customTravelPurpose,
  recentStayCountry,
  boardingCountry,
  setTravelPurpose,
  setCustomTravelPurpose,
  setRecentStayCountry,
  setBoardingCountry,
  handleFieldBlur,
  debouncedSaveData,
  saveDataToSecureStorageWithOverride,
  setLastEditedAt,
}) => {
  const { t } = useLocale();

  const handleTravelPurposeChange = async (code: string) => {
    setTravelPurpose(code);
    handleFieldBlur('travelPurpose', code);

    if (code !== 'OTHER') {
      setCustomTravelPurpose('');
      await debouncedSaveInstance.flushPendingSave('thailand_travel_info');

      if (saveDataToSecureStorageWithOverride && setLastEditedAt) {
        try {
          await saveDataToSecureStorageWithOverride({
            travelPurpose: code,
            customTravelPurpose: '',
          });
          setLastEditedAt(new Date());
        } catch (error) {
          console.error('Failed to save travel purpose:', error);
        }
      }
    } else {
      debouncedSaveData();
    }
  };

  return (
    <>
      <TravelPurposeSelector
        label={t('thailand.travelInfo.fields.travelPurpose', { defaultValue: '为什么来泰国？' })}
        value={travelPurpose}
        onValueChange={(code) => {
          void handleTravelPurposeChange(code);
        }}
        placeholder={t('thailand.travelInfo.fields.travelPurpose', { defaultValue: '请选择旅行目的' })}
        purposeType="thailand"
        locale="zh"
        showSearch
        otherValue={customTravelPurpose}
        onOtherValueChange={(text) => {
          const upperValue = text.toUpperCase();
          setCustomTravelPurpose(upperValue);
          handleFieldBlur('customTravelPurpose', upperValue);
        }}
      />

      <NationalitySelector
        label={t('thailand.travelInfo.fields.recentStayCountry', { defaultValue: '最近30天去过哪些国家？' })}
        value={recentStayCountry}
        onValueChange={(code) => {
          setRecentStayCountry(code);
          handleFieldBlur('recentStayCountry', code);
        }}
        helpText={t('thailand.travelInfo.fieldHelp.recentStayCountry', {
          defaultValue: '选择你最近30天内访问过的国家',
        })}
      />

      <NationalitySelector
        label={t('thailand.travelInfo.fields.boardingCountry', { defaultValue: '从哪个国家登机来泰国？' })}
        value={boardingCountry}
        onValueChange={(code) => {
          setBoardingCountry(code);
          handleFieldBlur('boardingCountry', code);
        }}
        helpText={t('thailand.travelInfo.fieldHelp.boardingCountry', {
          defaultValue: '选择你登机前往泰国的国家',
        })}
      />
    </>
  );
};

export default TravelPurposeSubSection;
