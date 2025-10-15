/**
 * PassportDataService Caching Demonstration
 * 
 * This script demonstrates the caching functionality of PassportDataService.
 * Run this in a React Native environment to see caching in action.
 */

import PassportDataService from '../../../app/services/data/PassportDataService';

async function demonstrateCaching() {
  console.log('=== PassportDataService Caching Demo ===\n');
  
  const testUserId = 'demo-user-123';
  
  try {
    // Initialize the service
    console.log('1. Initializing PassportDataService...');
    await PassportDataService.initialize(testUserId);
    console.log('   ✓ Initialized\n');
    
    // Reset statistics for clean demo
    PassportDataService.resetCacheStats();
    
    // Demonstrate cache miss (first load)
    console.log('2. First load - should be CACHE MISS:');
    const passport1 = await PassportDataService.getPassport(testUserId);
    console.log(`   Result: ${passport1 ? 'Data loaded' : 'No data found'}\n`);
    
    // Demonstrate cache hit (second load within TTL)
    console.log('3. Second load (within 5 min) - should be CACHE HIT:');
    const passport2 = await PassportDataService.getPassport(testUserId);
    console.log(`   Result: ${passport2 ? 'Data loaded' : 'No data found'}\n`);
    
    // Demonstrate cache hit (third load)
    console.log('4. Third load (within 5 min) - should be CACHE HIT:');
    const passport3 = await PassportDataService.getPassport(testUserId);
    console.log(`   Result: ${passport3 ? 'Data loaded' : 'No data found'}\n`);
    
    // Show statistics
    console.log('5. Cache Statistics after 3 loads:');
    const stats1 = PassportDataService.getCacheStats();
    console.log(`   Hits: ${stats1.hits}`);
    console.log(`   Misses: ${stats1.misses}`);
    console.log(`   Hit Rate: ${stats1.hitRate}%`);
    console.log(`   Total Requests: ${stats1.totalRequests}\n`);
    
    // Demonstrate cache invalidation
    if (passport1) {
      console.log('6. Updating passport - should INVALIDATE cache:');
      await PassportDataService.updatePassport(passport1.id, {
        fullName: 'UPDATED NAME'
      });
      console.log('   ✓ Cache invalidated\n');
      
      // Load after invalidation - should be cache miss
      console.log('7. Load after update - should be CACHE MISS:');
      const passport4 = await PassportDataService.getPassport(testUserId);
      console.log(`   Result: ${passport4 ? 'Data loaded' : 'No data found'}\n`);
    }
    
    // Final statistics
    console.log('8. Final Cache Statistics:');
    PassportDataService.logCacheStats();
    
    // Demonstrate cache expiration
    console.log('\n9. Simulating cache expiration (6 minutes):');
    const cacheKey = `passport_${testUserId}`;
    const expiredTime = Date.now() - (6 * 60 * 1000); // 6 minutes ago
    PassportDataService.cache.lastUpdate.set(cacheKey, expiredTime);
    console.log('   ✓ Cache timestamp set to 6 minutes ago\n');
    
    console.log('10. Load after expiration - should be CACHE MISS:');
    const passport5 = await PassportDataService.getPassport(testUserId);
    console.log(`    Result: ${passport5 ? 'Data loaded' : 'No data found'}\n`);
    
    // Demonstrate multi-data-type caching
    console.log('11. Loading all data types (parallel):');
    const allData = await PassportDataService.getAllUserData(testUserId);
    console.log(`    Passport: ${allData.passport ? '✓' : '✗'}`);
    console.log(`    Personal Info: ${allData.personalInfo ? '✓' : '✗'}`);
    console.log(`    Funding Proof: ${allData.fundingProof ? '✓' : '✗'}`);
    console.log(`    Load time: ${allData.loadDurationMs}ms\n`);
    
    // Load again to show caching benefit
    console.log('12. Loading all data types again (should use cache):');
    const startTime = Date.now();
    const allData2 = await PassportDataService.getAllUserData(testUserId);
    const cachedLoadTime = Date.now() - startTime;
    console.log(`    Load time: ${cachedLoadTime}ms`);
    console.log(`    Performance improvement: ${Math.round((1 - cachedLoadTime / allData.loadDurationMs) * 100)}%\n`);
    
    // Final statistics
    console.log('13. Final Statistics:');
    const finalStats = PassportDataService.getCacheStats();
    console.log(`    Total Hits: ${finalStats.hits}`);
    console.log(`    Total Misses: ${finalStats.misses}`);
    console.log(`    Total Invalidations: ${finalStats.invalidations}`);
    console.log(`    Overall Hit Rate: ${finalStats.hitRate}%`);
    console.log(`    Total Requests: ${finalStats.totalRequests}`);
    
    console.log('\n=== Demo Complete ===');
    
  } catch (error) {
    console.error('Demo error:', error);
  }
}

// Export for use in React Native app
export default demonstrateCaching;

// Example usage in a React Native component:
/*
import demonstrateCaching from './path/to/CACHE_DEMO';

// In your component
useEffect(() => {
  demonstrateCaching();
}, []);
*/

// Expected Console Output:
/*
=== PassportDataService Caching Demo ===

1. Initializing PassportDataService...
   ✓ Initialized

2. First load - should be CACHE MISS:
[CACHE MISS] passport for user demo-user-123 (Total misses: 1)
   Result: Data loaded

3. Second load (within 5 min) - should be CACHE HIT:
[CACHE HIT] passport for user demo-user-123 (Total hits: 1)
   Result: Data loaded

4. Third load (within 5 min) - should be CACHE HIT:
[CACHE HIT] passport for user demo-user-123 (Total hits: 2)
   Result: Data loaded

5. Cache Statistics after 3 loads:
   Hits: 2
   Misses: 1
   Hit Rate: 66.67%
   Total Requests: 3

6. Updating passport - should INVALIDATE cache:
Cache invalidated for passport of user demo-user-123
   ✓ Cache invalidated

7. Load after update - should be CACHE MISS:
[CACHE MISS] passport for user demo-user-123 (Total misses: 2)
   Result: Data loaded

8. Final Cache Statistics:
=== PassportDataService Cache Statistics ===
Time period: 0.05 minutes
Cache hits: 2
Cache misses: 2
Cache invalidations: 1
Hit rate: 50.00%
Total requests: 4
==========================================

... and so on
*/
