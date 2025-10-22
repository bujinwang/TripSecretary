import axios from 'axios';

/**
 * TDAC API Service Patch - Fix for hanging at step 3/9
 * 
 * This patch adds:
 * 1. Request timeouts to prevent hanging
 * 2. Better error handling and recovery
 * 3. Retry logic for network issues
 * 4. Token validation before API calls
 */

const BASE_URL = 'https://tdac.immigration.go.th/arrival-card-api/api/v1';

/**
 * Enhanced fetch with timeout and retry
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`📤 Attempt ${attempt + 1}/${retries + 1}: ${options.method || 'GET'} ${url}`);
      const startTime = Date.now();
      
      const response = await axios({
        method: options.method || 'GET',
        url: url,
        headers: options.headers,
        data: options.body ? JSON.parse(options.body) : undefined, // axios expects object for data
        timeout: timeoutMs,
        signal: options.signal // Pass signal for AbortController if used externally
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`📥 Response received in ${duration}ms (status: ${response.status})`);
      
      return response;
      
    } catch (error) {
      if (axios.isCancel(error) || error.code === 'ECONNABORTED') { // Timeout or Abort
        console.error(`⏰ Request timeout after ${timeoutMs}ms (attempt ${attempt + 1})`);
        if (attempt === retries) {
          throw new Error(`Request timeout after ${timeoutMs}ms. The TDAC server may be slow or unresponsive.`);
        }
      } else if (error.response) {
        // Server responded with a status other than 2xx
        console.error(`❌ Server error on attempt ${attempt + 1}:`, error.response.status, error.response.data);
        if (attempt === retries) {
          throw new Error(`Server error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
        }
      } else if (error.request) {
        // Request made but no response received
        console.error(`❌ Network error on attempt ${attempt + 1}: No response received`);
        if (attempt === retries) {
          throw new Error(`Network error: No response received. Please check your internet connection.`);
        }
      } else {
        // Something else happened
        console.error(`❌ Request setup error on attempt ${attempt + 1}:`, error.message);
        if (attempt === retries) {
          throw new Error(`Request setup error: ${error.message}`);
        }
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

/**
 * Validate Cloudflare token before using it
 */
function validateCloudflareToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid Cloudflare token: token is missing or not a string');
  }
  
  if (token.length < 50) {
    throw new Error(`Invalid Cloudflare token: too short (${token.length} characters). Expected at least 50 characters.`);
  }
  
  if (token.length > 3000) {
    throw new Error(`Invalid Cloudflare token: too long (${token.length} characters). Token may be corrupted.`);
  }
  
  // Check for valid base64-like characters
  const validPattern = /^[A-Za-z0-9+/=._-]+$/;
  if (!validPattern.test(token)) {
    throw new Error('Invalid Cloudflare token: contains invalid characters');
  }
  
  console.log('✅ Cloudflare token validation passed');
  console.log(`   Token length: ${token.length} characters`);
  console.log(`   Token preview: ${token.substring(0, 30)}...${token.substring(token.length - 10)}`);
  
  return true;
}

/**
 * Enhanced initActionToken with timeout and validation
 */
async function initActionTokenFixed(cloudflareToken, submitId) {
  console.log('🔧 Using patched initActionToken with timeout protection...');
  
  // Validate token first
  validateCloudflareToken(cloudflareToken);
  
  // Generate submitId if not provided
  if (!submitId) {
    const prefix = 'mgh4r';
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let random = '';
    for (let i = 0; i < 18; i++) {
      random += chars[Math.floor(Math.random() * chars.length)];
    }
    submitId = prefix + random;
  }
  
  console.log('📤 Step 1: Sending initActionToken request (with 15s timeout)...');
  console.log('   submitId:', submitId);
  console.log('   token length:', cloudflareToken.length);
  
  const response = await fetchWithTimeout(
    `${BASE_URL}/security/initActionToken?submitId=${submitId}`,
    {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'TripSecretary/1.0 (Mobile App)'
      },
      body: JSON.stringify({
        token: cloudflareToken,
        langague: 'EN'  // Note: API expects "langague" (typo in their API)
      })
    },
    15000, // 15 second timeout
    2      // 2 retries
  );
  
  console.log('📥 Step 1 response status:', response.status, response.statusText);
  
  const data = response.data; // axios directly provides data
  
  if (!data || (typeof data === 'string' && data.length === 0)) {
    console.error('❌ Step 1: Empty response body');
    throw new Error('TDAC server returned empty response. The service may be temporarily unavailable.');
  }
  
  if (typeof data === 'string') {
    console.warn('⚠️ Step 1: Response data is a string, expected JSON. Preview:', data.substring(0, 200));
    try {
      const parsedData = JSON.parse(data);
      console.log('   Successfully parsed string data to JSON.');
      throw new Error('Invalid response from TDAC server: Unexpected string response');
    } catch (parseError) {
      console.error('❌ Step 1: JSON parse error for string response:', parseError.message);
      throw new Error(`Invalid response from TDAC server: ${parseError.message}`);
    }
  }
  
  console.log('✅ Step 1: initActionToken success');
  console.log('   response data:', JSON.stringify(data));
  
  // Validate response structure
  if (!data.data || !data.data.actionToken) {
    console.error('❌ Step 1: Missing actionToken in response');
    throw new Error('TDAC server response missing required actionToken. The service may have changed.');
  }
  
  const actionToken = data.data.actionToken;
  console.log('   actionToken received:', actionToken ? `Yes (${actionToken.length} chars)` : 'No');
  
  return { data, actionToken, submitId };
}

/**
 * Test function to diagnose the hanging issue
 */
async function testTDACConnection(cloudflareToken) {
  console.log('🔍 Testing TDAC connection with enhanced error handling...');
  
  try {
    const result = await initActionTokenFixed(cloudflareToken);
    console.log('✅ TDAC connection test successful!');
    console.log('   ActionToken received:', result.actionToken.substring(0, 50) + '...');
    return { success: true, result };
    
  } catch (error) {
    console.error('❌ TDAC connection test failed:', error.message);
    
    // Categorize the error for better user feedback
    let category = 'unknown';
    let userMessage = error.message;
    let suggestions = [];
    
    if (error.message.includes('timeout')) {
      category = 'timeout';
      userMessage = 'Connection timeout. The TDAC server is responding slowly.';
      suggestions = [
        'Check your internet connection',
        'Try again in a few minutes',
        'Use WebView mode if the issue persists'
      ];
    } else if (error.message.includes('Network error')) {
      category = 'network';
      userMessage = 'Network connection failed. Please check your internet.';
      suggestions = [
        'Check your WiFi or mobile data connection',
        'Try switching between WiFi and mobile data',
        'Restart your internet connection'
      ];
    } else if (error.message.includes('Invalid') || error.message.includes('malformed')) {
      category = 'token';
      userMessage = 'The security token is invalid. Please try again.';
      suggestions = [
        'Restart the submission process',
        'Clear app cache and try again',
        'Use WebView mode instead'
      ];
    } else if (error.message.includes('Rate limited')) {
      category = 'rate_limit';
      userMessage = 'Too many requests. Please wait before trying again.';
      suggestions = [
        'Wait 5-10 minutes before retrying',
        'Avoid multiple simultaneous submissions'
      ];
    } else if (error.message.includes('Server error') || error.message.includes('unavailable')) {
      category = 'server';
      userMessage = 'The TDAC system is temporarily unavailable.';
      suggestions = [
        'Try again in 10-15 minutes',
        'Check TDAC website status',
        'Use WebView mode as alternative'
      ];
    }
    
    return {
      success: false,
      error: error.message,
      category,
      userMessage,
      suggestions
    };
  }
}

export { initActionTokenFixed, testTDACConnection, validateCloudflareToken };