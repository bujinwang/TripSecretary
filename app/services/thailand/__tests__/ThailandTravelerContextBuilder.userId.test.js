/**
 * Tests for ThailandTravelerContextBuilder - userId inclusion fix
 *
 * Verifies that userId is properly included in the traveler payload
 * for post-submission entry info creation (Bug fix from 2025-10-28)
 */

// Mock UserDataService before importing
const mockGetAllUserData = jest.fn();
const mockGetFundItems = jest.fn();

jest.mock('../../data/UserDataService', () => ({
  default: {
    getAllUserData: mockGetAllUserData,
    getFundItems: mockGetFundItems,
  }
}));

// Now import after mocks are set up
const ThailandTravelerContextBuilder = require('../ThailandTravelerContextBuilder').default;

describe('ThailandTravelerContextBuilder - userId inclusion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildContext', () => {
    it('should include userId in the traveler payload', async () => {
      // Arrange
      const userId = 'user_001';
      const mockUserData = {
        passport: {
          passportNumber: 'A123434343',
          fullName: 'WANG, A, WOODY',
          nationality: 'CHN',
          dateOfBirth: '1995-01-01',
          expiryDate: '2035-01-01',
          gender: 'Male'
        },
        personalInfo: {
          email: 'aaa@bbb.com',
          phoneCode: '+86',
          phoneNumber: '13543433434',
          occupation: 'CIVIL SERVANT',
          provinceCity: 'GUANGDONG',
          countryRegion: 'CHN'
        }
      };

      const mockTravelInfo = {
        arrivalFlightNumber: 'AC111',
        arrivalArrivalDate: '2025-10-29',
        departureFlightNumber: 'AC222',
        departureDepartureDate: '2025-11-04',
        travelPurpose: 'HOLIDAY',
        boardingCountry: 'CHN',
        recentStayCountry: 'CHN',
        accommodationType: 'HOTEL',
        province: 'BANGKOK',
        hotelAddress: 'HILTON ACACIAS'
      };

      mockGetAllUserData.mockResolvedValue(mockUserData);
      mockGetFundItems.mockResolvedValue([
        { type: 'BANK_CARD', photoUri: 'file://...' }
      ]);

      // Mock getTravelInfoWithFallback
      ThailandTravelerContextBuilder.getTravelInfoWithFallback = jest.fn()
        .mockResolvedValue(mockTravelInfo);

      // Act
      const result = await ThailandTravelerContextBuilder.buildContext(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload.userId).toBe('user_001');

      console.log('✅ Test passed: userId is included in traveler payload');
    });

    it('should use provided userId and not default to undefined', async () => {
      // Arrange
      const userId = 'test_user_123';
      const mockUserData = {
        passport: {
          passportNumber: 'B987654321',
          fullName: 'TEST USER',
          nationality: 'USA',
          dateOfBirth: '1990-05-15',
          expiryDate: '2030-05-15',
          gender: 'Female'
        },
        personalInfo: {
          email: 'test@example.com',
          phoneCode: '+1',
          phoneNumber: '5551234567',
          occupation: 'ENGINEER',
          provinceCity: 'CALIFORNIA',
          countryRegion: 'USA'
        }
      };

      const mockTravelInfo = {
        arrivalFlightNumber: 'UA100',
        arrivalArrivalDate: '2025-11-15',
        travelPurpose: 'BUSINESS',
        boardingCountry: 'USA',
        recentStayCountry: 'USA',
        accommodationType: 'HOTEL',
        province: 'BANGKOK'
      };

      mockGetAllUserData.mockResolvedValue(mockUserData);
      mockGetFundItems.mockResolvedValue([]);
      ThailandTravelerContextBuilder.getTravelInfoWithFallback = jest.fn()
        .mockResolvedValue(mockTravelInfo);

      // Act
      const result = await ThailandTravelerContextBuilder.buildContext(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.payload.userId).toBe('test_user_123');
      expect(result.payload.userId).not.toBeUndefined();
      expect(result.payload.userId).not.toBe('current_user');

      console.log('✅ Test passed: Correct userId used, not defaulting to undefined');
    });

    it('should pass userId to post-submission handlers', async () => {
      // Arrange
      const userId = 'user_001';
      const mockUserData = {
        passport: {
          passportNumber: 'A123434343',
          fullName: 'WANG, A, WOODY',
          nationality: 'CHN',
          dateOfBirth: '1995-01-01',
          expiryDate: '2035-01-01',
          gender: 'Male'
        },
        personalInfo: {
          email: 'aaa@bbb.com',
          phoneCode: '+86',
          phoneNumber: '13543433434',
          occupation: 'CIVIL SERVANT',
          provinceCity: 'GUANGDONG',
          countryRegion: 'CHN'
        }
      };

      const mockTravelInfo = {
        arrivalFlightNumber: 'AC111',
        arrivalArrivalDate: '2025-10-29',
        travelPurpose: 'HOLIDAY',
        boardingCountry: 'CHN',
        recentStayCountry: 'CHN',
        accommodationType: 'HOTEL',
        province: 'BANGKOK'
      };

      mockGetAllUserData.mockResolvedValue(mockUserData);
      mockGetFundItems.mockResolvedValue([]);
      ThailandTravelerContextBuilder.getTravelInfoWithFallback = jest.fn()
        .mockResolvedValue(mockTravelInfo);

      // Act
      const result = await ThailandTravelerContextBuilder.buildContext(userId);

      // Assert - Verify payload can be used for entry info creation
      expect(result.payload.userId).toBe('user_001');
      expect(result.payload.passportNo).toBe('A123434343');
      expect(result.payload.email).toBe('aaa@bbb.com');

      // This payload would be passed to TDACSubmissionService.handleTDACSubmissionSuccess
      // which calls findOrCreateEntryInfoId(travelerInfo)
      // The travelerInfo MUST have userId for entry info creation to work

      console.log('✅ Test passed: Payload contains userId for entry info creation');
    });
  });

  describe('Bug regression prevention', () => {
    it('should prevent the "User has no passport" error by including userId', async () => {
      // This test documents the bug that was fixed on 2025-10-28
      //
      // BUG: travelerPayload did not include userId
      // SYMPTOM: TDACSubmissionService.findOrCreateEntryInfoId() defaulted to 'current_user'
      //          which caused "User has no passport, cannot create entry info" error
      // FIX: Added userId to travelerPayload in ThailandTravelerContextBuilder.js:94

      const userId = 'user_001';
      const mockUserData = {
        passport: {
          passportNumber: 'A123434343',
          fullName: 'WANG, A, WOODY',
          nationality: 'CHN',
          dateOfBirth: '1995-01-01',
          expiryDate: '2035-01-01',
          gender: 'Male'
        },
        personalInfo: {
          email: 'aaa@bbb.com',
          phoneCode: '+86',
          phoneNumber: '13543433434',
          occupation: 'CIVIL SERVANT',
          provinceCity: 'GUANGDONG',
          countryRegion: 'CHN'
        }
      };

      const mockTravelInfo = {
        arrivalFlightNumber: 'AC111',
        arrivalArrivalDate: '2025-10-29',
        travelPurpose: 'HOLIDAY',
        boardingCountry: 'CHN',
        recentStayCountry: 'CHN',
        accommodationType: 'HOTEL',
        province: 'BANGKOK'
      };

      mockGetAllUserData.mockResolvedValue(mockUserData);
      mockGetFundItems.mockResolvedValue([]);
      ThailandTravelerContextBuilder.getTravelInfoWithFallback = jest.fn()
        .mockResolvedValue(mockTravelInfo);

      // Act
      const result = await ThailandTravelerContextBuilder.buildContext(userId);

      // Assert - The fix
      expect(result.payload.userId).toBeDefined();
      expect(result.payload.userId).toBe(userId);
      expect(result.payload.userId).not.toBe('current_user');

      console.log('✅ Bug regression test passed: userId is properly included');
      console.log('   This prevents: "User has no passport, cannot create entry info" error');
    });
  });
});
