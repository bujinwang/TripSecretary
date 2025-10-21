# React Native TDAC Debug Guide 🔧

## How to Access Debug Tools

### Method 1: From Home Screen
1. **Open the app** in development mode (`__DEV__ = true`)
2. **Look for the 🔧 debug icon** next to the 🌐 language selector in the top-right
3. **Tap the 🔧 icon** to open the TDAC Debug & Connectivity screen

### Method 2: From TDAC Screens
1. **Navigate to any TDAC screen** (TDACHybridScreen, etc.)
2. **Look for the orange "🔧 Debug" button** in the top-right corner
3. **Tap the debug button** to open the connectivity tests

### Method 3: Direct Navigation (Development)
```javascript
// In any screen with navigation access
navigation.navigate('TDACDebug');
```

## What the Debug Tools Test

### 🔍 Connectivity Tests
- **Google (control)** - Verifies basic internet connectivity
- **TDAC Base** - Tests connection to TDAC servers
- **TDAC Init Token** - Tests the problematic initActionToken endpoint

### 📊 Client Comparisons
- **Fetch + AbortController** - React Native compatible approach
- **Axios** - Library approach (may hang in React Native)

### ⏱️ Timeout Testing
Tests with multiple timeout values:
- 5 seconds
- 10 seconds  
- 15 seconds
- 30 seconds

## Expected Results

### ✅ Working Scenario:
```
fetch → Google (control)     ✓ Status: 200, Duration: 234ms
fetch → TDAC Base           ✓ Status: 200, Duration: 456ms  
fetch → TDAC Init Token     ✓ Status: 200, Duration: 789ms

axios → Google (control)     ✓ Status: 200, Duration: 245ms
axios → TDAC Base           ✓ Status: 200, Duration: 467ms
axios → TDAC Init Token     ❌ TimeoutError: timeout of 30000ms exceeded
```

### ❌ Problem Scenario:
```
fetch → Google (control)     ✓ Status: 200, Duration: 234ms
fetch → TDAC Base           ❌ NetworkError: Failed to fetch
fetch → TDAC Init Token     ❌ NetworkError: Failed to fetch

axios → Google (control)     ✓ Status: 200, Duration: 245ms  
axios → TDAC Base           ❌ ECONNABORTED: timeout of 5000ms exceeded
axios → TDAC Init Token     ❌ ECONNABORTED: timeout of 5000ms exceeded
```

## Interpreting Results

### 🟢 Green Results (Success)
- **Duration < 1000ms**: Excellent performance
- **Duration 1000-3000ms**: Good performance  
- **Duration > 3000ms**: Slow but working

### 🟠 Orange Results (Timeout)
- **AbortError**: Fetch timeout (expected behavior)
- **ECONNABORTED**: Axios timeout (expected behavior)
- **Duration ≈ timeout value**: Proper timeout handling

### 🔴 Red Results (Error)
- **NetworkError**: Network connectivity issues
- **TypeError**: Code/configuration issues
- **Duration << timeout**: Immediate failure

## Common Issues & Solutions

### Issue 1: Axios Hangs on TDAC
**Symptoms:**
- Axios requests to TDAC never complete or timeout
- Fetch requests work fine
- Google requests work with both

**Solution:**
- ✅ Use fetch with AbortController (already implemented)
- ❌ Don't use axios for TDAC API calls in React Native

### Issue 2: All Requests Fail
**Symptoms:**
- Both fetch and axios fail
- Even Google (control) fails

**Possible Causes:**
- No internet connection
- Corporate firewall blocking requests
- Proxy configuration issues
- iOS/Android network permissions

**Solutions:**
- Check device internet connection
- Try on different network (WiFi vs cellular)
- Check app network permissions
- Test on different device/simulator

### Issue 3: Slow Response Times
**Symptoms:**
- Requests succeed but take > 5 seconds
- Consistent slow performance

**Possible Causes:**
- Slow network connection
- Server-side performance issues
- DNS resolution delays

**Solutions:**
- Test on faster network
- Check if issue is consistent across devices
- Monitor TDAC server status

## React Native Specific Checks

### Metro Bundler Configuration
Check `metro.config.js` for network-related settings:
```javascript
// Ensure no network interceptors are interfering
module.exports = {
  // ... your config
};
```

### iOS Network Permissions
Check `Info.plist` for network security settings:
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

### Android Network Permissions
Check `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Platform-Specific Testing

### iOS Simulator vs Device
- **Simulator**: May have different network behavior
- **Device**: Real-world network conditions
- **Test both** to identify platform-specific issues

### Android Emulator vs Device  
- **Emulator**: Uses host machine network
- **Device**: Uses device network stack
- **Different proxy/firewall rules** may apply

## Debug Output Analysis

### Successful TDAC Connection:
```
🔍 Testing fetch TDAC implementation...
⏳ Starting fetch request (React Native compatible)...
📥 Response received:
   Status: 200 OK
   Duration: 409ms
✅ Success! ActionToken received
```

### Failed TDAC Connection:
```
🔍 Testing axios TDAC implementation...
⏳ Starting axios request...
❌ Request failed:
   Duration: 30000ms
   Error: ECONNABORTED: timeout of 30000ms exceeded
⏰ This was a timeout error
```

## Next Steps Based on Results

### If Fetch Works, Axios Fails:
✅ **Solution confirmed** - Use fetch implementation (already done)

### If Both Fail:
1. **Check network connectivity** - Test with mobile data vs WiFi
2. **Check firewall/proxy** - Corporate networks may block TDAC
3. **Test on different device** - Rule out device-specific issues
4. **Check TDAC server status** - Server may be down

### If Both Work:
🎉 **No network issues** - Problem may be elsewhere in the app flow

## Logging & Monitoring

The debug tools automatically log all test results with:
- **Timestamp** - When the test was run
- **Client type** - fetch vs axios
- **Endpoint** - Which API was tested  
- **Duration** - How long the request took
- **Status/Error** - Success or failure details

Use this data to identify patterns and track improvements over time.

## Support Information

When reporting TDAC connectivity issues, include:
1. **Debug test results** - Screenshots of the connectivity tests
2. **Device information** - iOS/Android version, device model
3. **Network information** - WiFi/cellular, location, ISP
4. **App version** - Development build info
5. **Reproduction steps** - How to trigger the issue

This comprehensive debug information will help identify and resolve React Native specific networking issues with the TDAC API.