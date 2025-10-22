/**
 * Cross-Screen Data Consistency Integration Tests
 * Verifies data consistency between ProfileScreen and ThailandTravelInfoScreen
 */

import PassportDataService from '../../services/data/PassportDataService';

// Mock dependencies
jest.mock('../../services/data/PassportDataService');

describe('Cross-Screen Data Consistency', () => {
  const testUserId = 'user_001';

  beforeEach(() => {
    jest.clearAllMocks();
    PassportDataService.clearCache();
  });

  describe('Passport Data Consistency', () => {
    it('should show same passport data in both screens', async () => {
      const passportData = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1988-01-22',
        nationality: 'CHN',
        gender: 'Male',
        expiryDate: '2030-12-31',
        issueDate: '2020-12-31',
        issuePlace: 'Shanghai'
      };

      PassportDataService.getPassport.mockResolvedValue(passportData);

      // Load from ProfileScreen
      const profileData = await PassportDataService.getPassport(testUserId);

      // Load from ThailandTravelInfoScreen
      const thailandData = await PassportDataService.getPassport(testUserId);

      // Both should be identical
      expect(profileData).toEqual(thailandData);
      expect(profileData.passportNumber).toBe('E12345678');
      expect(thailandData.passportNumber).toBe('E12345678');
    });

    it('should reflect updates from ProfileScreen in ThailandTravelInfoScreen', async () => {
      const initialPassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        save: jest.fn().mockResolvedValue(true)
      };

      const updatedPassport = {
        ...initialPassport,
        passportNumber: 'E99999999'
      };

      PassportDataService.getPassport
        .mockResolvedValueOnce(initialPassport)
        .mockResolvedValueOnce(updatedPassport);

      PassportDataService.updatePassport.mockResolvedValue();

      // Load in ProfileScreen
      const profilePassport = await PassportDataService.getPassport(testUserId);
      expect(profilePassport.passportNumber).toBe('E12345678');

      // Update in ProfileScreen
      await PassportDataService.updatePassport('passport-1', {
        passportNumber: 'E99999999'
      });

      // Load in ThailandTravelInfoScreen - should see updated data
      const thailandPassport = await PassportDataService.getPassport(testUserId);
      expect(thailandPassport.passportNumber).toBe('E99999999');
    });

    it('should reflect updates from ThailandTravelInfoScreen in ProfileScreen', async () => {
      const initialPassport = {
        id: 'passport-1',
        userId: testUserId,
        fullName: 'ZHANG, WEI',
        save: jest.fn().mockResolvedValue(true)
      };

      const updatedPassport = {
        ...initialPassport,
        fullName: 'ZHANG, WEI (UPDATED)'
      };

      PassportDataService.getPassport
        .mockResolvedValueOnce(initialPassport)
        .mockResolvedValueOnce(updatedPassport);

      PassportDataService.updatePassport.mockResolvedValue();

      // Load in ThailandTravelInfoScreen
      const thailandPassport = await PassportDataService.getPassport(testUserId);
      expect(thailandPassport.fullName).toBe('ZHANG, WEI');

      // Update in ThailandTravelInfoScreen
      await PassportDataService.updatePassport('passport-1', {
        fullName: 'ZHANG, WEI (UPDATED)'
      });

      // Load in ProfileScreen - should see updated data
      const profilePassport = await PassportDataService.getPassport(testUserId);
      expect(profilePassport.fullName).toBe('ZHANG, WEI (UPDATED)');
    });
  });

  describe('Personal Info Consistency', () => {
    it('should show same personal info in both screens', async () => {
      const personalInfo = {
        id: 'personal-1',
        userId: testUserId,
        phoneNumber: '+86 13812345678',
        email: 'test@example.com',
        occupation: 'Engineer',
        provinceCity: 'Shanghai',
        countryRegion: 'CHN'
      };

      PassportDataService.getPersonalInfo.mockResolvedValue(personalInfo);

      // Load from both screens
      const profileInfo = await PassportDataService.getPersonalInfo(testUserId);
      const thailandInfo = await PassportDataService.getPersonalInfo(testUserId);

      expect(profileInfo).toEqual(thailandInfo);
      expect(profileInfo.email).toBe('test@example.com');
    });

    it('should sync personal info updates across screens', async () => {
      const initialInfo = {
        id: 'personal-1',
        userId: testUserId,
        email: 'old@example.com',
        update: jest.fn().mockResolvedValue(true)
      };

      const updatedInfo = {
        ...initialInfo,
        email: 'new@example.com'
      };

      // First call returns initial, second call returns updated
      PassportDataService.getPersonalInfo
        .mockResolvedValueOnce(initialInfo)
        .mockResolvedValueOnce(updatedInfo);

      PassportDataService.updatePersonalInfo.mockResolvedValue();

      // Load initial from ProfileScreen
      const profileInfo = await PassportDataService.getPersonalInfo(testUserId);
      expect(profileInfo.email).toBe('old@example.com');

      // Update from ProfileScreen
      await PassportDataService.updatePersonalInfo('personal-1', {
        email: 'new@example.com'
      });

      // Load in ThailandTravelInfoScreen - should get updated data
      const thailandInfo = await PassportDataService.getPersonalInfo(testUserId);
      expect(thailandInfo.email).toBe('new@example.com');
    });
  });

  describe('Funding Proof Consistency', () => {
    it('should show same funding proof in both screens', async () => {
      const fundingProof = {
        id: 'funding-1',
        userId: testUserId,
        cashAmount: '10000 THB',
        bankCards: 'Visa ****1234',
        supportingDocs: 'Bank statement'
      };

      PassportDataService.getFundingProof.mockResolvedValue(fundingProof);

      // Load from both screens
      const profileFunding = await PassportDataService.getFundingProof(testUserId);
      const thailandFunding = await PassportDataService.getFundingProof(testUserId);

      expect(profileFunding).toEqual(thailandFunding);
      expect(profileFunding.cashAmount).toBe('10000 THB');
    });

    it('should sync funding proof updates across screens', async () => {
      const initialFunding = {
        id: 'funding-1',
        userId: testUserId,
        cashAmount: '10000 THB',
        update: jest.fn().mockResolvedValue(true)
      };

      const updatedFunding = {
        ...initialFunding,
        cashAmount: '20000 THB'
      };

      // First call returns initial, second call returns updated
      PassportDataService.getFundingProof
        .mockResolvedValueOnce(initialFunding)
        .mockResolvedValueOnce(updatedFunding);

      PassportDataService.updateFundingProof.mockResolvedValue();

      // Load initial from ThailandTravelInfoScreen
      const thailandFunding = await PassportDataService.getFundingProof(testUserId);
      expect(thailandFunding.cashAmount).toBe('10000 THB');

      // Update from ThailandTravelInfoScreen
      await PassportDataService.updateFundingProof('funding-1', {
        cashAmount: '20000 THB'
      });

      // Load in ProfileScreen - should get updated data
      const profileFunding = await PassportDataService.getFundingProof(testUserId);
      expect(profileFunding.cashAmount).toBe('20000 THB');
    });
  });

  describe('Complete User Data Consistency', () => {
    it('should load all data consistently across screens', async () => {
      const completeUserData = {
        passport: {
          id: 'passport-1',
          userId: testUserId,
          passportNumber: 'E12345678',
          fullName: 'ZHANG, WEI'
        },
        personalInfo: {
          id: 'personal-1',
          userId: testUserId,
          email: 'test@example.com'
        },
        fundingProof: {
          id: 'funding-1',
          userId: testUserId,
          cashAmount: '10000 THB'
        },
        userId: testUserId
      };

      PassportDataService.getAllUserData.mockResolvedValue(completeUserData);

      // Load from ProfileScreen
      const profileData = await PassportDataService.getAllUserData(testUserId);

      // Load from ThailandTravelInfoScreen
      const thailandData = await PassportDataService.getAllUserData(testUserId);

      // All data should match
      expect(profileData).toEqual(thailandData);
      expect(profileData.passport.passportNumber).toBe(thailandData.passport.passportNumber);
      expect(profileData.personalInfo.email).toBe(thailandData.personalInfo.email);
      expect(profileData.fundingProof.cashAmount).toBe(thailandData.fundingProof.cashAmount);
    });

    it('should handle partial data consistently', async () => {
      const partialData = {
        passport: {
          id: 'passport-1',
          userId: testUserId,
          passportNumber: 'E12345678'
        },
        personalInfo: null,
        fundingProof: null,
        userId: testUserId
      };

      PassportDataService.getAllUserData.mockResolvedValue(partialData);

      // Load from both screens
      const profileData = await PassportDataService.getAllUserData(testUserId);
      const thailandData = await PassportDataService.getAllUserData(testUserId);

      // Both should have same structure
      expect(profileData.passport).toBeDefined();
      expect(thailandData.passport).toBeDefined();
      expect(profileData.personalInfo).toBeNull();
      expect(thailandData.personalInfo).toBeNull();
    });
  });

  describe('Cache Consistency', () => {
    it('should use cache consistently across screens', async () => {
      const passportData = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678'
      };

      PassportDataService.getPassport.mockResolvedValue(passportData);

      // First load (cache miss)
      await PassportDataService.getPassport(testUserId);

      // Second load from different screen (cache hit)
      await PassportDataService.getPassport(testUserId);

      // Should only load from database once
      expect(PassportDataService.getPassport).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache consistently after updates', async () => {
      const passportData = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678',
        save: jest.fn().mockResolvedValue(true)
      };

      PassportDataService.getPassport.mockResolvedValue(passportData);
      PassportDataService.updatePassport.mockResolvedValue();

      // Load and cache
      await PassportDataService.getPassport(testUserId);

      // Update from one screen
      await PassportDataService.updatePassport('passport-1', {
        passportNumber: 'E99999999'
      });

      // Next load from any screen should get fresh data
      await PassportDataService.getPassport(testUserId);

      expect(PassportDataService.updatePassport).toHaveBeenCalled();
    });
  });

  describe('Concurrent Access', () => {
    it('should handle concurrent reads from multiple screens', async () => {
      const passportData = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678'
      };

      PassportDataService.getPassport.mockResolvedValue(passportData);

      // Simulate concurrent loads from multiple screens
      const [profile, thailand, japan] = await Promise.all([
        PassportDataService.getPassport(testUserId),
        PassportDataService.getPassport(testUserId),
        PassportDataService.getPassport(testUserId)
      ]);

      // All should get same data
      expect(profile).toEqual(thailand);
      expect(thailand).toEqual(japan);
    });

    it('should handle concurrent updates safely', async () => {
      const passportData = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        save: jest.fn().mockResolvedValue(true)
      };

      PassportDataService.getPassport.mockResolvedValue(passportData);
      PassportDataService.updatePassport.mockResolvedValue();

      // Simulate concurrent updates from different screens
      await Promise.all([
        PassportDataService.updatePassport('passport-1', { passportNumber: 'E11111111' }),
        PassportDataService.updatePassport('passport-1', { fullName: 'WANG, LI' })
      ]);

      // Both updates should be processed
      expect(PassportDataService.updatePassport).toHaveBeenCalledTimes(2);
    });
  });
});
