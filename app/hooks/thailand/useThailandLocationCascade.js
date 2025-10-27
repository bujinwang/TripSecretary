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
 * @returns {Object} Location handlers
 */
export const useThailandLocationCascade = ({ formState, handleFieldBlur }) => {
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
  const handleProvinceSelect = useCallback((code) => {
    formState.setProvince(code);
    resetDistrictSelection();

    handleFieldBlur('province', code);

    if (formState.district) {
      handleFieldBlur('district', '');
    }
    if (formState.subDistrict) {
      handleFieldBlur('subDistrict', '');
    }
    if (formState.postalCode) {
      handleFieldBlur('postalCode', '');
    }
  }, [handleFieldBlur, resetDistrictSelection, formState]);

  // Handle district selection
  const handleDistrictSelect = useCallback((selection) => {
    if (!selection) return;

    formState.setDistrict(selection.nameEn);
    formState.setDistrictId(selection.id);
    handleFieldBlur('district', selection.nameEn);

    if (formState.subDistrict) {
      formState.setSubDistrict('');
      formState.setSubDistrictId(null);
      handleFieldBlur('subDistrict', '');
    }

    if (formState.postalCode) {
      formState.setPostalCode('');
      handleFieldBlur('postalCode', '');
    }
  }, [handleFieldBlur, formState]);

  // Handle subdistrict selection
  const handleSubDistrictSelect = useCallback((selection) => {
    if (!selection) return;

    formState.setSubDistrict(selection.nameEn);
    formState.setSubDistrictId(selection.id);
    handleFieldBlur('subDistrict', selection.nameEn);

    const newPostalCode = selection.postalCode ? String(selection.postalCode) : '';
    if (newPostalCode || formState.postalCode) {
      formState.setPostalCode(newPostalCode);
      handleFieldBlur('postalCode', newPostalCode);
    }
  }, [handleFieldBlur, formState]);

  return {
    resetDistrictSelection,
    handleProvinceSelect,
    handleDistrictSelect,
    handleSubDistrictSelect,
  };
};

export default useThailandLocationCascade;
