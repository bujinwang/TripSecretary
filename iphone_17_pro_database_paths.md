# iPhone 17 Pro iOS 26.0 SQLite Database Directory Patterns

## Predicted Database Paths for iPhone 17 Pro iOS 26.0

### 1. Standard App Sandbox Path (Most Likely)
```
/var/mobile/Containers/Data/Application/{APP_UUID}/Documents/tripsecretary_secure.db
```

### 2. Alternative SQLite-Specific Directory
```
/var/mobile/Containers/Data/Application/{APP_UUID}/Library/SQLite/tripsecretary_secure.db
```

### 3. App Group Shared Directory (if using App Groups)
```
/var/mobile/Containers/Shared/AppGroup/{APP_GROUP_ID}/Documents/tripsecretary_secure.db
```

### 4. Expo/React Native Pattern (if using Expo)
```
/var/mobile/Containers/Data/Application/{APP_UUID}/Documents/ExponentExperienceData/@anonymous/{APP_NAME}/{UUID}/SQLite/tripsecretary_secure
```

## Current Simulator Pattern Analysis

Based on the codebase analysis, here are the actual patterns found in the TripSecretary app:

### Current iOS Simulator Structure
```
~/Library/Developer/CoreSimulator/Devices/{DEVICE_UUID}/data/Containers/Data/Application/{APP_UUID}/
├── Library/
│   └── LocalDatabase/
│       └── tripsecretary_secure.db  (Pattern A)
└── Documents/
    └── ExponentExperienceData/
        └── @anonymous/
            └── {APP_NAME}-{APP_ID}/
                └── SQLite/
                    └── tripsecretary_secure  (Pattern B)
```

## Key Observations from Codebase

1. **Multiple Database Access Methods**: The app uses both direct file access and React Native SQLite libraries
2. **Dynamic Path Resolution**: Scripts in the codebase show attempts to find databases across multiple potential locations
3. **Device-Specific Paths**: Each simulator/device has a unique UUID-based path structure

## iPhone 17 Pro iOS 26.0 Considerations

### Expected Changes:
- **Enhanced Security**: Likely more restrictive sandbox permissions
- **Directory Structure**: May introduce new protected directories
- **App Group Support**: Potential for improved app group directory structures

### Most Probable Path:
Based on current iOS trends and the existing codebase patterns, the most likely location for `sqlite_secure` on iPhone 17 Pro iOS 26.0 would be:

```
/var/mobile/Containers/Data/Application/{APP_UUID}/Documents/tripsecretary_secure.db
```

## How to Find the Exact Path

The codebase includes utility scripts to locate database files:

1. **Automated Detection**: Use the `list-simulators-and-databases.js` script
2. **Console Logging**: The app logs database paths on startup
3. **Manual Search**: Search for `tripsecretary_secure.db` in the device's app sandbox

## Development vs Production

### Development (Simulator):
- Easy access via filesystem
- Multiple backup locations
- Debug-friendly logging

### Production (Physical Device):
- Sandboxed access only
- Requires app-level file system access
- Limited debugging capabilities

## Recommendations

1. **Use App-Level Database Access**: Rely on React Native SQLite libraries rather than direct file access
2. **Implement Path Detection**: Use the patterns found in the codebase to dynamically locate databases
3. **Support Multiple Locations**: Handle the various path patterns found in the existing code
4. **Future-Proofing**: Design for potential iOS directory structure changes