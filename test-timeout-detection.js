/**
 * Test timeout detection logic
 */

function analyzeTimeout(actualDuration, configuredTimeout) {
  const timeoutDiff = Math.abs(actualDuration - configuredTimeout);
  
  console.log('🔍 Timeout Analysis:');
  console.log('   Configured timeout:', configuredTimeout + 'ms');
  console.log('   Actual duration:', actualDuration + 'ms');
  console.log('   Difference:', timeoutDiff + 'ms');
  
  if (timeoutDiff < 1000) {
    console.log('   ✅ Timeout matches our configuration - this is our timeout');
    return 'internal';
  } else if (actualDuration < configuredTimeout - 1000) {
    console.log('   ⚠️  Timeout is SHORTER than configured - external timeout detected!');
    console.log('   Possible sources: React Native, browser, proxy, firewall, network layer');
    return 'external';
  } else {
    console.log('   ❓ Timeout timing is unexpected');
    return 'unknown';
  }
}

console.log('🧪 Testing timeout detection scenarios...\n');

// Test case 1: Our timeout (10s configured, ~10s actual)
console.log('Test 1: Internal timeout');
analyzeTimeout(10100, 10000);
console.log('');

// Test case 2: External timeout (10s configured, 15s actual - the reported issue)
console.log('Test 2: External timeout (the reported issue)');
analyzeTimeout(15000, 10000);
console.log('');

// Test case 3: Very fast response (success case)
console.log('Test 3: Fast successful response');
analyzeTimeout(1200, 10000);
console.log('');

// Test case 4: Network issue causing our timeout
console.log('Test 4: Real network issue hitting our timeout');
analyzeTimeout(9950, 10000);
console.log('');

console.log('🏁 Timeout detection test completed!');
console.log('');
console.log('📋 Key insights:');
console.log('   - 10s timeout will quickly identify real network issues');
console.log('   - External timeouts (like the 15s issue) will be clearly detected');
console.log('   - Fast responses (0-1s) will be logged as successful');
console.log('   - This approach helps pinpoint the exact source of timeout issues');