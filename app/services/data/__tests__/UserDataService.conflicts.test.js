/**
 * Tests for UserDataService conflict detection and error handling
 */

import UserDataService from '../UserDataService';
import Passport from '../../../models/Passport';
import PersonalInfo from '../../../models/PersonalInfo';
// FundingProof removed - conflict tests updated
import SecureStorageService from '../../security/SecureStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../../../models/Passport');
jest.mock('../../../models/PersonalInfo');
// FundingProof mock removed
jest.mock('../../security/SecureStorageService');
jest.mock('@react-native-async-storage/async-storage');

describe('UserDataService - Conflict Detection and Error Handling', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    UserDataService.clearCache();
  });

  describe('detectDataConflicts', () => {
    it('should detect no conflicts when data matches', async () => {
      // Mock SQLite data
      const passportData = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        nationality: 'CHN',
        dateOfBirth: '1988-01-22',
        gender: 'Male',
        expiryDate: '2030-12-31',
        issueDate: '2020-12-31',
        issuePlace: 'Shanghai'
      };

      Passport.load.mockResolvedValue(passportData);
      PersonalInfo.load.mockResolvedValue(null);

      // Mock AsyncStorage data (same as SQLite)
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@passport' || key === `@passport_${testUserId}`) {
          return Promise.resolve(JSON.stringify(passportData));
        }
        return Promise.resolve(null);
      });

      const result = await UserDataService.detectDataConflicts(testUserId);

      expect(result.hasConflicts).toBe(false);
      expect(result.userId).toBe(testUserId);
    });

    it('should detect conflicts when passport data differs', async () => {
      // Mock SQLite data
      const sqlitePassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        nationality: 'CHN',
        dateOfBirth: '1988-01-22',
        gender: 'Male',
        expiryDate: '2030-12-31',
        issueDate: '2020-12-31',
        issuePlace: 'Shanghai'
      };

      // Mock AsyncStorage data (different passport number)
      const asyncPassport = {
        ...sqlitePassport,
        passportNumber: 'E87654321',
        fullName: 'WANG, LI'
      };

      Passport.load.mockResolvedValue(sqlitePassport);
      PersonalInfo.load.mockResolvedValue(null);

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@passport' || key === `@passport_${testUserId}`) {
          return Promise.resolve(JSON.stringify(asyncPassport));
        }
        return Promise.resolve(null);
      });

      const result = await UserDataService.detectDataConflicts(testUserId);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts.passport).toBeDefined();
      expect(result.conflicts.passport.hasDifferences).toBe(true);
      expect(result.conflicts.passport.differences).toHaveLength(2);
      expect(result.conflicts.passport.differences[0].field).toBe('passportNumber');
      expect(result.conflicts.passport.differences[0].sqliteValue).toBe('E12345678');
      expect(result.conflicts.passport.differences[0].asyncStorageValue).toBe('E87654321');
    });

    it('should detect conflicts in personal info', async () => {
      const sqlitePersonalInfo = {
        id: 'personal-1',
        userId: testUserId,
        phoneNumber: '+86 12345678901',
        email: 'test@example.com',
        occupation: 'Engineer'
      };

      const asyncPersonalInfo = {
        ...sqlitePersonalInfo,
        phoneNumber: '+86 98765432109',
        email: 'different@example.com'
      };

      Passport.load.mockResolvedValue(null);
      PersonalInfo.load.mockResolvedValue(sqlitePersonalInfo);

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@personal_info' || key === `@personal_info_${testUserId}`) {
          return Promise.resolve(JSON.stringify(asyncPersonalInfo));
        }
        return Promise.resolve(null);
      });

      const result = await UserDataService.detectDataConflicts(testUserId);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts.personalInfo).toBeDefined();
      expect(result.conflicts.personalInfo.hasDifferences).toBe(true);
      expect(result.conflicts.personalInfo.differences).toHaveLength(2);
    });

    /*
    it('should detect conflicts in funding proof', async () => {
      const sqliteFunding = {
        id: 'funding-1',
        userId: testUserId,
        cashAmount: '10000 THB',
        bankCards: 'Visa ****1234'
      };

      const asyncFunding = {
        ...sqliteFunding,
        cashAmount: '20000 THB'
      };

      Passport.load.mockResolvedValue(null);
      PersonalInfo.load.mockResolvedValue(null);
      FundingProof.load.mockResolvedValue(sqliteFunding);

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@funding_proof' || key === `@funding_proof_${testUserId}`) {
          return Promise.resolve(JSON.stringify(asyncFunding));
        }
        return Promise.resolve(null);
      });

      const result = await UserDataService.detectDataConflicts(testUserId);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts.fundingProof).toBeDefined();
      expect(result.conflicts.fundingProof.hasDifferences).toBe(true);
    });
    */
  });

  describe('resolveDataConflicts', () => {
    it('should resolve conflicts by prioritizing SQLite data', async () => {
      // Mock conflict detection
      const sqlitePassport = {
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI'
      };

      const asyncPassport = {
        passportNumber: 'E87654321',
        fullName: 'WANG, LI'
      };

      Passport.load.mockResolvedValue(sqlitePassport);
      PersonalInfo.load.mockResolvedValue(null);

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@passport' || key === `@passport_${testUserId}`) {
          return Promise.resolve(JSON.stringify(asyncPassport));
        }
        return Promise.resolve(null);
      });

      const result = await UserDataService.resolveDataConflicts(testUserId);

      expect(result.resolved).toBe(true);
      expect(result.hadConflicts).toBe(true);
      expect(result.resolution).toBe('SQLite data retained as source of truth');
      expect(result.conflicts).toBeDefined();
    });

    it('should return no conflicts message when no conflicts exist', async () => {
      Passport.load.mockResolvedValue(null);
      PersonalInfo.load.mockResolvedValue(null);
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await UserDataService.resolveDataConflicts(testUserId);

      expect(result.resolved).toBe(true);
      expect(result.hadConflicts).toBe(false);
      expect(result.message).toBe('No conflicts detected');
    });
  });

  describe('getAllUserDataWithConflictHandling', () => {
    it('should load data with conflict detection enabled', async () => {
      const passportData = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678'
      };

      Passport.load.mockResolvedValue(passportData);
      PersonalInfo.load.mockResolvedValue(null);
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await UserDataService.getAllUserDataWithConflictHandling(testUserId);

      expect(result.passport).toEqual(passportData);
      expect(result.conflictHandling).toBeDefined();
      expect(result.conflictHandling.enabled).toBe(true);
      expect(result.conflictHandling.hasConflicts).toBe(false);
    });

    it('should detect and resolve conflicts automatically', async () => {
      const sqlitePassport = {
        passportNumber: 'E12345678'
      };

      const asyncPassport = {
        passportNumber: 'E87654321'
      };

      Passport.load.mockResolvedValue(sqlitePassport);
      PersonalInfo.load.mockResolvedValue(null);

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@passport' || key === `@passport_${testUserId}`) {
          return Promise.resolve(JSON.stringify(asyncPassport));
        }
        return Promise.resolve(null);
      });

      const result = await UserDataService.getAllUserDataWithConflictHandling(testUserId);

      expect(result.conflictHandling.hasConflicts).toBe(true);
      expect(result.conflictHandling.resolved).toBe(true);
      expect(result.conflictHandling.conflicts).toBeDefined();
    });

    it('should skip conflict detection when disabled', async () => {
      Passport.load.mockResolvedValue({ id: 'passport-1' });
      PersonalInfo.load.mockResolvedValue(null);

      const result = await UserDataService.getAllUserDataWithConflictHandling(
        testUserId,
        { detectConflicts: false }
      );

      expect(result.conflictHandling.enabled).toBe(false);
      expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    });

    it('should handle conflict detection errors gracefully', async () => {
      Passport.load.mockResolvedValue({ id: 'passport-1' });
      PersonalInfo.load.mockResolvedValue(null);
      AsyncStorage.getItem.mockRejectedValue(new Error('AsyncStorage error'));

      const result = await UserDataService.getAllUserDataWithConflictHandling(testUserId);

      expect(result.conflictHandling.detectionFailed).toBe(true);
      expect(result.conflictHandling.error).toBeDefined();
    });
  });

  describe('checkAndLogConflicts', () => {
    it('should log conflicts in detail', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const sqlitePassport = {
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI'
      };

      const asyncPassport = {
        passportNumber: 'E87654321',
        fullName: 'WANG, LI'
      };

      Passport.load.mockResolvedValue(sqlitePassport);
      PersonalInfo.load.mockResolvedValue(null);

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@passport' || key === `@passport_${testUserId}`) {
          return Promise.resolve(JSON.stringify(asyncPassport));
        }
        return Promise.resolve(null);
      });

      const result = await UserDataService.checkAndLogConflicts(testUserId);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DATA CONFLICT DETECTED'));

      consoleSpy.mockRestore();
    });

    it('should return no conflicts when none exist', async () => {
      Passport.load.mockResolvedValue(null);
      PersonalInfo.load.mockResolvedValue(null);
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await UserDataService.checkAndLogConflicts(testUserId);

      expect(result.hasConflicts).toBe(false);
      expect(result.message).toBe('No conflicts detected');
    });
  });

  describe('handleDataOperationError', () => {
    it('should categorize NOT_FOUND errors', () => {
      const error = new Error('Passport not found: test-id');
      const result = UserDataService.handleDataOperationError(
        error,
        'getPassport',
        testUserId
      );

      expect(result.success).toBe(false);
      expect(result.category).toBe('NOT_FOUND');
      expect(result.suggestions).toContain('Check if data exists for this user');
    });

    it('should categorize VALIDATION_ERROR', () => {
      const error = new Error('Validation failed: missing required field');
      const result = UserDataService.handleDataOperationError(
        error,
        'savePassport',
        testUserId
      );

      expect(result.category).toBe('VALIDATION_ERROR');
      expect(result.suggestions).toContain('Check data format and required fields');
    });

    it('should categorize CONFLICT_ERROR', () => {
      const error = new Error('Data conflict detected between sources');
      const result = UserDataService.handleDataOperationError(
        error,
        'loadData',
        testUserId
      );

      expect(result.category).toBe('CONFLICT_ERROR');
      expect(result.suggestions).toContain('Run conflict detection to identify issues');
    });

    it('should categorize DATABASE_ERROR', () => {
      const error = new Error('SQLite database connection failed');
      const result = UserDataService.handleDataOperationError(
        error,
        'saveData',
        testUserId
      );

      expect(result.category).toBe('DATABASE_ERROR');
      expect(result.suggestions).toContain('Check database connection');
    });

    it('should categorize ASYNCSTORAGE_ERROR', () => {
      const error = new Error('AsyncStorage read failed');
      const result = UserDataService.handleDataOperationError(
        error,
        'migrateData',
        testUserId
      );

      expect(result.category).toBe('ASYNCSTORAGE_ERROR');
      expect(result.suggestions).toContain('SQLite data will be used as fallback');
    });

    it('should categorize UNKNOWN_ERROR for unrecognized errors', () => {
      const error = new Error('Something unexpected happened');
      const result = UserDataService.handleDataOperationError(
        error,
        'someOperation',
        testUserId
      );

      expect(result.category).toBe('UNKNOWN_ERROR');
      expect(result.suggestions).toContain('Check error logs for details');
    });
  });

  describe('safeLoadUserData', () => {
    it('should successfully load data', async () => {
      const passportData = { id: 'passport-1', userId: testUserId };
      
      Passport.load.mockResolvedValue(passportData);
      PersonalInfo.load.mockResolvedValue(null);
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await UserDataService.safeLoadUserData(testUserId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.passport).toEqual(passportData);
    });

    it('should handle errors gracefully', async () => {
      Passport.load.mockRejectedValue(new Error('Database connection failed'));

      const result = await UserDataService.safeLoadUserData(testUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.category).toBe('DATABASE_ERROR');
    });
  });
});
