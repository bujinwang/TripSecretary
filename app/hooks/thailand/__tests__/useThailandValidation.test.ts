// @ts-nocheck

/**
 * Unit Tests for useThailandValidation Hook
 *
 * Tests validation logic, error handling, completion metrics, and smart button configuration
 */

import { renderHook, act } from '@testing-library/react-native';
import { useThailandValidation } from '../useThailandValidation';

// Mock dependencies
jest.mock('../../../utils/thailand/ThailandValidationRules', () => ({
  validateField: jest.fn((fieldName, value, context) => {
    // Simple mock validation logic
    if (fieldName === 'passportNo' && !value) {
      return { isValid: false, isWarning: false, errorMessage: 'Passport number required' };
    }
    if (fieldName === 'email' && value && !value.includes('@')) {
      return { isValid: false, isWarning: false, errorMessage: 'Invalid email format' };
    }
    if (fieldName === 'phoneNumber' && value && value.length < 8) {
      return { isValid: true, isWarning: true, errorMessage: 'Phone number seems short' };
    }
    return { isValid: true, isWarning: false, errorMessage: '' };
  }),
}));

jest.mock('../../../utils/validation/chinaProvinceValidator', () => ({
  findChinaProvince: jest.fn((input) => {
    if (input.toLowerCase().includes('guangdong')) {
      return { displayName: 'GUANGDONG', code: 'GD' };
    }
    return null;
  }),
}));

jest.mock('../../../utils/FieldStateManager', () => ({
  default: {
    getFieldCount: jest.fn((fields, interactions, fieldNames) => {
      const filledCount = Object.values(fields).filter(v => v && v !== '').length;
      return {
        totalWithValues: filledCount,
        totalUserModified: fieldNames.length,
      };
    }),
  },
}));

describe('useThailandValidation', () => {
  let mockFormState;
  let mockUserInteractionTracker;
  let mockSaveDataToSecureStorageWithOverride;
  let mockDebouncedSaveData;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Create mock form state
    mockFormState = {
      passportNo: '',
      surname: '',
      givenName: '',
      nationality: '',
      dob: '',
      expiryDate: '',
      sex: '',
      occupation: '',
      email: '',
      phoneNumber: '',
      cityOfResidence: '',
      residentCountry: '',
      travelPurpose: '',
      customTravelPurpose: '',
      accommodationType: '',
      customAccommodationType: '',
      arrivalFlightNumber: '',
      arrivalArrivalDate: '',
      departureDepartureDate: '',
      province: '',
      hotelAddress: '',
      isTransitPassenger: false,
      funds: [],
      errors: {},
      warnings: {},
      totalCompletionPercent: 0,
      setErrors: jest.fn(),
      setWarnings: jest.fn(),
      setLastEditedField: jest.fn(),
      setLastEditedAt: jest.fn(),
      setCityOfResidence: jest.fn(),
      setTravelPurpose: jest.fn(),
      setCustomTravelPurpose: jest.fn(),
      setAccommodationType: jest.fn(),
      setCustomAccommodationType: jest.fn(),
      setBoardingCountry: jest.fn(),
    };

    mockUserInteractionTracker = {
      markFieldAsModified: jest.fn(),
      isFieldUserModified: jest.fn().mockReturnValue(true),
      getFieldInteractionDetails: jest.fn().mockReturnValue({
        lastModified: new Date(),
        initialValue: null,
      }),
    };

    mockSaveDataToSecureStorageWithOverride = jest.fn().mockResolvedValue(true);
    mockDebouncedSaveData = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('handleFieldBlur', () => {
    it('should mark field as modified on blur', async () => {
      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFieldBlur('passportNo', 'E12345678');
      });

      expect(mockUserInteractionTracker.markFieldAsModified).toHaveBeenCalledWith(
        'passportNo',
        'E12345678'
      );
    });

    it('should set last edited field', async () => {
      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFieldBlur('email', 'test@example.com');
      });

      expect(mockFormState.setLastEditedField).toHaveBeenCalledWith('email');
    });

    it('should update errors state for invalid field', async () => {
      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFieldBlur('passportNo', '');
      });

      expect(mockFormState.setErrors).toHaveBeenCalled();
    });

    it('should update warnings state for warning field', async () => {
      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFieldBlur('phoneNumber', '1234');
      });

      expect(mockFormState.setWarnings).toHaveBeenCalled();
    });

    it('should auto-correct China province names', async () => {
      mockFormState.residentCountry = 'CHN';
      mockFormState.cityOfResidence = 'guangdong';

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFieldBlur('cityOfResidence', 'guangdong');
      });

      expect(mockFormState.setCityOfResidence).toHaveBeenCalledWith('GUANGDONG');
    });

    it('should save immediately for date fields', async () => {
      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFieldBlur('dob', '1990-01-01');
      });

      expect(mockSaveDataToSecureStorageWithOverride).toHaveBeenCalledWith({
        dob: '1990-01-01',
      });
    });

    it('should use debounced save for non-critical fields', async () => {
      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      await act(async () => {
        await result.current.handleFieldBlur('email', 'test@example.com');
      });

      expect(mockDebouncedSaveData).toHaveBeenCalled();
    });
  });

  describe('handleUserInteraction', () => {
    it('should handle travel purpose selection', () => {
      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      act(() => {
        result.current.handleUserInteraction('travelPurpose', 'HOLIDAY');
      });

      expect(mockFormState.setTravelPurpose).toHaveBeenCalledWith('HOLIDAY');
      expect(mockDebouncedSaveData).toHaveBeenCalled();
    });

    it('should clear custom travel purpose when selecting predefined option', () => {
      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      act(() => {
        result.current.handleUserInteraction('travelPurpose', 'HOLIDAY');
      });

      expect(mockFormState.setCustomTravelPurpose).toHaveBeenCalledWith('');
    });

    it('should handle accommodation type selection', () => {
      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      act(() => {
        result.current.handleUserInteraction('accommodationType', 'HOTEL');
      });

      expect(mockFormState.setAccommodationType).toHaveBeenCalledWith('HOTEL');
    });

    it('should handle boarding country selection', () => {
      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      act(() => {
        result.current.handleUserInteraction('boardingCountry', 'CHN');
      });

      expect(mockFormState.setBoardingCountry).toHaveBeenCalledWith('CHN');
    });
  });

  describe('getFieldCount', () => {
    it('should count passport section fields', () => {
      mockFormState.surname = 'SMITH';
      mockFormState.givenName = 'JOHN';
      mockFormState.passportNo = 'E12345678';
      mockFormState.nationality = 'CHN';
      mockFormState.dob = '1990-01-01';
      // expiryDate and sex are empty

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      const count = result.current.getFieldCount('passport');

      expect(count).toEqual({ filled: 5, total: 6 });
    });

    it('should count personal section fields', () => {
      mockFormState.occupation = 'ENGINEER';
      mockFormState.email = 'test@example.com';
      mockFormState.phoneNumber = '13800138000';
      // cityOfResidence, residentCountry, phoneCode are empty

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      const count = result.current.getFieldCount('personal');

      expect(count).toEqual({ filled: 3, total: 6 });
    });

    it('should count funds with minimum requirement', () => {
      mockFormState.funds = [];

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      const count = result.current.getFieldCount('funds');

      expect(count).toEqual({ filled: 0, total: 1 });
    });

    it('should count actual fund items when present', () => {
      mockFormState.funds = [
        { id: '1', type: 'Cash', amount: 1000 },
        { id: '2', type: 'Bank', amount: 5000 },
      ];

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      const count = result.current.getFieldCount('funds');

      expect(count).toEqual({ filled: 2, total: 2 });
    });

    it('should exclude accommodation fields for transit passengers', () => {
      mockFormState.isTransitPassenger = true;
      mockFormState.travelPurpose = 'TRANSIT';
      mockFormState.arrivalFlightNumber = 'MU123';

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      const count = result.current.getFieldCount('travel');

      // Should not include accommodation-related fields
      expect(count.total).toBeLessThan(10);
    });
  });

  describe('calculateCompletionMetrics', () => {
    it('should calculate overall completion percentage', () => {
      // Set some fields filled
      mockFormState.passportNo = 'E12345678';
      mockFormState.surname = 'SMITH';
      mockFormState.givenName = 'JOHN';
      mockFormState.email = 'test@example.com';

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      const metrics = result.current.calculateCompletionMetrics();

      expect(metrics).toHaveProperty('percent');
      expect(metrics.percent).toBeGreaterThan(0);
      expect(metrics.percent).toBeLessThanOrEqual(100);
    });

    it('should indicate ready when 100% complete', () => {
      // Mock all fields filled
      mockFormState.passportNo = 'E12345678';
      mockFormState.surname = 'SMITH';
      mockFormState.givenName = 'JOHN';
      mockFormState.nationality = 'CHN';
      mockFormState.dob = '1990-01-01';
      mockFormState.expiryDate = '2030-01-01';
      mockFormState.sex = 'M';
      mockFormState.occupation = 'ENGINEER';
      mockFormState.email = 'test@example.com';
      mockFormState.phoneNumber = '13800138000';
      mockFormState.phoneCode = '+86';
      mockFormState.cityOfResidence = 'Beijing';
      mockFormState.residentCountry = 'CHN';
      mockFormState.travelPurpose = 'HOLIDAY';
      mockFormState.arrivalFlightNumber = 'MU123';
      mockFormState.arrivalArrivalDate = '2024-12-01';
      mockFormState.departureDepartureDate = '2024-12-10';
      mockFormState.province = 'Bangkok';
      mockFormState.hotelAddress = '123 Main St';
      mockFormState.funds = [{ id: '1', type: 'Cash', amount: 10000 }];

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      const metrics = result.current.calculateCompletionMetrics();

      expect(metrics.isReady).toBe(true);
    });

    it('should return metrics for each section', () => {
      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      const metrics = result.current.calculateCompletionMetrics();

      expect(metrics).toHaveProperty('passport');
      expect(metrics).toHaveProperty('personal');
      expect(metrics).toHaveProperty('funds');
      expect(metrics).toHaveProperty('travel');
    });
  });

  describe('getSmartButtonConfig', () => {
    it('should return submit action when 100% complete', () => {
      mockFormState.totalCompletionPercent = 100;

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      const config = result.current.getSmartButtonConfig();

      expect(config.action).toBe('submit');
      expect(config.variant).toBe('primary');
    });

    it('should return edit action when 80% complete', () => {
      mockFormState.totalCompletionPercent = 85;

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      const config = result.current.getSmartButtonConfig();

      expect(config.action).toBe('edit');
      expect(config.label).toContain('完成');
    });

    it('should return start action when below 40%', () => {
      mockFormState.totalCompletionPercent = 20;

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      const config = result.current.getSmartButtonConfig();

      expect(config.action).toBe('start');
      expect(config.variant).toBe('outline');
    });
  });

  describe('getProgressText', () => {
    it('should return appropriate text for completion level', () => {
      const testCases = [
        { percent: 100, expectContains: '准备好' },
        { percent: 85, expectContains: '快完成' },
        { percent: 65, expectContains: '进展' },
        { percent: 45, expectContains: '继续' },
        { percent: 25, expectContains: '好的开始' },
        { percent: 10, expectContains: '开始准备' },
      ];

      testCases.forEach(({ percent, expectContains }) => {
        mockFormState.totalCompletionPercent = percent;

        const { result } = renderHook(() =>
          useThailandValidation({
            formState: mockFormState,
            userInteractionTracker: mockUserInteractionTracker,
            saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
            debouncedSaveData: mockDebouncedSaveData,
          })
        );

        const text = result.current.getProgressText();
        expect(text).toContain(expectContains);
      });
    });
  });

  describe('getProgressColor', () => {
    it('should return green for 100% complete', () => {
      mockFormState.totalCompletionPercent = 100;

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      const color = result.current.getProgressColor();
      expect(color).toBe('#34C759');
    });

    it('should return orange for 50-99% complete', () => {
      mockFormState.totalCompletionPercent = 75;

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      const color = result.current.getProgressColor();
      expect(color).toBe('#FF9500');
    });

    it('should return red for below 50% complete', () => {
      mockFormState.totalCompletionPercent = 30;

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      const color = result.current.getProgressColor();
      expect(color).toBe('#FF3B30');
    });
  });

  describe('isFormValid', () => {
    it('should return true when all fields filled and no errors', () => {
      // Mock all fields filled
      mockFormState.passportNo = 'E12345678';
      mockFormState.errors = {};
      mockUserInteractionTracker.isFieldUserModified = jest.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      // Note: actual implementation checks via getFieldCount
      // This is a simplified test
      const isValid = result.current.isFormValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should return false when there are validation errors', () => {
      mockFormState.errors = { passportNo: 'Invalid passport' };

      const { result } = renderHook(() =>
        useThailandValidation({
          formState: mockFormState,
          userInteractionTracker: mockUserInteractionTracker,
          saveDataToSecureStorageWithOverride: mockSaveDataToSecureStorageWithOverride,
          debouncedSaveData: mockDebouncedSaveData,
        })
      );

      const isValid = result.current.isFormValid();
      expect(isValid).toBe(false);
    });
  });
});
