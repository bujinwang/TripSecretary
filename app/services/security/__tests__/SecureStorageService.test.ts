// @ts-nocheck

/**
 * Tests for SecureStorageService enhancements
 * Task 3: Enhance SecureStorageService
 */

import SecureStorageService from '../SecureStorageService';

// Increase timeout for database operations
jest.setTimeout(15000);

describe('SecureStorageService - Task 3 Enhancements', () => {
  let service;
  const testUserId = 'test_user_123';

  beforeEach(async () => {
    service = SecureStorageService; // Use singleton instance
    await service.initialize(testUserId);
  }, 10000); // 10 second timeout for initialization

  describe('3.1 Database schema migration methods', () => {
    test('should have migrations table created', async () => {
      // The migrations table should be created during initialization
      const status = await service.getMigrationStatus(testUserId);
      // Status can be null if no migration has been run yet
      expect(status === null || typeof status === 'object').toBe(true);
    });

    test('should support gender field in passports', async () => {
      const passportData = {
        id: 'test_passport_1',
        userId: testUserId,
        passportNumber: 'E12345678',
        fullName: 'TEST USER',
        dateOfBirth: '1990-01-01',
        nationality: 'USA',
        gender: 'Male',
        expiryDate: '2030-12-31',
        issueDate: '2020-01-01',
        issuePlace: 'New York'
      };

      await service.savePassport(passportData);
      const retrieved = await service.getPassport('test_passport_1');
      
      expect(retrieved.gender).toBe('Male');
    });
  });

  describe('3.2 User-based passport lookup methods', () => {
    test('getUserPassport should retrieve passport by userId', async () => {
      const passportData = {
        id: 'test_passport_2',
        userId: testUserId,
        passportNumber: 'E87654321',
        fullName: 'ANOTHER USER',
        dateOfBirth: '1985-05-15',
        nationality: 'GBR',
        gender: 'Female',
        expiryDate: '2028-06-30',
        issueDate: '2018-06-30',
        issuePlace: 'London'
      };

      await service.savePassport(passportData);
      const retrieved = await service.getUserPassport(testUserId);
      
      expect(retrieved).not.toBeNull();
      expect(retrieved.userId).toBe(testUserId);
      expect(retrieved.passportNumber).toBe('E87654321');
    });

    test('listUserPassports should return all passports for user', async () => {
      const passport1 = {
        id: 'test_passport_3',
        userId: testUserId,
        passportNumber: 'P11111111',
        fullName: 'USER ONE',
        dateOfBirth: '1990-01-01',
        nationality: 'USA',
        gender: 'Male',
        expiryDate: '2030-12-31',
        issueDate: '2020-01-01',
        issuePlace: 'NYC'
      };

      const passport2 = {
        id: 'test_passport_4',
        userId: testUserId,
        passportNumber: 'P22222222',
        fullName: 'USER TWO',
        dateOfBirth: '1990-01-01',
        nationality: 'CAN',
        gender: 'Female',
        expiryDate: '2029-12-31',
        issueDate: '2019-01-01',
        issuePlace: 'Toronto'
      };

      await service.savePassport(passport1);
      await service.savePassport(passport2);
      
      const passports = await service.listUserPassports(testUserId);
      
      expect(passports.length).toBeGreaterThanOrEqual(2);
      expect(passports.some(p => p.id === 'test_passport_3')).toBe(true);
      expect(passports.some(p => p.id === 'test_passport_4')).toBe(true);
    });
  });


  describe('3.4 Batch operation support', () => {
    test('batchSave should save multiple operations atomically', async () => {
      const operations = [
        {
          type: 'passport',
          data: {
            id: 'batch_passport_1',
            userId: testUserId,
            passportNumber: 'B11111111',
            fullName: 'BATCH USER',
            dateOfBirth: '1992-03-15',
            nationality: 'FRA',
            gender: 'Male',
            expiryDate: '2031-03-15',
            issueDate: '2021-03-15',
            issuePlace: 'Paris'
          }
        },
        {
          type: 'personalInfo',
          data: {
            id: 'batch_personal_1',
            userId: testUserId,
            phoneNumber: '+33123456789',
            email: 'batch@example.com',
            homeAddress: '123 Rue de Test',
            occupation: 'Engineer',
            provinceCity: 'Paris',
            countryRegion: 'FRA'
          }
        }
        // Legacy fundingProof operation removed
      ];

      const results = await service.batchSave(operations);
      
      expect(results).toBeDefined();
      expect(results.length).toBe(2); // Only passport and personalInfo
      
      // Verify all data was saved
      const passport = await service.getPassport('batch_passport_1');
      const personalInfo = await service.getPersonalInfo(testUserId);
      
      expect(passport).not.toBeNull();
      expect(personalInfo).not.toBeNull();
    });
  });
});
