# Thailand Travel Info Screen - Gender Selection Fix

## Issue
Gender selection buttons in ThailandTravelInfoScreen are not showing as selected/highlighted.

## Root Cause
The `sex` state is initialized from `passport?.sex`, but the passport object being passed doesn't have a `sex` field.

From the logs:
```json
{
  "expiry": "2030-12-31",
  "name": "",
  "nameEn": "ZHANG WEI",
  "passportNo": "E12345678",
  "type": "中国护照"
}
```

Notice: **No `sex` field!**

## How Gender Selection Works

1. **State**: `const [sex, setSex] = useState(passport?.sex || '');`
2. **Options**: 'Male', 'Female', 'Undefined' (note: capitalized)
3. **Comparison**: `sex === option.value`
4. **Highlight**: Applied when comparison is true

## Why It's Not Working

1. `passport.sex` is undefined
2. `sex` state is initialized to empty string `''`
3. Empty string `''` doesn't match 'Male', 'Female', or 'Undefined'
4. No button gets highlighted

## Solutions

### Option 1: Set Default Value
Change the initialization to default to 'Male':

```javascript
const [sex, setSex] = useState(passport?.sex || 'Male');
```

### Option 2: Add Sex to Passport Data
When creating/loading passport data, ensure it includes a `sex` field:

```javascript
const passportData = {
  ...otherFields,
  sex: 'Male' // or 'Female' or 'Undefined'
};
```

### Option 3: Load from Saved Data
The screen already tries to load from AsyncStorage. If you select a gender and save, it should persist. But on first load with a new passport, there's no default.

## Debugging Steps

1. Check console for these logs:
   ```
   === THAILAND TRAVEL INFO SCREEN LOADING ===
   Passport data from route: {...}
   passport.sex: undefined
   Loading sex from saved data: undefined or passport: undefined => final: 
   === GENDER OPTIONS RENDERING ===
   Current sex value: 
   Option Female: sex="", isActive=false
   Option Male: sex="", isActive=false
   Option Undefined: sex="", isActive=false
   ```

2. If `sex` is empty string, that's the problem

3. Select a gender - it should save and persist

4. If it still doesn't persist, check AsyncStorage save logic

## Recommended Fix

Add a default value in the state initialization:

```javascript
const [sex, setSex] = useState(passport?.sex || 'Male'); // Default to Male
```

This ensures there's always a valid value, even if passport data doesn't include it.
