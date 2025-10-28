/**
 * Tests for TDACSubmissionService - Entry Info Creation with userId fix
 *
 * Verifies that entry info creation properly uses userId from travelerInfo
 * and doesn't default to 'current_user' (Bug fix from 2025-10-28)
 */

// Mock UserDataService before importing
const mockGetPassport = jest.fn();
const mockGetEntryInfo = jest.fn();
const mockSaveEntryInfo = jest.fn();
const mockSaveDigitalArrivalCard = jest.fn();

jest.mock('../../data/UserDataService', () => ({
  default: {
    getPassport: mockGetPassport,
    getEntryInfo: mockGetEntryInfo,
    saveEntryInfo: mockSaveEntryInfo,
    saveDigitalArrivalCard: mockSaveDigitalArrivalCard,
  }
}));

// Now import after mocks are set up
const TDACSubmissionService = require('../TDACSubmissionService').default;

describe('TDACSubmissionService - Entry Info Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreateEntryInfoId', () => {
    it('should use userId from travelerInfo to find entry info', async () => {
      // Arrange
      const travelerInfo = {
        userId: 'user_001',
        passportNo: 'A123434343',
        email: 'aaa@bbb.com'
      };

      const mockEntryInfo = {
        id: 'entry_1761348094096_5kg7bla7e',
        userId: 'user_001',
        destinationId: 'thailand',
        status: 'incomplete'
      };

      mockGetEntryInfo.mockResolvedValue(mockEntryInfo);

      // Act
      const entryInfoId = await TDACSubmissionService.findOrCreateEntryInfoId(travelerInfo);

      // Assert
      expect(entryInfoId).toBe('entry_1761348094096_5kg7bla7e');
      expect(mockGetEntryInfo).toHaveBeenCalledWith('user_001', 'thailand');

      console.log('✅ Test passed: Uses userId from travelerInfo to find entry info');
    });

    it('should create new entry info when none exists', async () => {
      // Arrange
      const travelerInfo = {
        userId: 'user_001',
        passportNo: 'A123434343'
      };

      const mockPassport = {
        id: 'passport_1761348123876_8a6sujvz4',
        passportNumber: 'A123434343',
        userId: 'user_001'
      };

      const mockNewEntryInfo = {
        id: 'entry_new_123',
        userId: 'user_001',
        destinationId: 'thailand',
        status: 'incomplete'
      };

      mockGetEntryInfo.mockResolvedValue(null); // No existing entry
      mockGetPassport.mockResolvedValue(mockPassport);
      mockSaveEntryInfo.mockResolvedValue(mockNewEntryInfo);

      // Act
      const entryInfoId = await TDACSubmissionService.findOrCreateEntryInfoId(travelerInfo);

      // Assert
      expect(entryInfoId).toBe('entry_new_123');
      expect(mockGetPassport).toHaveBeenCalledWith('user_001');
      expect(mockSaveEntryInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          destinationId: 'thailand',
          passportId: 'passport_1761348123876_8a6sujvz4',
          status: 'incomplete'
        }),
        'user_001'
      );

      console.log('✅ Test passed: Creates new entry info with correct userId');
    });

    it('should handle missing userId by defaulting to current_user', async () => {
      // Arrange
      const travelerInfo = {
        // userId is missing!
        passportNo: 'A123434343'
      };

      mockGetEntryInfo.mockResolvedValue(null);
      mockGetPassport.mockResolvedValue(null); // No passport for 'current_user'

      // Act
      const entryInfoId = await TDACSubmissionService.findOrCreateEntryInfoId(travelerInfo);

      // Assert
      expect(entryInfoId).toBeNull(); // Should return null when passport not found
      expect(mockGetPassport).toHaveBeenCalledWith('current_user');

      console.log('✅ Test passed: Defaults to current_user when userId missing');
      console.log('   NOTE: This is why the bug occurred - userId was missing from travelerInfo');
    });

    it('should return null when passport not found', async () => {
      // Arrange
      const travelerInfo = {
        userId: 'user_999', // User with no passport
        passportNo: 'X999999999'
      };

      mockGetEntryInfo.mockResolvedValue(null);
      mockGetPassport.mockResolvedValue(null); // No passport found

      // Act
      const entryInfoId = await TDACSubmissionService.findOrCreateEntryInfoId(travelerInfo);

      // Assert
      expect(entryInfoId).toBeNull();
      expect(mockGetPassport).toHaveBeenCalledWith('user_999');

      console.log('✅ Test passed: Returns null when passport not found');
    });
  });

  describe('handleTDACSubmissionSuccess', () => {
    it('should create digital arrival card when entryInfoId is found', async () => {
      // Arrange
      const submissionData = {
        arrCardNo: '387778D',
        submissionMethod: 'hybrid',
        qrUri: 'file://path/to/pdf.pdf',
        pdfPath: 'file://path/to/pdf.pdf',
        duration: '8.03s',
        travelerName: 'WOODY WANG',
        passportNo: 'A123434343',
        arrivalDate: '2025-10-29'
      };

      const travelerInfo = {
        userId: 'user_001', // ← THE FIX: userId is now included
        passportNo: 'A123434343',
        firstName: 'WOODY',
        familyName: 'WANG'
      };

      const mockEntryInfo = {
        id: 'entry_1761348094096_5kg7bla7e',
        userId: 'user_001'
      };

      const mockDigitalArrivalCard = {
        id: 'dac_123',
        entryInfoId: 'entry_1761348094096_5kg7bla7e',
        arrCardNo: '387778D'
      };

      mockGetEntryInfo.mockResolvedValue(mockEntryInfo);
      mockSaveDigitalArrivalCard.mockResolvedValue(mockDigitalArrivalCard);

      // Act
      const result = await TDACSubmissionService.handleTDACSubmissionSuccess(
        submissionData,
        travelerInfo
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.digitalArrivalCard).toBeDefined();
      expect(result.digitalArrivalCard.id).toBe('dac_123');
      expect(mockSaveDigitalArrivalCard).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_001',                // ← NOW INCLUDED
          entryInfoId: 'entry_1761348094096_5kg7bla7e',
          cardType: 'TDAC',
          arrCardNo: '387778D',
          qrUri: 'file://path/to/pdf.pdf',
          pdfUrl: 'file://path/to/pdf.pdf',
          submissionMethod: 'hybrid',
          status: 'success'
        })
      );

      console.log('✅ Test passed: Digital arrival card created with entryInfoId');
    });

    it('should handle case when entryInfoId is null gracefully', async () => {
      // Arrange
      const submissionData = {
        arrCardNo: '387778D',
        submissionMethod: 'hybrid',
        qrUri: 'file://path/to/pdf.pdf',
        pdfPath: 'file://path/to/pdf.pdf'
      };

      const travelerInfo = {
        // userId missing - will cause entryInfoId to be null
        passportNo: 'A123434343'
      };

      mockGetEntryInfo.mockResolvedValue(null);
      mockGetPassport.mockResolvedValue(null);

      // Act
      const result = await TDACSubmissionService.handleTDACSubmissionSuccess(
        submissionData,
        travelerInfo
      );

      // Assert
      expect(result.success).toBe(true); // Should still succeed
      expect(result.entryInfoId).toBeUndefined(); // But no entryInfoId
      expect(mockSaveDigitalArrivalCard).not.toHaveBeenCalled();

      console.log('✅ Test passed: Handles missing entryInfoId gracefully');
      console.log('   NOTE: This was the symptom of the bug - no digital arrival card created');
    });
  });

  describe('Bug regression prevention', () => {
    it('should prevent "User has no passport" error with correct userId', async () => {
      // This test documents the complete fix for the bug discovered on 2025-10-28
      //
      // BUG FLOW:
      // 1. ThailandTravelerContextBuilder.buildContext() didn't include userId
      // 2. TDACSubmissionService.findOrCreateEntryInfoId(travelerInfo) received no userId
      // 3. Defaulted to userId = 'current_user'
      // 4. mockGetPassport('current_user') returned null
      // 5. Error: "User has no passport, cannot create entry info"
      //
      // FIX:
      // - ThailandTravelerContextBuilder now includes userId in payload (line 94)
      // - TDACSubmissionService.findOrCreateEntryInfoId() receives correct userId

      const travelerInfo = {
        userId: 'user_001', // ← THE FIX
        passportNo: 'A123434343',
        firstName: 'WOODY',
        familyName: 'WANG'
      };

      const mockPassport = {
        id: 'passport_1761348123876_8a6sujvz4',
        passportNumber: 'A123434343',
        userId: 'user_001'
      };

      const mockNewEntryInfo = {
        id: 'entry_new_123',
        userId: 'user_001'
      };

      mockGetEntryInfo.mockResolvedValue(null);
      mockGetPassport.mockResolvedValue(mockPassport);
      mockSaveEntryInfo.mockResolvedValue(mockNewEntryInfo);

      // Act
      const entryInfoId = await TDACSubmissionService.findOrCreateEntryInfoId(travelerInfo);

      // Assert - The fix prevents the error
      expect(entryInfoId).toBe('entry_new_123');
      expect(mockGetPassport).toHaveBeenCalledWith('user_001');
      expect(mockGetPassport).not.toHaveBeenCalledWith('current_user');

      console.log('✅ Bug regression test passed: Correct userId prevents passport lookup error');
      console.log('   Before fix: getPassport(\'current_user\') → null → Error');
      console.log('   After fix: getPassport(\'user_001\') → passport found → Success');
    });
  });
});
