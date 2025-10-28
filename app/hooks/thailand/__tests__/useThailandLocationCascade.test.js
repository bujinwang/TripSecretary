/**
 * Unit Tests for useThailandLocationCascade Hook
 *
 * Tests location cascade logic for Province -> District -> SubDistrict -> Postal Code
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useThailandLocationCascade } from '../useThailandLocationCascade';

// Mock location helpers
jest.mock('../../../utils/thailand/LocationHelpers', () => ({
  findDistrictOption: jest.fn((province, district) => {
    if (province === 'Bangkok' && district === 'Phaya Thai') {
      return { id: 1001, nameEn: 'Phaya Thai', nameTh: 'พญาไท' };
    }
    return null;
  }),
  findSubDistrictOption: jest.fn((districtId, subDistrict) => {
    if (districtId === 1001 && subDistrict === 'Sam Sen Nai') {
      return { id: 100101, nameEn: 'Sam Sen Nai', nameTh: 'สามเสนใน', postalCode: '10400' };
    }
    return null;
  }),
}));

describe('useThailandLocationCascade', () => {
  let mockFormState;
  let mockHandleFieldBlur;
  let mockSaveDataToSecureStorage;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock form state
    mockFormState = {
      province: '',
      district: '',
      districtId: null,
      subDistrict: '',
      subDistrictId: null,
      postalCode: '',
      setProvince: jest.fn(),
      setDistrict: jest.fn(),
      setDistrictId: jest.fn(),
      setSubDistrict: jest.fn(),
      setSubDistrictId: jest.fn(),
      setPostalCode: jest.fn(),
    };

    mockHandleFieldBlur = jest.fn();
    mockSaveDataToSecureStorage = jest.fn().mockResolvedValue(true);
  });

  describe('District ID Updates', () => {
    it('should update district ID when province and district are set', async () => {
      mockFormState.province = 'Bangkok';
      mockFormState.district = 'Phaya Thai';
      mockFormState.districtId = null;

      const { result, waitForNextUpdate } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      // Wait for useEffect to run
      await act(async () => {
        await waitForNextUpdate();
      });

      expect(mockFormState.setDistrictId).toHaveBeenCalledWith(1001);
    });

    it('should set district ID to null when province is empty', async () => {
      mockFormState.province = '';
      mockFormState.district = '';
      mockFormState.districtId = 1001;

      const { result, waitForNextUpdate } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(mockFormState.setDistrictId).toHaveBeenCalledWith(null);
    });

    it('should not update district ID if already correct', async () => {
      mockFormState.province = 'Bangkok';
      mockFormState.district = 'Phaya Thai';
      mockFormState.districtId = 1001; // Already correct

      renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      // Should not call setDistrictId again if already correct
      expect(mockFormState.setDistrictId).not.toHaveBeenCalled();
    });
  });

  describe('SubDistrict ID and Postal Code Updates', () => {
    it('should update subdistrict ID and postal code when district ID and subdistrict are set', async () => {
      mockFormState.districtId = 1001;
      mockFormState.subDistrict = 'Sam Sen Nai';
      mockFormState.subDistrictId = null;
      mockFormState.postalCode = '';

      const { result, waitForNextUpdate } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(mockFormState.setSubDistrictId).toHaveBeenCalledWith(100101);
      expect(mockFormState.setPostalCode).toHaveBeenCalledWith('10400');
    });

    it('should not overwrite existing postal code', async () => {
      mockFormState.districtId = 1001;
      mockFormState.subDistrict = 'Sam Sen Nai';
      mockFormState.subDistrictId = null;
      mockFormState.postalCode = '10300'; // Already set

      const { result, waitForNextUpdate } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(mockFormState.setSubDistrictId).toHaveBeenCalledWith(100101);
      expect(mockFormState.setPostalCode).not.toHaveBeenCalled();
    });

    it('should set subdistrict ID to null when district ID is empty', async () => {
      mockFormState.districtId = null;
      mockFormState.subDistrict = '';
      mockFormState.subDistrictId = 100101;

      const { result, waitForNextUpdate } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(mockFormState.setSubDistrictId).toHaveBeenCalledWith(null);
    });
  });

  describe('handleProvinceSelect', () => {
    it('should set province and reset dependent fields', () => {
      mockFormState.district = 'Old District';
      mockFormState.subDistrict = 'Old SubDistrict';
      mockFormState.postalCode = '12345';

      const { result } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      act(() => {
        result.current.handleProvinceSelect('Bangkok');
      });

      expect(mockFormState.setProvince).toHaveBeenCalledWith('Bangkok');
      expect(mockFormState.setDistrict).toHaveBeenCalledWith('');
      expect(mockFormState.setDistrictId).toHaveBeenCalledWith(null);
      expect(mockFormState.setSubDistrict).toHaveBeenCalledWith('');
      expect(mockFormState.setSubDistrictId).toHaveBeenCalledWith(null);
      expect(mockFormState.setPostalCode).toHaveBeenCalledWith('');
    });

    it('should trigger field blur for province', () => {
      const { result } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      act(() => {
        result.current.handleProvinceSelect('Bangkok');
      });

      expect(mockHandleFieldBlur).toHaveBeenCalledWith('province', 'Bangkok');
    });

    it('should trigger field blur for cleared dependent fields', () => {
      mockFormState.district = 'Old District';
      mockFormState.subDistrict = 'Old SubDistrict';
      mockFormState.postalCode = '12345';

      const { result } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      act(() => {
        result.current.handleProvinceSelect('Bangkok');
      });

      expect(mockHandleFieldBlur).toHaveBeenCalledWith('district', '');
      expect(mockHandleFieldBlur).toHaveBeenCalledWith('subDistrict', '');
      expect(mockHandleFieldBlur).toHaveBeenCalledWith('postalCode', '');
    });
  });

  describe('handleDistrictSelect', () => {
    it('should set district and district ID', async () => {
      const selection = { id: 1001, nameEn: 'Phaya Thai', nameTh: 'พญาไท' };

      const { result } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      await act(async () => {
        await result.current.handleDistrictSelect(selection);
      });

      expect(mockFormState.setDistrict).toHaveBeenCalledWith('Phaya Thai');
      expect(mockFormState.setDistrictId).toHaveBeenCalledWith(1001);
    });

    it('should clear subdistrict and postal code when district changes', async () => {
      mockFormState.subDistrict = 'Old SubDistrict';
      mockFormState.postalCode = '12345';

      const selection = { id: 1001, nameEn: 'Phaya Thai', nameTh: 'พญาไท' };

      const { result } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      await act(async () => {
        await result.current.handleDistrictSelect(selection);
      });

      expect(mockFormState.setSubDistrict).toHaveBeenCalledWith('');
      expect(mockFormState.setSubDistrictId).toHaveBeenCalledWith(null);
      expect(mockFormState.setPostalCode).toHaveBeenCalledWith('');
    });

    it('should save data immediately with overrides', async () => {
      mockFormState.subDistrict = 'Old SubDistrict';
      mockFormState.postalCode = '12345';

      const selection = { id: 1001, nameEn: 'Phaya Thai', nameTh: 'พญาไท' };

      const { result } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      await act(async () => {
        await result.current.handleDistrictSelect(selection);
      });

      expect(mockSaveDataToSecureStorage).toHaveBeenCalledWith({
        district: 'Phaya Thai',
        subDistrict: '',
        postalCode: '',
      });
    });

    it('should handle null selection gracefully', async () => {
      const { result } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      await act(async () => {
        await result.current.handleDistrictSelect(null);
      });

      expect(mockFormState.setDistrict).not.toHaveBeenCalled();
    });
  });

  describe('handleSubDistrictSelect', () => {
    it('should set subdistrict, ID, and postal code', async () => {
      const selection = {
        id: 100101,
        nameEn: 'Sam Sen Nai',
        nameTh: 'สามเสนใน',
        postalCode: '10400',
      };

      const { result } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      await act(async () => {
        await result.current.handleSubDistrictSelect(selection);
      });

      expect(mockFormState.setSubDistrict).toHaveBeenCalledWith('Sam Sen Nai');
      expect(mockFormState.setSubDistrictId).toHaveBeenCalledWith(100101);
      expect(mockFormState.setPostalCode).toHaveBeenCalledWith('10400');
    });

    it('should save data immediately with new values', async () => {
      const selection = {
        id: 100101,
        nameEn: 'Sam Sen Nai',
        nameTh: 'สามเสนใน',
        postalCode: '10400',
      };

      const { result } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      await act(async () => {
        await result.current.handleSubDistrictSelect(selection);
      });

      expect(mockSaveDataToSecureStorage).toHaveBeenCalledWith({
        subDistrict: 'Sam Sen Nai',
        postalCode: '10400',
      });
    });

    it('should handle selection without postal code', async () => {
      const selection = {
        id: 100101,
        nameEn: 'Sam Sen Nai',
        nameTh: 'สามเสนใน',
        postalCode: null,
      };

      const { result } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      await act(async () => {
        await result.current.handleSubDistrictSelect(selection);
      });

      expect(mockFormState.setPostalCode).toHaveBeenCalledWith('');
    });

    it('should handle null selection gracefully', async () => {
      const { result } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      await act(async () => {
        await result.current.handleSubDistrictSelect(null);
      });

      expect(mockFormState.setSubDistrict).not.toHaveBeenCalled();
    });
  });

  describe('resetDistrictSelection', () => {
    it('should reset all district-dependent fields', () => {
      mockFormState.district = 'Phaya Thai';
      mockFormState.districtId = 1001;
      mockFormState.subDistrict = 'Sam Sen Nai';
      mockFormState.subDistrictId = 100101;
      mockFormState.postalCode = '10400';

      const { result } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      act(() => {
        result.current.resetDistrictSelection();
      });

      expect(mockFormState.setDistrict).toHaveBeenCalledWith('');
      expect(mockFormState.setDistrictId).toHaveBeenCalledWith(null);
      expect(mockFormState.setSubDistrict).toHaveBeenCalledWith('');
      expect(mockFormState.setSubDistrictId).toHaveBeenCalledWith(null);
      expect(mockFormState.setPostalCode).toHaveBeenCalledWith('');
    });
  });

  describe('Integration Tests', () => {
    it('should handle full location selection flow', async () => {
      const { result } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      // Step 1: Select province
      act(() => {
        result.current.handleProvinceSelect('Bangkok');
      });

      expect(mockFormState.setProvince).toHaveBeenCalledWith('Bangkok');

      // Step 2: Select district
      const districtSelection = { id: 1001, nameEn: 'Phaya Thai', nameTh: 'พญาไท' };
      await act(async () => {
        await result.current.handleDistrictSelect(districtSelection);
      });

      expect(mockFormState.setDistrict).toHaveBeenCalledWith('Phaya Thai');
      expect(mockFormState.setDistrictId).toHaveBeenCalledWith(1001);

      // Step 3: Select subdistrict
      const subDistrictSelection = {
        id: 100101,
        nameEn: 'Sam Sen Nai',
        nameTh: 'สามเสนใน',
        postalCode: '10400',
      };
      await act(async () => {
        await result.current.handleSubDistrictSelect(subDistrictSelection);
      });

      expect(mockFormState.setSubDistrict).toHaveBeenCalledWith('Sam Sen Nai');
      expect(mockFormState.setSubDistrictId).toHaveBeenCalledWith(100101);
      expect(mockFormState.setPostalCode).toHaveBeenCalledWith('10400');

      // Verify all saves were triggered
      expect(mockSaveDataToSecureStorage).toHaveBeenCalledTimes(2);
    });

    it('should handle changing province after full selection', async () => {
      // Initial full selection
      mockFormState.province = 'Bangkok';
      mockFormState.district = 'Phaya Thai';
      mockFormState.districtId = 1001;
      mockFormState.subDistrict = 'Sam Sen Nai';
      mockFormState.subDistrictId = 100101;
      mockFormState.postalCode = '10400';

      const { result } = renderHook(() =>
        useThailandLocationCascade({
          formState: mockFormState,
          handleFieldBlur: mockHandleFieldBlur,
          saveDataToSecureStorage: mockSaveDataToSecureStorage,
        })
      );

      // Change province - should reset everything
      act(() => {
        result.current.handleProvinceSelect('Chiang Mai');
      });

      expect(mockFormState.setProvince).toHaveBeenCalledWith('Chiang Mai');
      expect(mockFormState.setDistrict).toHaveBeenCalledWith('');
      expect(mockFormState.setDistrictId).toHaveBeenCalledWith(null);
      expect(mockFormState.setSubDistrict).toHaveBeenCalledWith('');
      expect(mockFormState.setSubDistrictId).toHaveBeenCalledWith(null);
      expect(mockFormState.setPostalCode).toHaveBeenCalledWith('');
    });
  });
});
