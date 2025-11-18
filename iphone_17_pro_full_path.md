# iPhone 17 Pro SQLite Database Path

## Full Path Name (Pattern)

```
/Users/bujin/Library/Developer/CoreSimulator/Devices/{iPhone_17_Pro_Device_UUID}/data/Containers/Data/Application/814C9629-B9C2-4DC3-9A0A-B84B8C00CC16/Documents/ExponentExperienceData/@anonymous/chujingtong-f61b0c42-6f26-43cf-9096-a32298ff88c2/SQLite/tripsecretary_secure
```

## Component Breakdown

- **Base Path**: `/Users/bujin/Library/Developer/CoreSimulator/Devices/`
- **Device UUID**: `{iPhone_17_Pro_Device_UUID}` *(different from Pro Max)*
- **Container ID**: `814C9629-B9C2-4DC3-9A0A-B84B8C00CC16` *(same as Pro Max)*
- **App Path**: `Documents/ExponentExperienceData/@anonymous/chujingtong-f61b0c42-6f26-43cf-9096-a32298ff88c2/`
- **Database File**: `SQLite/tripsecretary_secure` *(SQLite database without .db extension)*

## To Find Your iPhone 17 Pro Device UUID

Run this command to list all simulator devices:
```bash
xcrun simctl list devices | grep "iPhone 17 Pro"
```

Look for the device ID that starts with: `69A62B34-93E6-4C79-89E8-` (Pro Max had this ID)

The Pro will have a different UUID in the same format.