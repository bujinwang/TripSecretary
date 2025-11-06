/**
 * TravelPurposeSubSection Component
 *
 * Displays travel purpose selection and boarding/recent stay countries
 * Part of TravelDetailsSection
 */

import React from 'react';
import { NationalitySelector, TravelPurposeSelector } from '@app/components';
import DebouncedSave from '@app/utils/DebouncedSave';
import { useLocale } from '../../../../i18n/LocaleContext';

const TravelPurposeSubSection = ({
  // Form state
  travelPurpose,
  customTravelPurpose,
  recentStayCountry,
  boardingCountry,
  // Setters
  setTravelPurpose,
  setCustomTravelPurpose,
  setRecentStayCountry,
  setBoardingCountry,
  // Validation
  handleFieldBlur,
  // Actions
  debouncedSaveData,
  saveDataToSecureStorageWithOverride,
  setLastEditedAt,
}) => {
  const { t } = useLocale();
  
  return (
    <>
      <TravelPurposeSelector
        label={t('thailand.travelInfo.fields.travelPurpose', { defaultValue: '为什么来泰国？' })}
        value={travelPurpose}
        onValueChange={async (code) => {
          setTravelPurpose(code);
          handleFieldBlur('travelPurpose', code);

          if (code !== 'OTHER') {
            setCustomTravelPurpose('');
            // Cancel any pending debounced saves to prevent race condition
            if (DebouncedSave.hasPendingSaves('thailand_travel_info')) {
              DebouncedSave.pendingTimeouts.forEach((timeoutId, key) => {
                if (key === 'thailand_travel_info') {
                  clearTimeout(timeoutId);
                  DebouncedSave.pendingTimeouts.delete(key);
                }
              });
            }
            // Save immediately with explicit values to ensure cleared customTravelPurpose is persisted
            if (saveDataToSecureStorageWithOverride) {
              try {
                await saveDataToSecureStorageWithOverride({
                  travelPurpose: code,
                  customTravelPurpose: ''
                });
                setLastEditedAt(new Date());
              } catch (error) {
                console.error('Failed to save travel purpose:', error);
              }
            }
            // Don't call debouncedSaveData here - the explicit save above already saved
          } else {
            // For OTHER option, use debounced save since user needs to type the custom value
            debouncedSaveData();
          }
        }}
        placeholder={t('thailand.travelInfo.fields.travelPurpose', { defaultValue: '请选择旅行目的' })}
        purposeType="thailand"
        locale="zh"
        showSearch={true}
        otherValue={customTravelPurpose}
        onOtherValueChange={(text) => {
          setCustomTravelPurpose(text.toUpperCase());
          handleFieldBlur('customTravelPurpose', text.toUpperCase());
        }}
      />

      <NationalitySelector
        label={t('thailand.travelInfo.fields.recentStayCountry', { defaultValue: '最近30天去过哪些国家？' })}
        value={recentStayCountry}
        onValueChange={(code) => {
          setRecentStayCountry(code);
          handleFieldBlur('recentStayCountry', code);
        }}
        helpText={t('thailand.travelInfo.fieldHelp.recentStayCountry', { defaultValue: '选择你最近30天内访问过的国家' })}
      />

      <NationalitySelector
        label={t('thailand.travelInfo.fields.boardingCountry', { defaultValue: '从哪个国家登机来泰国？' })}
        value={boardingCountry}
        onValueChange={(code) => {
          setBoardingCountry(code);
          handleFieldBlur('boardingCountry', code);
        }}
        helpText={t('thailand.travelInfo.fieldHelp.boardingCountry', { defaultValue: '选择你登机前往泰国的国家' })}
      />
    </>
  );
};

export default TravelPurposeSubSection;
