/**
 * Unit Tests for useThailandFormState Hook
 *
 * Tests form state management, smart defaults, computed values, and utility functions
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useThailandFormState } from '../useThailandFormState';

// Mock phone code utility
jest.mock('../../../data/phoneCodes', () => ({
  getPhoneCode: jest.fn((nationality) => {
    if (nationality === 'CHN') return '+86';
    if (nationality === 'USA') return '+1';
    return '+00';
  }),
}));

describe('useThailandFormState', () => {
  describe('Initialization', () => {
    it('should initialize with default empty values', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      expect(result.current.passportNo).toBe('');
      expect(result.current.surname).toBe('');
      expect(result.current.givenName).toBe('');
      expect(result.current.nationality).toBe('');
    });

    it('should initialize with smart defaults for travel fields', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      expect(result.current.accommodationType).toBe('HOTEL');
      expect(result.current.arrivalArrivalDate).toBeTruthy();
      expect(result.current.departureDepartureDate).toBeTruthy();
    });

    it('should set phone code based on passport nationality', () => {
      const passport = { nationality: 'CHN' };
      const { result } = renderHook(() => useThailandFormState(passport));

      expect(result.current.phoneCode).toBe('+86');
    });

    it('should handle passport with USA nationality', () => {
      const passport = { nationality: 'USA' };
      const { result } = renderHook(() => useThailandFormState(passport));

      expect(result.current.phoneCode).toBe('+1');
    });
  });

  describe('Smart Defaults', () => {
    it('should generate arrival date for tomorrow', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const expectedDate = tomorrow.toISOString().split('T')[0];

      expect(result.current.arrivalArrivalDate).toBe(expectedDate);
    });

    it('should generate departure date for next week', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const expectedDate = nextWeek.toISOString().split('T')[0];

      expect(result.current.departureDepartureDate).toBe(expectedDate);
    });

    it('should set boarding country from passport nationality', () => {
      const passport = { nationality: 'CHN' };
      const { result } = renderHook(() => useThailandFormState(passport));

      expect(result.current.smartDefaults.boardingCountry).toBe('CHN');
    });
  });

  describe('State Setters', () => {
    it('should update passport number', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setPassportNo('E12345678');
      });

      expect(result.current.passportNo).toBe('E12345678');
    });

    it('should update name fields', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setSurname('SMITH');
        result.current.setGivenName('JOHN');
        result.current.setMiddleName('DAVID');
      });

      expect(result.current.surname).toBe('SMITH');
      expect(result.current.givenName).toBe('JOHN');
      expect(result.current.middleName).toBe('DAVID');
    });

    it('should update personal info fields', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setOccupation('SOFTWARE ENGINEER');
        result.current.setEmail('test@example.com');
        result.current.setPhoneNumber('13800138000');
      });

      expect(result.current.occupation).toBe('SOFTWARE ENGINEER');
      expect(result.current.email).toBe('test@example.com');
      expect(result.current.phoneNumber).toBe('13800138000');
    });

    it('should update travel info fields', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setTravelPurpose('HOLIDAY');
        result.current.setArrivalFlightNumber('MU123');
        result.current.setIsTransitPassenger(true);
      });

      expect(result.current.travelPurpose).toBe('HOLIDAY');
      expect(result.current.arrivalFlightNumber).toBe('MU123');
      expect(result.current.isTransitPassenger).toBe(true);
    });

    it('should update accommodation fields', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setAccommodationType('HOTEL');
        result.current.setProvince('Bangkok');
        result.current.setHotelAddress('123 Main St');
      });

      expect(result.current.accommodationType).toBe('HOTEL');
      expect(result.current.province).toBe('Bangkok');
      expect(result.current.hotelAddress).toBe('123 Main St');
    });
  });

  describe('Computed Values', () => {
    it('should compute isChineseResidence correctly', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setResidentCountry('CHN');
      });

      expect(result.current.isChineseResidence).toBe(true);

      act(() => {
        result.current.setResidentCountry('USA');
      });

      expect(result.current.isChineseResidence).toBe(false);
    });

    it('should provide correct city of residence label for China', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setResidentCountry('CHN');
      });

      expect(result.current.cityOfResidenceLabel).toBe('居住省份');
    });

    it('should provide correct city of residence label for non-China', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setResidentCountry('USA');
      });

      expect(result.current.cityOfResidenceLabel).toBe('居住省份 / 城市');
    });

    it('should provide correct help text for China residence', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setResidentCountry('CHN');
      });

      expect(result.current.cityOfResidenceHelpText).toContain('中国地址');
    });
  });

  describe('Funds Management', () => {
    it('should initialize with empty funds array', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      expect(result.current.funds).toEqual([]);
    });

    it('should add fund items', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      const fundItem = {
        id: 'fund1',
        type: 'Cash',
        amount: 10000,
        currency: 'THB',
      };

      act(() => {
        result.current.setFunds([fundItem]);
      });

      expect(result.current.funds).toHaveLength(1);
      expect(result.current.funds[0]).toEqual(fundItem);
    });

    it('should manage fund modal state', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      expect(result.current.fundItemModalVisible).toBe(false);

      act(() => {
        result.current.setFundItemModalVisible(true);
        result.current.setNewFundItemType('Cash');
      });

      expect(result.current.fundItemModalVisible).toBe(true);
      expect(result.current.newFundItemType).toBe('Cash');
    });
  });

  describe('UI State Management', () => {
    it('should manage errors state', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      const errors = { passportNo: 'Invalid passport number' };

      act(() => {
        result.current.setErrors(errors);
      });

      expect(result.current.errors).toEqual(errors);
    });

    it('should manage warnings state', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      const warnings = { email: 'Email format looks unusual' };

      act(() => {
        result.current.setWarnings(warnings);
      });

      expect(result.current.warnings).toEqual(warnings);
    });

    it('should track loading state', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setIsLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should track expanded section', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setExpandedSection('passport');
      });

      expect(result.current.expandedSection).toBe('passport');
    });

    it('should track last edited field', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setLastEditedField('passportNo');
      });

      expect(result.current.lastEditedField).toBe('passportNo');
    });

    it('should track scroll position', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setScrollPosition(150);
      });

      expect(result.current.scrollPosition).toBe(150);
    });
  });

  describe('Save State Management', () => {
    it('should manage save status', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setSaveStatus('saving');
      });

      expect(result.current.saveStatus).toBe('saving');

      act(() => {
        result.current.setSaveStatus('saved');
      });

      expect(result.current.saveStatus).toBe('saved');
    });

    it('should track last edited timestamp', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      const now = new Date();

      act(() => {
        result.current.setLastEditedAt(now);
      });

      expect(result.current.lastEditedAt).toEqual(now);
    });
  });

  describe('Completion Tracking', () => {
    it('should initialize with zero completion', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      expect(result.current.totalCompletionPercent).toBe(0);
    });

    it('should update completion metrics', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      const metrics = {
        passport: { filled: 5, total: 6 },
        personal: { filled: 4, total: 6 },
        funds: { filled: 1, total: 1 },
        travel: { filled: 7, total: 10 },
        percent: 73,
      };

      act(() => {
        result.current.setCompletionMetrics(metrics);
        result.current.setTotalCompletionPercent(73);
      });

      expect(result.current.completionMetrics).toEqual(metrics);
      expect(result.current.totalCompletionPercent).toBe(73);
    });
  });

  describe('Document Photos', () => {
    it('should manage flight ticket photo', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      const photoUri = 'file:///path/to/ticket.jpg';

      act(() => {
        result.current.setFlightTicketPhoto(photoUri);
      });

      expect(result.current.flightTicketPhoto).toBe(photoUri);
    });

    it('should manage departure flight ticket photo', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      const photoUri = 'file:///path/to/departure.jpg';

      act(() => {
        result.current.setDepartureFlightTicketPhoto(photoUri);
      });

      expect(result.current.departureFlightTicketPhoto).toBe(photoUri);
    });

    it('should manage hotel reservation photo', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      const photoUri = 'file:///path/to/hotel.jpg';

      act(() => {
        result.current.setHotelReservationPhoto(photoUri);
      });

      expect(result.current.hotelReservationPhoto).toBe(photoUri);
    });
  });

  describe('resetFormState', () => {
    it('should reset all form fields to default', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      // Set some values
      act(() => {
        result.current.setPassportNo('E12345678');
        result.current.setSurname('SMITH');
        result.current.setEmail('test@example.com');
        result.current.setTravelPurpose('BUSINESS');
        result.current.setProvince('Bangkok');
      });

      // Verify they were set
      expect(result.current.passportNo).toBe('E12345678');
      expect(result.current.surname).toBe('SMITH');

      // Reset
      act(() => {
        result.current.resetFormState();
      });

      // Verify everything is reset
      expect(result.current.passportNo).toBe('');
      expect(result.current.surname).toBe('');
      expect(result.current.email).toBe('');
      expect(result.current.travelPurpose).toBe('');
      expect(result.current.province).toBe('');
    });

    it('should preserve smart defaults after reset', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.resetFormState();
      });

      expect(result.current.accommodationType).toBe('HOTEL');
      expect(result.current.arrivalArrivalDate).toBeTruthy();
      expect(result.current.departureDepartureDate).toBeTruthy();
    });

    it('should reset UI state', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setErrors({ passportNo: 'Error' });
        result.current.setWarnings({ email: 'Warning' });
        result.current.setExpandedSection('passport');
        result.current.setLastEditedField('passportNo');
      });

      act(() => {
        result.current.resetFormState();
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.warnings).toEqual({});
      expect(result.current.expandedSection).toBeNull();
      expect(result.current.lastEditedField).toBeNull();
    });
  });

  describe('getFormValues', () => {
    it('should return all form values as object', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setPassportNo('E12345678');
        result.current.setSurname('SMITH');
        result.current.setGivenName('JOHN');
        result.current.setEmail('john@example.com');
      });

      const formValues = result.current.getFormValues();

      expect(formValues.passportNo).toBe('E12345678');
      expect(formValues.surname).toBe('SMITH');
      expect(formValues.givenName).toBe('JOHN');
      expect(formValues.email).toBe('john@example.com');
    });

    it('should include all field categories', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      const formValues = result.current.getFormValues();

      // Check passport fields exist
      expect(formValues).toHaveProperty('passportNo');
      expect(formValues).toHaveProperty('nationality');

      // Check personal info fields exist
      expect(formValues).toHaveProperty('occupation');
      expect(formValues).toHaveProperty('email');

      // Check travel fields exist
      expect(formValues).toHaveProperty('travelPurpose');
      expect(formValues).toHaveProperty('arrivalFlightNumber');

      // Check accommodation fields exist
      expect(formValues).toHaveProperty('accommodationType');
      expect(formValues).toHaveProperty('province');

      // Check funds exist
      expect(formValues).toHaveProperty('funds');
    });

    it('should return current values for all fields', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setOccupation('ENGINEER');
        result.current.setTravelPurpose('HOLIDAY');
        result.current.setAccommodationType('HOTEL');
        result.current.setFunds([{ id: '1', type: 'Cash', amount: 1000 }]);
      });

      const formValues = result.current.getFormValues();

      expect(formValues.occupation).toBe('ENGINEER');
      expect(formValues.travelPurpose).toBe('HOLIDAY');
      expect(formValues.accommodationType).toBe('HOTEL');
      expect(formValues.funds).toHaveLength(1);
    });
  });

  describe('Location Cascade Fields', () => {
    it('should manage province, district, subdistrict cascade', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      act(() => {
        result.current.setProvince('Bangkok');
        result.current.setDistrict('Phaya Thai');
        result.current.setDistrictId(1001);
        result.current.setSubDistrict('Sam Sen Nai');
        result.current.setSubDistrictId(100101);
        result.current.setPostalCode('10400');
      });

      expect(result.current.province).toBe('Bangkok');
      expect(result.current.district).toBe('Phaya Thai');
      expect(result.current.districtId).toBe(1001);
      expect(result.current.subDistrict).toBe('Sam Sen Nai');
      expect(result.current.subDistrictId).toBe(100101);
      expect(result.current.postalCode).toBe('10400');
    });
  });

  describe('Data Model State', () => {
    it('should manage data model references', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      const passportData = { id: 'p1', passportNo: 'E12345678' };
      const personalInfoData = { id: 'pi1', occupation: 'ENGINEER' };
      const entryData = { id: 'e1', destination: 'thailand' };

      act(() => {
        result.current.setPassportData(passportData);
        result.current.setPersonalInfoData(personalInfoData);
        result.current.setEntryData(entryData);
        result.current.setEntryInfoId('ei1');
      });

      expect(result.current.passportData).toEqual(passportData);
      expect(result.current.personalInfoData).toEqual(personalInfoData);
      expect(result.current.entryData).toEqual(entryData);
      expect(result.current.entryInfoId).toBe('ei1');
    });

    it('should track entry info initialization', () => {
      const { result } = renderHook(() => useThailandFormState(null));

      expect(result.current.entryInfoInitialized).toBe(false);

      act(() => {
        result.current.setEntryInfoInitialized(true);
      });

      expect(result.current.entryInfoInitialized).toBe(true);
    });
  });
});
