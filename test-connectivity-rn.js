/**
 * React Native Connectivity Test for TDAC API Issues
 * Tests network connectivity, timeouts, and HTTP client differences
 */

const axios = require('axios');

// Test configuration
const TDAC_BASE_URL = 'https://tdac.immigration.go.th/arrival-card-api/api/v1';
const TEST_TIMEOUTS = [5000, 10000, 15000, 30000];
const TEST_ENDPOINTS = [
  { name: 'Google (control)', url: 'https://www.google.com', method: 'HEAD' },
  { name: 'TDAC Base', url: `${TDAC_BASE_URL}/health`, method: 'GET' },
  { name: 'TDAC Init Token Endpoint', url: `${TDAC_BASE_URL}/security/initActionToken`, method: 'POST' }
];

/**
 * Test basic connectivity with fetch
 */
const testConnectivityWithFetch = async () => {
  console.log('\n🌐 Testing connectivity with fetch...');

  for (const endpoint of TEST_ENDPOINTS) {
    for (const timeout of TEST_TIMEOUTS) {
      try {
        console.log(`Testing ${endpoint.name} with ${timeout}ms timeout...`);
        const start = Date.now();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          signal: controller.signal,
          headers: endpoint.method === 'POST' ? {
            'Content-Type': 'application/json'
          } : {}
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - start;

        console.log(`✓ ${endpoint.name} (${timeout}ms): ${response.status} in ${duration}ms`);
      } catch (error) {
        console.log(`✗ ${endpoint.name} (${timeout}ms): ${error.name} - ${error.message}`);
      }
    }
  }
};

/**
 * Test axios connectivity
 */
const testConnectivityWithAxios = async () => {
  console.log('\n📡 Testing connectivity with axios...');

  for (const endpoint of TEST_ENDPOINTS) {
    for (const timeout of TEST_TIMEOUTS) {
      const startTime = Date.now();
      try {
        console.log(`Testing ${endpoint.name} with ${timeout}ms timeout...`);

        const config = {
          method: endpoint.method,
          url: endpoint.url,
          timeout: timeout,
          headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'User-Agent': 'PostmanRuntime/7.49.0'
          }
        };

        if (endpoint.method === 'POST') {
          config.data = { test: 'connectivity' };
        }

        const response = await axios(config);
        const duration = Date.now() - startTime;

        console.log(`✓ ${endpoint.name} (${timeout}ms): ${response.status} in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`✗ ${endpoint.name} (${timeout}ms): ${error.code || error.name} - ${error.message} (${duration}ms)`);
      }
    }
  }
};

/**
 * Test TDAC-specific request (similar to initActionToken)
 */
const testTDACInitActionToken = async () => {
  console.log('\n🎯 Testing TDAC initActionToken with different approaches...');

  const testToken = "test_token_placeholder"; // Use a test token
  const submitId = 'test' + Math.random().toString(36).substring(2, 15);

  // Test 1: With axios (like other TDAC methods)
  console.log('Test 1: Axios implementation');
  try {
    const start = Date.now();
    const response = await axios.post(
      `${TDAC_BASE_URL}/security/initActionToken?submitId=${submitId}`,
      {
        token: testToken,
        langague: 'EN'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'User-Agent': 'PostmanRuntime/7.49.0'
        },
        timeout: 30000
      }
    );
    console.log(`✓ Axios: ${response.status} in ${Date.now() - start}ms`);
  } catch (error) {
    console.log(`✗ Axios: ${error.code || error.name} - ${error.message}`);
  }

  // Test 2: With fetch + AbortController (current RN implementation)
  console.log('Test 2: Fetch + AbortController implementation');
  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      `${TDAC_BASE_URL}/security/initActionToken?submitId=${submitId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'User-Agent': 'PostmanRuntime/7.49.0'
        },
        body: JSON.stringify({
          token: testToken,
          langague: 'EN'
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);
    console.log(`✓ Fetch: ${response.status} in ${Date.now() - start}ms`);
  } catch (error) {
    console.log(`✗ Fetch: ${error.name} - ${error.message}`);
  }
};

/**
 * Test network configuration
 */
const testNetworkConfig = async () => {
  console.log('\n⚙️ Testing network configuration...');

  // Test DNS resolution
  try {
    const dnsStart = Date.now();
    const dnsResponse = await fetch('https://dns.google/resolve?name=tdac.immigration.go.th&type=A');
    const dnsData = await dnsResponse.json();
    console.log(`✓ DNS resolution: ${Date.now() - dnsStart}ms`);
    console.log(`  IP addresses: ${dnsData.Answer?.map(a => a.data).join(', ') || 'none'}`);
  } catch (error) {
    console.log(`✗ DNS resolution failed: ${error.message}`);
  }

  // Test SSL/TLS
  try {
    const sslStart = Date.now();
    const sslResponse = await fetch('https://www.howsmyssl.com/a/check');
    const sslData = await sslResponse.json();
    console.log(`✓ SSL check: ${Date.now() - sslStart}ms`);
    console.log(`  TLS version: ${sslData.tls_version}`);
  } catch (error) {
    console.log(`✗ SSL check failed: ${error.message}`);
  }
};

/**
 * Run all connectivity tests
 */
const runConnectivityTests = async () => {
  console.log('🚀 Starting React Native TDAC Connectivity Tests');
  console.log('=' .repeat(50));

  try {
    await testConnectivityWithFetch();
    await testConnectivityWithAxios();
    await testTDACInitActionToken();
    await testNetworkConfig();
  } catch (error) {
    console.error('💥 Test suite error:', error);
    console.error('Stack:', error.stack);
  }

  console.log('\n🏁 Connectivity tests completed');
};

// Export for use in React Native
module.exports = {
  runConnectivityTests,
  testConnectivityWithFetch,
  testConnectivityWithAxios,
  testTDACInitActionToken,
  testNetworkConfig
};

// Run if called directly
if (require.main === module) {
  runConnectivityTests();
}