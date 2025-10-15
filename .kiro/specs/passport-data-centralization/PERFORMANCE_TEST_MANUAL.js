/**
 * Manual Performance Testing Script
 * 
 * This script can be run in a React Native environment to test actual performance
 * of the PassportDataService with real SQLite database operations.
 * 
 * Usage:
 * 1. Import this file in your app
 * 2. Call runPerformanceTests() from a test screen or button
 * 3. Check console output for results
 */

import PassportDataService from '../../app/services/data/PassportDataService';
import Passport from '../../app/models/Passport';
import PersonalInfo from '../../app/models/PersonalInfo';
import FundingProof from '../../app/models/FundingProof';

/**
 * Performance test results
 */
const results = {
  dataLoadTimes: [],
  cacheHitTimes: [],
  concurrentAccessTimes: [],
  batchOperationTimes: [],
  cacheStats: null,
};

/**
 * Measure execution time of an async function
 */
async function measureTime(name, fn) {
  const startTime = Date.now();
  try {
    await fn();
    const duration = Date.now() - startTime;
    console.log(`✅ ${name}: ${duration}ms`);
    return { success: true, duration, name };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${name}: ${error.message} (${duration}ms)`);
    return { success: false, duration, name, error: error.message };
  }
}

/**
 * Test 1: Data Load Time Performance
 */
async function testDataLoadTimes(userId) {
  console.log('\n📊 Test 1: Data Load Time Performance');
  console.log('Target: < 100ms per operation\n');

  // Clear cache to ensure fresh loads
  PassportDataService.clearCache();

  const tests = [
    {
      name: 'Load Passport Data',
      fn: async () => await PassportDataService.getPassport(userId),
    },
    {
      name: 'Load Personal Info',
      fn: async () => await PassportDataService.getPersonalInfo(userId),
    },
    {
      name: 'Load Funding Proof',
      fn: async () => await PassportDataService.getFundingProof(userId),
    },
    {
      name: 'Load All User Data (Batch)',
      fn: async () => await PassportDataService.getAllUserData(userId),
    },
  ];

  for (const test of tests) {
    const result = await measureTime(test.name, test.fn);
    results.dataLoadTimes.push(result);
  }

  // Summary
  const avgTime = results.dataLoadTimes.reduce((sum, r) => sum + r.duration, 0) / results.dataLoadTimes.length;
  const maxTime = Math.max(...results.dataLoadTimes.map(r => r.duration));
  console.log(`\n📈 Average Load Time: ${avgTime.toFixed(2)}ms`);
  console.log(`📈 Max Load Time: ${maxTime}ms`);
  console.log(`${maxTime < 100 ? '✅' : '❌'} Target: < 100ms\n`);
}

/**
 * Test 2: Cache Performance
 */
async function testCachePerformance(userId) {
  console.log('\n📊 Test 2: Cache Performance');
  console.log('Target: < 10ms for cached data, > 80% hit rate\n');

  // Reset cache stats
  PassportDataService.resetCacheStats();
  PassportDataService.clearCache();

  // First load (cache miss)
  await PassportDataService.getPassport(userId);

  // Subsequent loads (cache hits)
  for (let i = 0; i < 9; i++) {
    const result = await measureTime(`Cached Read ${i + 1}`, async () => {
      await PassportDataService.getPassport(userId);
    });
    results.cacheHitTimes.push(result);
  }

  // Get cache statistics
  const stats = PassportDataService.getCacheStats();
  results.cacheStats = stats;

  // Summary
  const avgCacheTime = results.cacheHitTimes.reduce((sum, r) => sum + r.duration, 0) / results.cacheHitTimes.length;
  console.log(`\n📈 Average Cache Hit Time: ${avgCacheTime.toFixed(2)}ms`);
  console.log(`📈 Cache Hit Rate: ${stats.hitRate}%`);
  console.log(`📈 Hits: ${stats.hits}, Misses: ${stats.misses}`);
  console.log(`${avgCacheTime < 10 ? '✅' : '❌'} Target: < 10ms`);
  console.log(`${stats.hitRate >= 80 ? '✅' : '❌'} Target: > 80% hit rate\n`);
}

/**
 * Test 3: Concurrent Access
 */
async function testConcurrentAccess(userId) {
  console.log('\n📊 Test 3: Concurrent Access Performance');
  console.log('Target: Handle 10 concurrent reads in < 500ms\n');

  PassportDataService.clearCache();

  const result = await measureTime('10 Concurrent Reads', async () => {
    const promises = Array(10).fill(null).map(() =>
      PassportDataService.getPassport(userId)
    );
    await Promise.all(promises);
  });

  results.concurrentAccessTimes.push(result);

  console.log(`${result.duration < 500 ? '✅' : '❌'} Target: < 500ms\n`);
}

/**
 * Test 4: Batch Operations
 */
async function testBatchOperations(userId) {
  console.log('\n📊 Test 4: Batch Operation Performance');
  console.log('Target: Batch load faster than parallel load\n');

  PassportDataService.clearCache();

  // Test batch load
  const batchResult = await measureTime('Batch Load (getAllUserData)', async () => {
    await PassportDataService.getAllUserData(userId);
  });

  PassportDataService.clearCache();

  // Test parallel load
  const parallelResult = await measureTime('Parallel Load (3 separate calls)', async () => {
    await Promise.all([
      PassportDataService.getPassport(userId),
      PassportDataService.getPersonalInfo(userId),
      PassportDataService.getFundingProof(userId),
    ]);
  });

  results.batchOperationTimes.push(batchResult, parallelResult);

  console.log(`\n📈 Batch Load: ${batchResult.duration}ms`);
  console.log(`📈 Parallel Load: ${parallelResult.duration}ms`);
  console.log(`${batchResult.duration <= parallelResult.duration ? '✅' : '⚠️'} Batch should be faster or equal\n`);
}

/**
 * Test 5: Stress Test
 */
async function testStressScenarios(userId) {
  console.log('\n📊 Test 5: Stress Testing');
  console.log('Target: Handle 100 rapid reads in < 1000ms\n');

  PassportDataService.resetCacheStats();
  PassportDataService.clearCache();

  const result = await measureTime('100 Rapid Successive Reads', async () => {
    for (let i = 0; i < 100; i++) {
      await PassportDataService.getPassport(userId);
    }
  });

  const stats = PassportDataService.getCacheStats();

  console.log(`\n📈 Total Time: ${result.duration}ms`);
  console.log(`📈 Average per Read: ${(result.duration / 100).toFixed(2)}ms`);
  console.log(`📈 Cache Hit Rate: ${stats.hitRate}%`);
  console.log(`${result.duration < 1000 ? '✅' : '❌'} Target: < 1000ms\n`);
}

/**
 * Generate test data
 */
async function setupTestData(userId) {
  console.log('🔧 Setting up test data...\n');

  try {
    // Create test passport
    const passport = new Passport({
      userId,
      passportNumber: 'E12345678',
      fullName: 'ZHANG, WEI',
      dateOfBirth: '1988-01-22',
      nationality: 'CHN',
      gender: 'Male',
      expiryDate: '2030-12-31',
      issueDate: '2020-12-31',
      issuePlace: 'Shanghai',
    });
    await passport.save();

    // Create test personal info
    const personalInfo = new PersonalInfo({
      userId,
      phoneNumber: '+86 13812345678',
      email: 'test@example.com',
      homeAddress: '123 Main St, Shanghai',
      occupation: 'BUSINESS MAN',
      provinceCity: 'ANHUI',
      countryRegion: 'CHN',
    });
    await personalInfo.save();

    // Create test funding proof
    const fundingProof = new FundingProof({
      userId,
      cashAmount: '10,000 THB equivalent',
      bankCards: 'CMB Visa (****1234) · Balance 20,000 CNY',
      supportingDocs: 'Bank app screenshots saved',
    });
    await fundingProof.save();

    console.log('✅ Test data created successfully\n');
  } catch (error) {
    console.error('❌ Failed to create test data:', error);
    throw error;
  }
}

/**
 * Generate performance report
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERFORMANCE TEST REPORT');
  console.log('='.repeat(60) + '\n');

  // Data Load Times
  console.log('1️⃣ Data Load Times:');
  results.dataLoadTimes.forEach(r => {
    const status = r.success && r.duration < 100 ? '✅' : '❌';
    console.log(`   ${status} ${r.name}: ${r.duration}ms`);
  });

  // Cache Performance
  console.log('\n2️⃣ Cache Performance:');
  const avgCacheTime = results.cacheHitTimes.reduce((sum, r) => sum + r.duration, 0) / results.cacheHitTimes.length;
  console.log(`   ✅ Average Cache Hit Time: ${avgCacheTime.toFixed(2)}ms`);
  if (results.cacheStats) {
    console.log(`   ✅ Cache Hit Rate: ${results.cacheStats.hitRate}%`);
    console.log(`   ✅ Total Hits: ${results.cacheStats.hits}`);
    console.log(`   ✅ Total Misses: ${results.cacheStats.misses}`);
  }

  // Concurrent Access
  console.log('\n3️⃣ Concurrent Access:');
  results.concurrentAccessTimes.forEach(r => {
    const status = r.success && r.duration < 500 ? '✅' : '❌';
    console.log(`   ${status} ${r.name}: ${r.duration}ms`);
  });

  // Batch Operations
  console.log('\n4️⃣ Batch Operations:');
  results.batchOperationTimes.forEach(r => {
    console.log(`   ✅ ${r.name}: ${r.duration}ms`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Performance testing complete!');
  console.log('='.repeat(60) + '\n');
}

/**
 * Main test runner
 */
export async function runPerformanceTests(userId = 'test-user-performance') {
  console.log('\n🚀 Starting Performance Tests...\n');

  try {
    // Initialize service
    await PassportDataService.initialize(userId);

    // Setup test data
    await setupTestData(userId);

    // Run tests
    await testDataLoadTimes(userId);
    await testCachePerformance(userId);
    await testConcurrentAccess(userId);
    await testBatchOperations(userId);
    await testStressScenarios(userId);

    // Generate report
    generateReport();

    return results;
  } catch (error) {
    console.error('❌ Performance tests failed:', error);
    throw error;
  }
}

/**
 * Quick performance check (subset of tests)
 */
export async function quickPerformanceCheck(userId = 'test-user-quick') {
  console.log('\n⚡ Quick Performance Check...\n');

  try {
    await PassportDataService.initialize(userId);

    // Just test basic load time and cache
    PassportDataService.clearCache();
    
    const loadResult = await measureTime('Data Load', async () => {
      await PassportDataService.getPassport(userId);
    });

    const cacheResult = await measureTime('Cached Load', async () => {
      await PassportDataService.getPassport(userId);
    });

    console.log(`\n${loadResult.duration < 100 ? '✅' : '❌'} Load Time: ${loadResult.duration}ms (target: < 100ms)`);
    console.log(`${cacheResult.duration < 10 ? '✅' : '❌'} Cache Time: ${cacheResult.duration}ms (target: < 10ms)\n`);

    return { loadResult, cacheResult };
  } catch (error) {
    console.error('❌ Quick check failed:', error);
    throw error;
  }
}

export default {
  runPerformanceTests,
  quickPerformanceCheck,
};
