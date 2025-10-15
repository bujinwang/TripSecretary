/**
 * Index Verification Tests
 * Tests to verify database indexes are created and used correctly
 */

import SecureStorageService from '../SecureStorageService';

describe('Database Index Verification', () => {
  const TEST_USER_ID = 'test_user_index_verification';

  beforeAll(async () => {
    await SecureStorageService.initialize(TEST_USER_ID);
  }, 10000); // Increase timeout to 10 seconds

  afterAll(async () => {
    await SecureStorageService.close();
  });

  test('should have all required indexes created', async () => {
    const results = await SecureStorageService.verifyIndexes();
    
    // Check that all expected indexes exist
    expect(results.indexesExist['idx_passports_user_id']).toBeDefined();
    expect(results.indexesExist['idx_personal_info_user_id']).toBeDefined();
    // idx_funding_proof_user_id removed - funding_proof table deleted
    
    // Verify index definitions
    expect(results.indexesExist['idx_passports_user_id'].table).toBe('passports');
    expect(results.indexesExist['idx_personal_info_user_id'].table).toBe('personal_info');
    // funding_proof index verification removed
  });

  test('should use indexes for user_id queries', async () => {
    const results = await SecureStorageService.verifyIndexes();
    
    // Check query plans
    expect(results.queryPlans['passport_by_user_id']).toBeDefined();
    expect(results.queryPlans['personal_info_by_user_id']).toBeDefined();
    // funding_proof query plan check removed
  });

  test('should provide index statistics', async () => {
    const stats = await SecureStorageService.getIndexStats();
    
    expect(stats.totalIndexes).toBeGreaterThan(0);
    expect(stats.customIndexes.length).toBeGreaterThanOrEqual(3);
    expect(stats.tableStats).toBeDefined();
  });
});
