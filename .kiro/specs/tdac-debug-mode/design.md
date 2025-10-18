# TDAC Debug Mode Design

## Overview

The TDAC Debug Mode feature enhances the existing TDACWebViewScreen with development-only debugging capabilities. It provides form visibility, manual control, and detailed logging to help developers verify form data accuracy and troubleshoot submission issues.

## Architecture

### Debug Mode Detection
- Utilize React Native's `__DEV__` flag to detect development environment
- Add a debug toggle in the UI that's only visible in development mode
- Store debug mode state in component state and AsyncStorage for persistence

### Enhanced Logging System
- Extend existing JavaScript injection with comprehensive logging
- Create a debug overlay component to display real-time form data
- Implement structured logging with timestamps and categorization

### Manual Control System
- Modify auto-fill and navigation logic to respect debug mode
- Add manual trigger buttons for each auto-fill step
- Implement visual feedback for field population success/failure

## Components and Interfaces

### TDACWebViewScreen Enhancements

#### New State Variables
```javascript
const [debugMode, setDebugMode] = useState(__DEV__ && false);
const [debugLogs, setDebugLogs] = useState([]);
const [fieldStatus, setFieldStatus] = useState({});
const [showDebugOverlay, setShowDebugOverlay] = useState(false);
```

#### Debug Toggle Component
```javascript
const DebugToggle = () => (
  <TouchableOpacity 
    style={styles.debugToggle}
    onPress={() => setDebugMode(!debugMode)}
  >
    <Text>🐛 Debug: {debugMode ? 'ON' : 'OFF'}</Text>
  </TouchableOpacity>
);
```

#### Debug Overlay Component
```javascript
const DebugOverlay = ({ logs, fieldStatus, onClose }) => (
  <Modal visible={showDebugOverlay} animationType="slide">
    <SafeAreaView style={styles.debugContainer}>
      <ScrollView>
        {/* Real-time form data display */}
        {/* Field status indicators */}
        {/* Console logs */}
      </ScrollView>
    </SafeAreaView>
  </Modal>
);
```

### Enhanced JavaScript Injection

#### Debug-Aware Auto-Fill Function
```javascript
const autoFillFieldDebug = (value, searchTerms, fieldName) => {
  const jsCode = `
    (function() {
      const debugMode = ${debugMode};
      const fieldName = '${fieldName}';
      
      if (debugMode) {
        console.log('🐛 [DEBUG] Starting auto-fill for:', fieldName);
        console.log('🐛 [DEBUG] Value:', '${value}');
        console.log('🐛 [DEBUG] Search terms:', ${JSON.stringify(searchTerms)});
      }
      
      // Enhanced field finding with debug logging
      // ... existing auto-fill logic with debug enhancements
      
      if (debugMode) {
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'debug_field_result',
          fieldName: fieldName,
          success: filled,
          value: '${value}',
          timestamp: new Date().toISOString()
        }));
      }
    })();
  `;
  
  webViewRef.current?.injectJavaScript(jsCode);
};
```

#### Debug-Aware Navigation Control
```javascript
const checkAndAutoFillDebug = () => {
  const jsCode = `
    (function() {
      const debugMode = ${debugMode};
      
      if (window.needAutoFill && !window.autoFillExecuted) {
        const hasInputs = document.querySelectorAll('input[formcontrolname]').length > 0;
        
        if (hasInputs) {
          if (debugMode) {
            console.log('🐛 [DEBUG] Form detected, waiting for manual trigger');
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug_form_ready',
              inputCount: document.querySelectorAll('input[formcontrolname]').length,
              timestamp: new Date().toISOString()
            }));
          } else {
            // Original auto-fill logic
            window.autoFillExecuted = true;
            window.needAutoFill = false;
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'trigger_auto_fill'
            }));
          }
        }
      }
    })();
  `;
  webViewRef.current?.injectJavaScript(jsCode);
};
```

## Data Models

### Debug Log Entry
```javascript
interface DebugLogEntry {
  timestamp: string;
  type: 'field_fill' | 'navigation' | 'validation' | 'error';
  fieldName?: string;
  value?: string;
  success: boolean;
  message: string;
  details?: any;
}
```

### Field Status
```javascript
interface FieldStatus {
  [fieldName: string]: {
    attempted: boolean;
    success: boolean;
    value: string;
    searchTerms: string[];
    errorMessage?: string;
    timestamp: string;
  }
}
```

## Error Handling

### Debug Mode Error Capture
- Wrap all debug operations in try-catch blocks
- Log errors to both console and debug overlay
- Provide fallback to normal operation if debug features fail
- Include error context and stack traces in debug logs

### Field Validation Errors
- Detect and log form validation failures
- Highlight problematic fields in debug overlay
- Provide suggestions for common field matching issues
- Allow retry of individual field auto-fill operations

## Testing Strategy

### Development Testing
- Test debug mode toggle functionality
- Verify debug overlay displays correct information
- Test manual auto-fill triggers for each field type
- Validate logging accuracy and completeness

### Debug Mode Isolation
- Ensure debug features are completely disabled in production builds
- Test that debug code doesn't affect normal operation when disabled
- Verify no debug-related performance impact in production

### Field Matching Testing
- Test auto-fill with various form layouts
- Verify debug logging captures all field matching attempts
- Test manual field population in debug mode
- Validate field status indicators accuracy

## Implementation Notes

### Performance Considerations
- Debug logging should be lightweight and non-blocking
- Debug overlay should be lazy-loaded only when needed
- Minimize impact on WebView performance during debugging

### Security Considerations
- Ensure debug features are completely removed from production builds
- Avoid logging sensitive information in debug mode
- Sanitize all debug output to prevent XSS vulnerabilities

### User Experience
- Debug controls should be intuitive for developers
- Provide clear visual feedback for all debug operations
- Ensure debug mode doesn't interfere with normal user testing