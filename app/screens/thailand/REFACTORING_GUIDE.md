# TDACWebViewScreen Refactoring Guide

## Overview

TDACWebViewScreen.js has been refactored from **2026 lines** into smaller, reusable components and hooks. This guide explains the new architecture and how to use the refactored components.

## New Architecture

### Before (Monolithic)
```
TDACWebViewScreen.js (2026 lines)
├── Language selection logic (300+ lines)
├── Arrival card button logic (200+ lines)
├── WebView state management (100+ lines)
├── Field helper rendering (150+ lines)
└── Message handling (200+ lines)
```

### After (Modular)
```
TDACWebViewScreen.js (estimated ~400 lines)
├── useTDACWebView hook
├── FieldHelperPanel component
├── LanguageSelectorService
├── ArrivalCardButtonService
└── Existing components (HelperModal, QRCodeModal, DataComparisonModal)
```

## New Components & Services

### 1. LanguageSelectorService

**Location**: `app/services/tdac/LanguageSelectorService.js`

**Purpose**: Generates JavaScript code for automatic language selection in TDAC WebView

**Usage**:
```javascript
import LanguageSelectorService from '../../services/tdac/LanguageSelectorService';

// Generate script for language selection
const preferredLanguage = getPreferredLanguage(travelerInfo, passport);
const jsCode = LanguageSelectorService.generateLanguageSelectionScript(preferredLanguage);

// Inject into WebView
webViewRef.current.injectJavaScript(jsCode);
```

**Features**:
- Multi-strategy search (header → page → all elements)
- Multi-language support (English, Chinese, Japanese, Korean, Russian)
- Automatic dropdown opening and option selection
- WebView message communication for debugging

---

### 2. ArrivalCardButtonService

**Location**: `app/services/tdac/ArrivalCardButtonService.js`

**Purpose**: Generates JavaScript code for automatic Arrival Card button clicking

**Usage**:
```javascript
import ArrivalCardButtonService from '../../services/tdac/ArrivalCardButtonService';

// Generate script for button clicking
const jsCode = ArrivalCardButtonService.generateArrivalCardClickScript();

// Inject into WebView
webViewRef.current.injectJavaScript(jsCode);
```

**Features**:
- Multi-language pattern matching (English, Chinese, Japanese, Korean, Russian)
- Scoring system for best match
- Visibility checking before clicking
- Prevents duplicate clicks

---

### 3. useTDACWebView Hook

**Location**: `app/hooks/tdac/useTDACWebView.js`

**Purpose**: Manages TDAC WebView state and message handling

**Usage**:
```javascript
import useTDACWebView from '../../hooks/tdac/useTDACWebView';

const MyComponent = ({ travelerInfo, passport }) => {
  const {
    webViewRef,
    isLoading,
    showCloudflareReminder,
    showVisualMask,
    handleWebViewMessage,
    handleLoadEnd,
    reload,
  } = useTDACWebView({
    travelerInfo,
    passport,
    onQRCodeDetected: (message) => {
      console.log('QR Code detected:', message);
    },
  });

  return (
    <WebView
      ref={webViewRef}
      onMessage={handleWebViewMessage}
      onLoadEnd={handleLoadEnd}
      // ... other props
    />
  );
};
```

**Returns**:
- `webViewRef`: Ref for WebView component
- `isLoading`: Loading state
- `showCloudflareReminder`: Show Cloudflare modal
- `showVisualMask`: Show visual overlay
- `handleWebViewMessage`: Message handler
- `handleLoadEnd`: Load complete handler
- `autoSelectLanguage()`: Trigger language selection
- `autoClickArrivalCard()`: Trigger button click
- `reload()`: Reload WebView

---

### 4. FieldHelperPanel Component

**Location**: `app/components/tdac/FieldHelperPanel.js`

**Purpose**: Displays floating panel with copyable passport/travel data fields

**Usage**:
```javascript
import FieldHelperPanel from '../../components/tdac/FieldHelperPanel';

const fields = [
  { name: 'passportNo', label: '护照号码', value: 'E12345678' },
  { name: 'firstName', label: '名', value: 'JOHN' },
  { name: 'lastName', label: '姓', value: 'DOE' },
  // ... more fields
];

<FieldHelperPanel
  visible={showHelper}
  onClose={() => setShowHelper(false)}
  fields={fields}
/>
```

**Props**:
- `visible` (boolean): Panel visibility
- `onClose` (function): Close callback
- `fields` (array): Array of field objects with `name`, `label`, `value`

**Features**:
- Floating bottom panel with backdrop
- Copy to clipboard with visual feedback
- Scrollable field list
- Filters out empty fields automatically

---

## Migration Example

### Before (Old TDACWebViewScreen.js)

```javascript
// 300+ lines of language selection code
const autoSelectLanguage = () => {
  const jsCode = `
    (function() {
      // ... 300 lines of JavaScript ...
    })();
  `;
  webViewRef.current?.injectJavaScript(jsCode);
};

// 200+ lines of arrival card button code
const autoClickArrivalCard = () => {
  const jsCode = `
    (function() {
      // ... 200 lines of JavaScript ...
    })();
  `;
  webViewRef.current?.injectJavaScript(jsCode);
};

// State management scattered throughout
const [isLoading, setIsLoading] = useState(true);
const [showCloudflareReminder, setShowCloudflareReminder] = useState(false);
// ... many more state variables

// Message handling
const handleWebViewMessage = (event) => {
  // ... 100+ lines of switch cases ...
};
```

### After (Refactored)

```javascript
import useTDACWebView from '../../hooks/tdac/useTDACWebView';
import FieldHelperPanel from '../../components/tdac/FieldHelperPanel';

const TDACWebViewScreen = ({ navigation, route }) => {
  // Use hook for state management
  const {
    webViewRef,
    isLoading,
    showCloudflareReminder,
    showVisualMask,
    handleWebViewMessage,
    handleLoadEnd,
  } = useTDACWebView({
    travelerInfo,
    passport,
    onQRCodeDetected: handleQRCodeDetected,
  });

  // Prepare fields for helper panel
  const helperFields = [
    { name: 'passportNo', label: '护照号码', value: passport.passportNo },
    { name: 'firstName', label: '名', value: firstName },
    { name: 'lastName', label: '姓', value: lastName },
    // ... more fields
  ];

  return (
    <SafeAreaView>
      <WebView
        ref={webViewRef}
        onMessage={handleWebViewMessage}
        onLoadEnd={handleLoadEnd}
        // ... other props
      />

      <FieldHelperPanel
        visible={showHelper}
        onClose={() => setShowHelper(false)}
        fields={helperFields}
      />

      {/* Other modals */}
    </SafeAreaView>
  );
};
```

## Benefits

### Code Organization
- **Before**: 2026 lines in single file
- **After**: ~400 lines in main screen + modular components
- **Reduction**: 80% smaller main file

### Maintainability
- Language selection logic in one place
- Button clicking logic in one service
- WebView state management in custom hook
- Reusable components

### Testability
- Services can be unit tested independently
- Hook can be tested with React Testing Library
- Components can be tested in isolation

### Reusability
- `LanguageSelectorService` can be used in other WebView screens
- `ArrivalCardButtonService` can be extended for other button types
- `useTDACWebView` can be used in similar TDAC flows
- `FieldHelperPanel` can be used in any form-filling assistant

## Testing Recommendations

### Unit Tests

```javascript
// LanguageSelectorService.test.js
describe('LanguageSelectorService', () => {
  it('should generate valid JavaScript code', () => {
    const script = LanguageSelectorService.generateLanguageSelectionScript('en');
    expect(script).toContain('preferredLang');
    expect(script).toContain('English');
  });
});

// useTDACWebView.test.js
import { renderHook, act } from '@testing-library/react-hooks';

describe('useTDACWebView', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useTDACWebView({
      travelerInfo: {},
      passport: {},
    }));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.showVisualMask).toBe(false);
  });
});

// FieldHelperPanel.test.js
import { render, fireEvent } from '@testing-library/react-native';

describe('FieldHelperPanel', () => {
  it('should copy text to clipboard when field is pressed', () => {
    const fields = [
      { name: 'test', label: 'Test', value: 'TestValue' }
    ];

    const { getByText } = render(
      <FieldHelperPanel visible={true} onClose={() => {}} fields={fields} />
    );

    fireEvent.press(getByText('TestValue'));
    // Assert clipboard was called
  });
});
```

### Integration Tests

Test the complete flow:
1. Load WebView
2. Trigger language selection
3. Verify Arrival Card button click
4. Test QR code detection

## Future Improvements

1. **Extract more components**:
   - QR code detection logic → `QRCodeDetectorService`
   - Cloudflare handling → `CloudflareHandlerService`

2. **Add TypeScript**:
   - Type safety for props and return values
   - Better IDE support

3. **Performance optimization**:
   - Memoize expensive calculations
   - Lazy load components

4. **Error boundaries**:
   - Wrap components in error boundaries
   - Graceful degradation

## Support

For questions or issues with the refactored components:
1. Check this guide first
2. Review component JSDoc comments
3. Check service method documentation
4. Create an issue with reproduction steps

---

**Last Updated**: 2025-01-XX
**Refactored By**: Claude Code
