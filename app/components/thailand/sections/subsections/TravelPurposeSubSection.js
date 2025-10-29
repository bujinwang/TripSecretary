/**
 * TravelPurposeSubSection Component
 *
 * Displays travel purpose selection and boarding/recent stay countries
 * Part of TravelDetailsSection
 */

import React from 'react';
import { NationalitySelector, TravelPurposeSelector } from '../../../../components';

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
}) => {
  return (
    <>
      <TravelPurposeSelector
        label="为什么来泰国？"
        value={travelPurpose}
        onValueChange={(code) => {
          setTravelPurpose(code);
          if (code !== 'OTHER') {
            setCustomTravelPurpose('');
          }
          handleFieldBlur('travelPurpose', code);
        }}
        placeholder="请选择旅行目的"
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
        label="最近30天去过哪些国家？"
        value={recentStayCountry}
        onValueChange={(code) => {
          setRecentStayCountry(code);
          handleFieldBlur('recentStayCountry', code);
        }}
        helpText="选择你最近30天内访问过的国家"
      />

      <NationalitySelector
        label="从哪个国家登机来泰国？"
        value={boardingCountry}
        onValueChange={(code) => {
          setBoardingCountry(code);
          handleFieldBlur('boardingCountry', code);
        }}
        helpText="选择你登机前往泰国的国家"
      />
    </>
  );
};

export default TravelPurposeSubSection;
