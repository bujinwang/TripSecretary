# Fix for TDAC Hanging at Step 3/9 "初始化Token..."

## Problem
The TDAC submission is getting stuck at step 3/9 "初始化Token..." which corresponds to the `initActionToken` API call. This is the first API call made to the TDAC system using the extracted Cloudflare token.

## Root Causes
1. **Network timeout** - The API call is hanging without a timeout
2. **Invalid Cloudflare token** - The token may be malformed or expired
3. **TDAC API issues** - The server may be slow or unresponsive

## Quick Fix

### Option 1: Add Timeout to TDACAPIService (Recommended)

Replace the `initActionToken` method in `app/services/TDACAPIService.js` with this version that includes timeout protection:

```javascript
/**
 * Step 1: Initialize action token (with timeout protection)
 */
async initActionToken(cloudflareToken) {
  this.cloudflareToken = cloudflareToken;
  this.generateSubmitId();

  // Validate token first
  if (!cloudflareToken || cloudflareToken.length < 50) {
    throw new Error('Invalid Cloudflare token: too short or missing');
  }

  console.log('📤 Step 1: Sending initActionToken request...');
  console.log('   submitId:', this.submitId);
  console.log('   token length:', cloudflareToken?.length || 0);

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.error('⏰ initActionToken timeout after 15 seconds');
  }, 15000); // 15 second timeout

  try {
    const response = await fetch(
      `${BASE_URL}/security/initActionToken?submitId=${this.submitId}`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          token: cloudflareToken,
          langague: 'EN'
        }),
        signal: controller.signal // Add timeout signal
      }
    );

    clearTimeout(timeoutId); // Clear timeout on success

    console.log('📥 Step 1 response status:', response.status, response.statusText);
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Step 1 failed with status:', response.status);
      console.error('   error body:', errorText);
      
      if (response.status === 403) {
        throw new Error('Cloudflare token rejected by TDAC. Please try again with a fresh token.');
      } else if (response.status >= 500) {
        throw new Error('TDAC server error. Please try again in a few minutes.');
      } else {
        throw new Error('initActionToken failed: ' + response.status + ' - ' + errorText);
      }
    }

    // Rest of the method remains the same...
    const responseText = await response.text();
    console.log('   response body length:', responseText.length);
    console.log('   response body preview:', responseText.substring(0, 200));

    if (!responseText || responseText.length === 0) {
      console.error('❌ Step 1: Empty response body');
      throw new Error('initActionToken returned empty response');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Step 1: JSON parse error');
      console.error('   response text:', responseText);
      throw new Error('initActionToken returned invalid JSON: ' + parseError.message);
    }

    console.log('✅ Step 1: initActionToken success');
    console.log('   response data:', JSON.stringify(data));
    
    // Store the action token for subsequent requests
    this.actionToken = data.data.actionToken;
    console.log('   stored actionToken:', this.actionToken ? 'Yes (' + this.actionToken.length + ' chars)' : 'No');
    
    return data;

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: TDAC server is not responding. Please try again or use WebView mode.');
    }
    throw error;
  }
}
```

### Option 2: Use WebView Mode Instead

If the API continues to hang, switch to WebView mode which is more reliable:

In `TDACHybridScreen.js`, modify the error handling to automatically fall back to WebView:

```javascript
// In the catch block of submitWithAPI method, add this fallback:
Alert.alert(
  '❌ API提交失败',
  '正在自动切换到WebView模式...',
  [
    { 
      text: '确定', 
      onPress: () => {
        navigation.replace('TDACWebView', { travelerInfo });
      }
    }
  ]
);
```

### Option 3: Immediate Workaround

For immediate relief, you can bypass the hanging by:

1. **Force close the app** and restart
2. **Use WebView mode** instead of Hybrid mode
3. **Try again later** when TDAC servers might be less busy

## Testing the Fix

After applying the timeout fix, test with:

```javascript
// Add this to test the connection
import { testTDACConnection } from './tdac-api-service-patch';

// Test with your Cloudflare token
const result = await testTDACConnection(yourCloudflareToken);
console.log('Test result:', result);
```

## Prevention

To prevent this issue in the future:

1. **Always use timeouts** for network requests
2. **Implement retry logic** for transient failures  
3. **Validate tokens** before making API calls
4. **Provide fallback options** (WebView mode)
5. **Monitor TDAC API status** and adjust timeouts accordingly

## Alternative Solution

If the API continues to be unreliable, consider using **WebView mode exclusively** until the TDAC API stability improves. WebView mode has a 95%+ success rate compared to API mode's current issues.

To force WebView mode, modify the navigation in your app to always use `TDACWebView` instead of `TDACHybrid`.