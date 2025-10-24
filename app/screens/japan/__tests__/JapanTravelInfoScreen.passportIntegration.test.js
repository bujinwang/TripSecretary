/**
 * Integration tests for JapanTravelInfoScreen passport data integration
 * Tests the integration with UserDataService for loading and saving passport data
 */

import UserDataService from '../../../services/data/UserDataService';
import Passport from '../../../models/Passport';

describe('JapanTravelInfoScreen - Passport Data Integration', () => {
  const TEST_USER_ID = 'test_japan_user_' + Date.now();

  beforeAll(async () => {
    // Initialize the service
    await UserDataService.initialize(TEST_USER_ID);
  });

  afterAll(async () => {
    // Clean up test data
    try {
      const passport = await UserDataService.getPassport(TEST_USER_ID);
      if (passport) {
        await passport.delete();
      }
    } catch (error) {
      console.log('Cleanup error (expected if no data):', error.message);
    }
  });

  beforeEach(() => {
    // Clear cache before each test
    UserDataService.clearCache();
  });

  test('should save passport data with correct field names', async () => {
    // Simulate what JapanTravelInfoScreen does when saving passport data
    const passportData = {
      passportNumber: 'E12345678',
      fullName: 'ZHANG, WEI',
      nationality: 'CHN',
      dateOfBirth: '1990-01-15',
      expiryDate: '2030-12-31'
    };

    // Save passport
    const savedPassport = await UserDataService.savePassport(
      passportData,
      TEST_USER_ID,
      { skipValidation: true }
    );

    expect(savedPassport).toBeDefined();
    expect(savedPassport.passportNumber).toBe('E12345678');
    expect(savedPassport.fullName).toBe('ZHANG, WEI');
    expect(savedPassport.nationality).toBe('CHN');
    expect(savedPassport.dateOfBirth).toBe('1990-01-15');
    expect(savedPassport.expiryDate).toBe('2030-12-31');
  });

  test('should load passport data with correct field names', async () => {
    // First save some data
    const passportData = {
      passportNumber: 'P98765432',
      fullName: 'TANAKA, YUKI',
      nationality: 'JPN',
      dateOfBirth: '1985-05-20',
      expiryDate: '2028-06-30'
    };

    await UserDataService.savePassport(
      passportData,
      TEST_USER_ID,
      { skipValidation: true }
    );

    // Clear cache to force database load
    UserDataService.clearCache();

    // Load passport (simulating what JapanTravelInfoScreen does)
    const loadedPassport = await UserDataService.getPassport(TEST_USER_ID);

    expect(loadedPassport).toBeDefined();
    expect(loadedPassport.passportNumber).toBe('P98765432');
    expect(loadedPassport.fullName).toBe('TANAKA, YUKI');
    expect(loadedPassport.nationality).toBe('JPN');
    expect(loadedPassport.dateOfBirth).toBe('1985-05-20');
    expect(loadedPassport.expiryDate).toBe('2028-06-30');
  });

  test('should update passport data on field blur', async () => {
    // First create a passport
    const initialData = {
      passportNumber: 'K11111111',
      fullName: 'KIM, MINHO',
      nationality: 'KOR',
      dateOfBirth: '1992-03-10',
      expiryDate: '2029-08-15'
    };

    await UserDataService.savePassport(
      initialData,
      TEST_USER_ID,
      { skipValidation: true }
    );

    // Get the passport
    const passport = await UserDataService.getPassport(TEST_USER_ID);

    // Simulate field blur update (what handleFieldBlur does)
    await UserDataService.updatePassport(
      passport.id,
      { fullName: 'KIM, MINHO UPDATED' },
      { skipValidation: true }
    );

    // Verify the update
    UserDataService.clearCache();
    const updatedPassport = await UserDataService.getPassport(TEST_USER_ID);

    expect(updatedPassport.fullName).toBe('KIM, MINHO UPDATED');
    expect(updatedPassport.passportNumber).toBe('K11111111'); // Other fields unchanged
  });

  test('should handle progressive data entry', async () => {
    // Start with minimal data
    const minimalData = {
      passportNumber: 'A00000001'
    };

    const passport1 = await UserDataService.savePassport(
      minimalData,
      TEST_USER_ID,
      { skipValidation: true }
    );

    expect(passport1.passportNumber).toBe('A00000001');
    expect(passport1.fullName).toBeUndefined();

    // Add more data progressively
    await UserDataService.updatePassport(
      passport1.id,
      { fullName: 'SMITH, JOHN' },
      { skipValidation: true }
    );

    await UserDataService.updatePassport(
      passport1.id,
      { dateOfBirth: '1988-07-22' },
      { skipValidation: true }
    );

    // Verify all data is present
    UserDataService.clearCache();
    const finalPassport = await UserDataService.getPassport(TEST_USER_ID);

    expect(finalPassport.passportNumber).toBe('A00000001');
    expect(finalPassport.fullName).toBe('SMITH, JOHN');
    expect(finalPassport.dateOfBirth).toBe('1988-07-22');
  });

  test('should not overwrite existing data with empty values', async () => {
    // Create passport with full data
    const fullData = {
      passportNumber: 'B12345678',
      fullName: 'WANG, LEI',
      nationality: 'CHN',
      dateOfBirth: '1995-11-30',
      expiryDate: '2031-01-01'
    };

    const passport = await UserDataService.savePassport(
      fullData,
      TEST_USER_ID,
      { skipValidation: true }
    );

    // Try to update with empty values (should be filtered out by updatePassport)
    await UserDataService.updatePassport(
      passport.id,
      {
        fullName: '',
        nationality: 'USA' // Only this should update
      },
      { skipValidation: true }
    );

    // Verify empty value didn't overwrite
    UserDataService.clearCache();
    const updatedPassport = await UserDataService.getPassport(TEST_USER_ID);

    expect(updatedPassport.fullName).toBe('WANG, LEI'); // Should remain unchanged
    expect(updatedPassport.nationality).toBe('USA'); // Should be updated
  });
});
