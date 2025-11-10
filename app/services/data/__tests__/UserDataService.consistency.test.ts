// @ts-nocheck

/**
 * 入境通 - UserDataService Consistency Tests
 * Tests for data consistency validation and conflict resolution
 */

import UserDataService from '../UserDataService';
import Passport from '../../../models/Passport';
import PersonalInfo from '../../../models/PersonalInfo';
// FundingProof removed - tests updated to focus on passport and personal info
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../../../models/Passport');
jest.mock('../../../models/PersonalInfo');
// FundingProof mock removed
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../security/SecureStorageService');

describe('UserDataService - Data Consistency Validation', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    UserDataService.clearCache();
  });

  describe('validateDataConsistency', () => {
    it('should validate consistent data successfully', async () => {
      // Mock valid data
      const mockPassport = {
        id: 'passport-1',
        userId: mockUserId,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1988-01-22',
        nationality: 'CHN',
        gender: 'Male',
        expiryDate: '2030-12-31',
        issueDate: '2020-12-31',
        issuePlace: 'Shanghai'
      };

      const mockPersonalInfo = {
        id: 'personal-1',
        userId: mockUserId,
        phoneNumber: '+86 13812345678',
        email: 'test@example.com',
        homeAddress: '123 Main St',
        occupation: 'Engineer',
        provinceCity: 'Shanghai',
        countryRegion: 'CHN'
      };

      // mockFundingProof removed

      // Mock getAllUserData
      jest.spyOn(UserDataService, 'getAllUserData').mockResolvedValue({
        passport: mockPassport,
        personalInfo: mockPersonalInfo,
        // fundingProof removed
        userId: mockUserId
      });

      const result = await UserDataService.validateDataConsistency(mockUserId);

      expect(result.isConsistent).toBe(true);
      expect(result.passport.valid).toBe(true);
      expect(result.personalInfo.valid).toBe(true);
      // fundingProof validation removed
      expect(result.crossFieldValidation.valid).toBe(true);
    });

    it('should detect missing required passport fields', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: mockUserId,
        passportNumber: '', // Missing
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1988-01-22',
        nationality: '', // Missing
        gender: 'Male',
        expiryDate: '2030-12-31'
      };

      jest.spyOn(UserDataService, 'getAllUserData').mockResolvedValue({
        passport: mockPassport,
        personalInfo: null,
        fundingProof: null,
        userId: mockUserId
      });

      const result = await UserDataService.validateDataConsistency(mockUserId);

      expect(result.isConsistent).toBe(false);
      expect(result.passport.valid).toBe(false);
      expect(result.passport.errors).toContain('Missing required field: passportNumber');
      expect(result.passport.errors).toContain('Missing required field: nationality');
    });

    it('should detect invalid date formats', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: mockUserId,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: 'invalid-date',
        nationality: 'CHN',
        gender: 'Male',
        expiryDate: '2030-12-31',
        issueDate: '2020-12-31'
      };

      jest.spyOn(UserDataService, 'getAllUserData').mockResolvedValue({
        passport: mockPassport,
        personalInfo: null,
        fundingProof: null,
        userId: mockUserId
      });

      const result = await UserDataService.validateDataConsistency(mockUserId);

      expect(result.isConsistent).toBe(false);
      expect(result.passport.valid).toBe(false);
      expect(result.passport.errors).toContain('Invalid date of birth format');
    });

    it('should detect invalid date logic', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: mockUserId,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1988-01-22',
        nationality: 'CHN',
        gender: 'Male',
        expiryDate: '2020-12-31',
        issueDate: '2025-12-31' // Issue after expiry
      };

      jest.spyOn(UserDataService, 'getAllUserData').mockResolvedValue({
        passport: mockPassport,
        personalInfo: null,
        fundingProof: null,
        userId: mockUserId
      });

      const result = await UserDataService.validateDataConsistency(mockUserId);

      expect(result.isConsistent).toBe(false);
      expect(result.passport.valid).toBe(false);
      expect(result.passport.errors).toContain('Issue date must be before expiry date');
    });

    it('should detect invalid email format', async () => {
      const mockPersonalInfo = {
        id: 'personal-1',
        userId: mockUserId,
        phoneNumber: '+86 13812345678',
        email: 'invalid-email', // Invalid format
        homeAddress: '123 Main St',
        occupation: 'Engineer'
      };

      jest.spyOn(UserDataService, 'getAllUserData').mockResolvedValue({
        passport: null,
        personalInfo: mockPersonalInfo,
        fundingProof: null,
        userId: mockUserId
      });

      const result = await UserDataService.validateDataConsistency(mockUserId);

      expect(result.isConsistent).toBe(false);
      expect(result.personalInfo.valid).toBe(false);
      expect(result.personalInfo.errors).toContain('Invalid email format');
    });

    // Test for funding proof removed - use fund_items instead

    it('should detect userId inconsistency across data types', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: 'user-1',
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1988-01-22',
        nationality: 'CHN',
        gender: 'Male',
        expiryDate: '2030-12-31'
      };

      const mockPersonalInfo = {
        id: 'personal-1',
        userId: 'user-2', // Different userId
        phoneNumber: '+86 13812345678',
        email: 'test@example.com'
      };

      jest.spyOn(UserDataService, 'getAllUserData').mockResolvedValue({
        passport: mockPassport,
        personalInfo: mockPersonalInfo,
        fundingProof: null,
        userId: mockUserId
      });

      const result = await UserDataService.validateDataConsistency(mockUserId);

      expect(result.isConsistent).toBe(false);
      expect(result.crossFieldValidation.valid).toBe(false);
      expect(result.crossFieldValidation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('detectDataConflicts', () => {
    it('should detect no conflicts when data matches', async () => {
      const mockData = {
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1988-01-22',
        nationality: 'CHN'
      };

      // Mock SQLite data
      jest.spyOn(UserDataService, 'getAllUserData').mockResolvedValue({
        passport: mockData,
        personalInfo: null,
        fundingProof: null,
        userId: mockUserId
      });

      // Mock AsyncStorage data
      jest.spyOn(UserDataService, 'loadAllFromAsyncStorage').mockResolvedValue({
        passport: mockData,
        personalInfo: null,
        fundingProof: null
      });

      const result = await UserDataService.detectDataConflicts(mockUserId);

      expect(result.hasConflicts).toBe(false);
    });

    it('should detect passport data conflicts', async () => {
      const sqliteData = {
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        nationality: 'CHN'
      };

      const asyncStorageData = {
        passportNumber: 'E87654321', // Different
        fullName: 'ZHANG, WEI',
        nationality: 'CHN'
      };

      jest.spyOn(UserDataService, 'getAllUserData').mockResolvedValue({
        passport: sqliteData,
        personalInfo: null,
        fundingProof: null,
        userId: mockUserId
      });

      jest.spyOn(UserDataService, 'loadAllFromAsyncStorage').mockResolvedValue({
        passport: asyncStorageData,
        personalInfo: null,
        fundingProof: null
      });

      const result = await UserDataService.detectDataConflicts(mockUserId);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts.passport).not.toBeNull();
      expect(result.conflicts.passport.hasDifferences).toBe(true);
      expect(result.conflicts.passport.differences.length).toBeGreaterThan(0);
    });

    it('should detect personal info conflicts', async () => {
      const sqliteData = {
        email: 'new@example.com',
        phoneNumber: '+86 13812345678'
      };

      const asyncStorageData = {
        email: 'old@example.com', // Different
        phoneNumber: '+86 13812345678'
      };

      jest.spyOn(UserDataService, 'getAllUserData').mockResolvedValue({
        passport: null,
        personalInfo: sqliteData,
        fundingProof: null,
        userId: mockUserId
      });

      jest.spyOn(UserDataService, 'loadAllFromAsyncStorage').mockResolvedValue({
        passport: null,
        personalInfo: asyncStorageData,
        fundingProof: null
      });

      const result = await UserDataService.detectDataConflicts(mockUserId);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts.personalInfo).not.toBeNull();
      expect(result.conflicts.personalInfo.hasDifferences).toBe(true);
    });
  });

  describe('resolveDataConflicts', () => {
    it('should resolve conflicts by prioritizing SQLite data', async () => {
      // Mock conflict detection
      jest.spyOn(UserDataService, 'detectDataConflicts').mockResolvedValue({
        hasConflicts: true,
        userId: mockUserId,
        conflicts: {
          passport: {
            hasDifferences: true,
            differences: [
              {
                field: 'passportNumber',
                sqliteValue: 'E12345678',
                asyncStorageValue: 'E87654321'
              }
            ]
          }
        }
      });

      jest.spyOn(UserDataService, 'refreshCache').mockResolvedValue();

      const result = await UserDataService.resolveDataConflicts(mockUserId);

      expect(result.resolved).toBe(true);
      expect(result.hadConflicts).toBe(true);
      expect(result.resolution).toBe('SQLite data retained as source of truth');
      expect(UserDataService.refreshCache).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle no conflicts gracefully', async () => {
      jest.spyOn(UserDataService, 'detectDataConflicts').mockResolvedValue({
        hasConflicts: false,
        userId: mockUserId,
        conflicts: {}
      });

      const result = await UserDataService.resolveDataConflicts(mockUserId);

      expect(result.resolved).toBe(true);
      expect(result.hadConflicts).toBe(false);
      expect(result.message).toBe('No conflicts detected');
    });
  });

  describe('comparePassportData', () => {
    it('should detect differences in passport data', () => {
      const data1 = {
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        nationality: 'CHN'
      };

      const data2 = {
        passportNumber: 'E87654321',
        fullName: 'ZHANG, WEI',
        nationality: 'USA'
      };

      const result = UserDataService.comparePassportData(data1, data2);

      expect(result.hasDifferences).toBe(true);
      expect(result.differences.length).toBe(2);
      expect(result.differences).toContainEqual({
        field: 'passportNumber',
        sqliteValue: 'E12345678',
        asyncStorageValue: 'E87654321'
      });
      expect(result.differences).toContainEqual({
        field: 'nationality',
        sqliteValue: 'CHN',
        asyncStorageValue: 'USA'
      });
    });

    it('should detect no differences when data matches', () => {
      const data = {
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        nationality: 'CHN'
      };

      const result = UserDataService.comparePassportData(data, data);

      expect(result.hasDifferences).toBe(false);
      expect(result.differences.length).toBe(0);
    });
  });
});
