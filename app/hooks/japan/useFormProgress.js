import { useMemo } from 'react';

const getFieldCount = (section, formData) => {
  let filled = 0;
  let total = 0;

  switch (section) {
    case 'passport':
      const passportFields = [
        formData.fullName,
        formData.nationality,
        formData.passportNo,
        formData.dob,
        formData.expiryDate
      ];
      total = passportFields.length;
      filled = passportFields.filter(field => field && field.toString().trim() !== '').length;
      break;

    case 'personal':
      const personalFields = [
        formData.occupation,
        formData.cityOfResidence,
        formData.residentCountry,
        formData.phoneCode,
        formData.phoneNumber,
        formData.email,
        formData.gender
      ];
      total = personalFields.length;
      filled = personalFields.filter(field => field && field.toString().trim() !== '').length;
      break;

    case 'funds':
      // Count the actual number of fund items
      total = Math.max(formData.funds.length, 1); // Show at least 1 as target
      filled = formData.funds.length;
      break;

    case 'travel':
      const purposeFilled = formData.travelPurpose === 'Other'
        ? (formData.customTravelPurpose && formData.customTravelPurpose.trim() !== '')
        : (formData.travelPurpose && formData.travelPurpose.trim() !== '');

      const travelFields = [
        purposeFilled,
        formData.arrivalFlightNumber,
        formData.arrivalDate,
        formData.lengthOfStay
      ];

      if (!formData.isTransitPassenger) {
        travelFields.push(formData.accommodationAddress, formData.accommodationPhone);
      }
      total = travelFields.length;
      filled = travelFields.filter(field => {
        if (typeof field === 'boolean') {
return field;
}
        return field && field.toString().trim() !== '';
      }).length;
      break;
  }

  return { filled, total };
};

export const useFormProgress = (formData) => {
  const sectionProgress = useMemo(() => {
    return {
      passport: getFieldCount('passport', formData),
      personal: getFieldCount('personal', formData),
      funds: getFieldCount('funds', formData),
      travel: getFieldCount('travel', formData),
    };
  }, [
    formData.fullName,
    formData.nationality,
    formData.passportNo,
    formData.dob,
    formData.expiryDate,
    formData.occupation,
    formData.cityOfResidence,
    formData.residentCountry,
    formData.phoneCode,
    formData.phoneNumber,
    formData.email,
    formData.gender,
    formData.funds,
    formData.travelPurpose,
    formData.customTravelPurpose,
    formData.arrivalFlightNumber,
    formData.arrivalDate,
    formData.lengthOfStay,
    formData.isTransitPassenger,
    formData.accommodationAddress,
    formData.accommodationPhone,
  ]);

  const totalFields = useMemo(
    () => Object.values(sectionProgress).reduce((acc, item) => acc + (item?.total || 0), 0),
    [sectionProgress]
  );

  const totalFilled = useMemo(
    () => Object.values(sectionProgress).reduce((acc, item) => acc + (item?.filled || 0), 0),
    [sectionProgress]
  );

  const completionPercent = totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0;
  const remainingItems = Math.max(totalFields - totalFilled, 0);
  const isReadyForTravel = completionPercent >= 100;

  const isFormValid = () => {
    return sectionProgress.passport.filled === sectionProgress.passport.total &&
           sectionProgress.personal.filled === sectionProgress.personal.total &&
           sectionProgress.funds.filled === sectionProgress.funds.total &&
           sectionProgress.travel.filled === sectionProgress.travel.total;
  };

  return {
    sectionProgress,
    totalFields,
    totalFilled,
    completionPercent,
    remainingItems,
    isReadyForTravel,
    isFormValid,
  };
};
