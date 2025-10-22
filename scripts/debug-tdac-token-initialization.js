import axios from 'axios';

/**
 * Debug script for TDAC token initialization hang
 * Run this to diagnose why step 3/9 is hanging
 */

const BASE_URL = 'https://tdac.immigration.go.th/arrival-card-api/api/v1';

/**
 * Test the initActionToken endpoint directly
 */
async function testInitActionToken(cloudflareToken) {
  console.log('🔍 Testing initActionToken endpoint...');
  console.log('   Token length:', cloudflareToken?.length || 0);
  console.log('   Token preview:', cloudflareToken?.substring(0, 50) + '...');
  
  // Generate submitId like the service does
  const prefix = 'mgh4r';
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let random = '';
  for (let i = 0; i < 18; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  const submitId = prefix + random;
  
  console.log('   Generated submitId:', submitId);
  
  try {
    console.log('📤 Making request to initActionToken...');
    const startTime = Date.now();
    
    const response = await axios.post(
      `${BASE_URL}/security/initActionToken?submitId=${submitId}`,
      {
        token: cloudflareToken,
        langague: 'EN'  // Note: API has typo "langague" instead of "language"
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('📥 Response received after', duration + 'ms');
    console.log('   Status:', response.status, response.statusText);
    console.log('   Headers:', response.headers); // axios headers are already an object
    
    const data = response.data; // axios directly provides data
    console.log('   Response body length:', JSON.stringify(data).length);
    console.log('   Response preview:', JSON.stringify(data).substring(0, 200));
    
    if (!data || (typeof data === 'string' && data.length === 0)) {
      console.error('❌ Empty response body');
      return { success: false, error: 'Empty response' };
    }
    
    if (typeof data === 'string') {
      console.warn('⚠️ Response data is a string, expected JSON. Preview:', data.substring(0, 200));
      try {
        const parsedData = JSON.parse(data);
        console.log('   Successfully parsed string data to JSON.');
        return { success: false, error: 'Unexpected string response', responseText: data };
      } catch (parseError) {
        console.error('❌ JSON parse error for string response:', parseError.message);
        return { success: false, error: 'Invalid JSON string', responseText: data };
      }
    }
    
    console.log('✅ JSON parsed successfully');
    console.log('   Response data:', JSON.stringify(data, null, 2));
    
    if (data.data?.actionToken) {
      console.log('✅ Action token received:', data.data.actionToken.substring(0, 50) + '...');
      return { success: true, data, actionToken: data.data.actionToken };
    } else {
      console.error('❌ No action token in response');
      return { success: false, error: 'No action token', data };
    }
    
  } catch (networkError) {
    console.error('❌ Network error:', networkError.message);
    return { success: false, error: networkError.message, type: 'network' };
  }
}

/**
 * Test network connectivity to TDAC
 */
async function testTDACConnectivity() {
  console.log('🌐 Testing TDAC connectivity...');
  
  try {
    const response = await fetch('https://tdac.immigration.go.th/', {
      method: 'HEAD',
      timeout: 10000
    });
    
    console.log('✅ TDAC website reachable');
    console.log('   Status:', response.status);
    return true;
  } catch (error) {
    console.error('❌ TDAC website unreachable:', error.message);
    return false;
  }
}

/**
 * Validate Cloudflare token format
 */
function validateCloudflareToken(token) {
  console.log('🔍 Validating Cloudflare token...');
  
  if (!token) {
    console.error('❌ Token is null or undefined');
    return false;
  }
  
  if (typeof token !== 'string') {
    console.error('❌ Token is not a string:', typeof token);
    return false;
  }
  
  if (token.length < 100) {
    console.error('❌ Token too short:', token.length, 'characters');
    console.error('   Token:', token);
    return false;
  }
  
  if (token.length > 2000) {
    console.error('❌ Token too long:', token.length, 'characters (might be corrupted)');
    return false;
  }
  
  // Check if token looks like a valid Cloudflare Turnstile token
  // Turnstile tokens are typically base64-like strings
  const base64Pattern = /^[A-Za-z0-9+/=._-]+$/;
  if (!base64Pattern.test(token)) {
    console.error('❌ Token contains invalid characters');
    console.error('   Token preview:', token.substring(0, 100));
    return false;
  }
  
  console.log('✅ Token format appears valid');
  console.log('   Length:', token.length);
  console.log('   Preview:', token.substring(0, 50) + '...' + token.substring(token.length - 20));
  return true;
}

/**
 * Main diagnostic function
 */
async function diagnoseTDACTokenHang(cloudflareToken) {
  console.log('🚀 Starting TDAC token initialization diagnosis...');
  console.log('=' .repeat(60));
  
  // Step 1: Validate token
  if (!validateCloudflareToken(cloudflareToken)) {
    console.log('❌ Diagnosis complete: Invalid Cloudflare token');
    return { issue: 'invalid_token' };
  }
  
  // Step 2: Test connectivity
  const isConnected = await testTDACConnectivity();
  if (!isConnected) {
    console.log('❌ Diagnosis complete: Network connectivity issue');
    return { issue: 'network_connectivity' };
  }
  
  // Step 3: Test initActionToken endpoint
  const result = await testInitActionToken(cloudflareToken);
  
  console.log('=' .repeat(60));
  console.log('🏁 Diagnosis complete');
  
  if (result.success) {
    console.log('✅ initActionToken working correctly');
    console.log('   The hang might be in subsequent API calls');
    return { issue: 'none', actionToken: result.actionToken };
  } else {
    console.log('❌ initActionToken failed:', result.error);
    
    if (result.type === 'network') {
      return { issue: 'network_error', details: result.error };
    } else if (result.status === 400) {
      return { issue: 'invalid_token_format', details: result.error };
    } else if (result.status === 403) {
      return { issue: 'token_rejected', details: result.error };
    } else if (result.status >= 500) {
      return { issue: 'server_error', details: result.error };
    } else {
      return { issue: 'unknown_api_error', details: result.error };
    }
  }
}

// Export for use in React Native
export default diagnoseTDACTokenHang;

// Usage example:
/*
import diagnoseTDACTokenHang from './debug-tdac-token-initialization';

// In your component or service:
const cloudflareToken = "your_extracted_token_here";
const diagnosis = await diagnoseTDACTokenHang(cloudflareToken);
console.log('Diagnosis result:', diagnosis);
*/