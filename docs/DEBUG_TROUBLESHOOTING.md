# Debug Troubleshooting Guide 🔧

## Current Issue: Debug Screen Shows "Running Tests..." But No Console Output

### What We've Done:
1. ✅ Created ConnectivityTestRunner component
2. ✅ Added TDACDebugScreen with navigation
3. ✅ Added debug buttons to HomeScreen and TDACHybridScreen
4. ✅ Created SimpleTDACTest as a fallback
5. ✅ Added comprehensive logging and error handling

### Possible Issues:

#### 1. Axios Import Problem
**Symptom**: Tests hang at "Running Tests..."
**Cause**: Axios might not be properly installed or imported in React Native
**Solution**: We added fallback handling for missing axios

#### 2. Async Function Issues
**Symptom**: Tests start but never complete
**Cause**: Unhandled promise rejections or infinite loops
**Solution**: Added try-catch blocks and timeout handling

#### 3. React Native Console Logging
**Symptom**: No console output visible
**Cause**: React Native console might be filtered or not showing
**Solution**: Check React Native debugger or Metro logs

## Immediate Steps to Try:

### Step 1: Check Console Output
Look for these logs in your React Native console:
```
🔍 Starting connectivity tests...
📡 Testing fetch connectivity...
📡 Testing fetch → Google (control)
⏱️  Fetch Google (control) with 5000ms timeout...
```

### Step 2: Try Simple Test First
1. **Navigate to the debug screen**
2. **Tap "Run Simple Tests"** (top button)
3. **Check console for**:
   ```
   🚀 Starting all tests...
   🔍 Testing Google (control)...
   📡 Starting Google fetch...
   ```

### Step 3: Check Network Permissions
Make sure your app has network permissions:

**iOS**: Check Info.plist for network security
**Android**: Check AndroidManifest.xml for INTERNET permission

### Step 4: Test Individual Components

#### Test 1: Basic Fetch
Try this in your React Native console:
```javascript
fetch('https://www.google.com', { method: 'HEAD' })
  .then(response => console.log('✅ Google works:', response.status))
  .catch(error => console.log('❌ Google failed:', error.message));
```

#### Test 2: TDAC Fetch
```javascript
fetch('https://tdac.immigration.go.th/arrival-card-api/api/v1/security/initActionToken?submitId=test123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: 'test', langague: 'EN' })
})
.then(response => console.log('✅ TDAC works:', response.status))
.catch(error => console.log('❌ TDAC failed:', error.message));
```

## Expected Results:

### If Simple Tests Work:
```
📊 Test result: { client: 'Google Control', success: true, duration: 234 }
📊 Test result: { client: 'Fetch TDAC', success: true, duration: 456 }
📊 Test result: { client: 'Axios TDAC', success: false, error: 'timeout' }
```

### If Tests Fail:
```
📊 Test result: { client: 'Google Control', success: false, error: 'Network request failed' }
```

## Alternative Testing Methods:

### Method 1: Direct Console Testing
Open React Native debugger and run:
```javascript
console.log('🔍 Testing basic connectivity...');
fetch('https://www.google.com', { method: 'HEAD' })
  .then(() => console.log('✅ Internet works'))
  .catch(e => console.log('❌ No internet:', e.message));
```

### Method 2: Simplified Component
Create a minimal test component:
```javascript
const TestButton = () => (
  <TouchableOpacity onPress={() => {
    console.log('🔍 Button pressed');
    fetch('https://www.google.com')
      .then(() => console.log('✅ Fetch works'))
      .catch(e => console.log('❌ Fetch failed:', e.message));
  }}>
    <Text>Test Network</Text>
  </TouchableOpacity>
);
```

### Method 3: Check Metro Logs
Look at your Metro bundler terminal for:
- Network request logs
- JavaScript errors
- React Native warnings

## Common Solutions:

### Solution 1: Clear React Native Cache
```bash
npx react-native start --reset-cache
```

### Solution 2: Restart Metro Bundler
```bash
# Stop current Metro
# Then restart:
npx react-native start
```

### Solution 3: Check Device/Simulator Network
- Try switching between WiFi and cellular
- Test on different device/simulator
- Check if corporate firewall is blocking requests

### Solution 4: Simplify the Test
Remove complex logic and test one thing at a time:
1. Test basic console.log
2. Test simple fetch to Google
3. Test fetch to TDAC
4. Add timeout handling
5. Add error handling

## Debug Checklist:

- [ ] Can see console logs in React Native debugger?
- [ ] Does basic `console.log('test')` work?
- [ ] Does `fetch('https://www.google.com')` work?
- [ ] Does the simple test button respond?
- [ ] Are there any JavaScript errors in Metro logs?
- [ ] Is axios properly installed (`npm list axios`)?
- [ ] Are network permissions configured correctly?

## Next Steps Based on Results:

### If No Console Output at All:
**Issue**: React Native console/debugger problem
**Solution**: Check Metro logs, restart debugger

### If Google Works, TDAC Fails:
**Issue**: TDAC-specific networking problem
**Solution**: Check firewall, DNS, or server status

### If Nothing Works:
**Issue**: Network permissions or configuration
**Solution**: Check app permissions, network settings

### If Fetch Works, Axios Hangs:
**Issue**: Confirmed - axios incompatibility in React Native
**Solution**: ✅ Use fetch implementation (already done)

The goal is to isolate whether the issue is:
1. React Native console/logging
2. Network connectivity
3. TDAC API specific
4. Axios vs fetch behavior
5. App configuration

Once we identify the specific issue, we can provide a targeted solution.