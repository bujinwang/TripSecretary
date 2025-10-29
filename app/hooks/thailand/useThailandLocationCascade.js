/**
 * useThailandLocationCascade Hook
 *
 * Manages Thailand location cascade logic (Province -> District -> SubDistrict -> Postal Code)
 * Handles automatic ID updates and field clearing when parent selection changes
 */

import { useEffect, useCallback } from 'react';
import { findDistrictOption, findSubDistrictOption } from '../../utils/thailand/LocationHelpers';

/**
 * Custom hook to manage Thailand location cascade
 * @param {Object} params - Hook parameters
 * @param {Object} params.formState - Form state from useThailandFormState
 * @param {Function} params.handleFieldBlur - Field blur handler from validation hook
 * @param {Function} params.saveDataToSecureStorage - Immediate save function from persistence hook
 * @returns {Object} Location handlers
 */
export const useThailandLocationCascade = ({ formState, handleFieldBlur, saveDataToSecureStorage }) => {
  // Handle district/subdistrict ID updates (cascade logic)
  useEffect(() => {
    if (!formState.province || !formState.district) {
      if (formState.districtId !== null) {
        formState.setDistrictId(null);
      }
      return;
    }

    const match = findDistrictOption(formState.province, formState.district);
    if (match && match.id !== formState.districtId) {
      formState.setDistrictId(match.id);
    }
  }, [formState.province, formState.district, formState.districtId, formState]);

  useEffect(() => {
    if (!formState.districtId || !formState.subDistrict) {
      if (formState.subDistrictId !== null) {
        formState.setSubDistrictId(null);
      }
      return;
    }

    const match = findSubDistrictOption(formState.districtId, formState.subDistrict);
    if (match && match.id !== formState.subDistrictId) {
      formState.setSubDistrictId(match.id);
      if (!formState.postalCode && match.postalCode) {
        formState.setPostalCode(String(match.postalCode));
      }
    }
  }, [formState.districtId, formState.subDistrict, formState.subDistrictId, formState.postalCode, formState]);

  // Reset district selection and all dependent fields
  const resetDistrictSelection = useCallback(() => {
    formState.setDistrict('');
    formState.setDistrictId(null);
    formState.setSubDistrict('');
    formState.setSubDistrictId(null);
    formState.setPostalCode('');
  }, [formState]);

  // Handle province selection
  const handleProvinceSelect = useCallback(async (code) => {
    console.log('🌏 handleProvinceSelect called with code:', code);
    formState.setProvince(code);
    resetDistrictSelection();

    console.log('🌏 Calling handleFieldBlur for province:', code);
    await handleFieldBlur('province', code);

    if (formState.district) {
      await handleFieldBlur('district', '');
    }
    if (formState.subDistrict) {
      await handleFieldBlur('subDistrict', '');
    }
    if (formState.postalCode) {
      await handleFieldBlur('postalCode', '');
    }

    // Save immediately with explicit values to ensure cleared fields are persisted
    if (saveDataToSecureStorage) {
      console.log('🌏 Calling saveDataToSecureStorage with overrides:', {
        province: code,
        district: '',
        districtId: null,
        subDistrict: '',
        subDistrictId: null,
        postalCode: ''
      });
      await saveDataToSecureStorage({
        province: code,
        district: '',
        districtId: null,
        subDistrict: '',
        subDistrictId: null,
        postalCode: ''
      });
      console.log('🌏 saveDataToSecureStorage completed');
    }
  }, [handleFieldBlur, resetDistrictSelection, formState, saveDataToSecureStorage]);

  // Handle district selection
  const handleDistrictSelect = useCallback(async (selection) => {
    if (!selection) return;

    const newDistrict = selection.nameEn;
    formState.setDistrict(newDistrict);
    formState.setDistrictId(selection.id);
    handleFieldBlur('district', newDistrict);

    // Clear sub-district and postal code when district changes
    const shouldClearSubDistrict = formState.subDistrict !== '';
    const shouldClearPostalCode = formState.postalCode !== '';

    if (shouldClearSubDistrict) {
      formState.setSubDistrict('');
      formState.setSubDistrictId(null);
      handleFieldBlur('subDistrict', '');
    }

    if (shouldClearPostalCode) {
      formState.setPostalCode('');
      handleFieldBlur('postalCode', '');
    }

    // Save immediately with explicit values (React state updates are async!)
    if (saveDataToSecureStorage) {
      const overrides = { district: newDistrict };
      if (shouldClearSubDistrict) overrides.subDistrict = '';
      if (shouldClearPostalCode) overrides.postalCode = '';
      await saveDataToSecureStorage(overrides);
    }
  }, [handleFieldBlur, formState, saveDataToSecureStorage]);

  // Handle subdistrict selection
  const handleSubDistrictSelect = useCallback(async (selection) => {
    if (!selection) return;

    const newSubDistrict = selection.nameEn;
    const newPostalCode = selection.postalCode ? String(selection.postalCode) : '';

    formState.setSubDistrict(newSubDistrict);
    formState.setSubDistrictId(selection.id);
    handleFieldBlur('subDistrict', newSubDistrict);

    if (newPostalCode || formState.postalCode) {
      formState.setPostalCode(newPostalCode);
      handleFieldBlur('postalCode', newPostalCode);
    }

    // Save immediately with explicit values (React state updates are async!)
    // Pass the NEW values as overrides to ensure they're saved correctly
    if (saveDataToSecureStorage) {
      await saveDataToSecureStorage({
        subDistrict: newSubDistrict,
        postalCode: newPostalCode
      });
    }
  }, [handleFieldBlur, formState, saveDataToSecureStorage]);

  return {
    resetDistrictSelection,
    handleProvinceSelect,
    handleDistrictSelect,
    handleSubDistrictSelect,
  };
};

export default useThailandLocationCascade;
