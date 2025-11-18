# Corrected iPhone 17 Pro iOS 26.0 Database Directory

## The Correct Path

Both iPhone 17 Pro and iPhone 17 Pro Max running on macOS will use the same simulator path pattern:

```
/Users/bujin/Library/Developer/CoreSimulator/Devices/69A62B34-93E6-4C79-89E8-3674756671DA/data/Containers/Data/Application/814C9629-B9C2-4DC3-9A0A-B84B8C00CC16/Documents/ExponentExperienceData/@anonymous/chujingtong-f61b0c42-6f26-43cf-9096-a32298ff88c2/SQLite/tripsecretary_secure
```

## Why Not `/var/mobile/`?

I incorrectly assumed iPhone 17 Pro would be running on a physical iOS device, but:

1. **iPhone 17 Pro Max path shows**: It's running on macOS in the simulator
2. **Simulator vs Physical**: The `~/Library/Developer/CoreSimulator/` path is for macOS simulator environments
3. **Physical device paths** (`/var/mobile/`) would only apply if running on an actual iOS device

## Path Structure Breakdown

- `/Users/bujin/Library/Developer/CoreSimulator/Devices/` - macOS simulator device directory
- `69A62B34-93E6-4C79-89E8-3674756671DA` - iPhone 17 Pro Max simulator device ID
- `data/Containers/Data/Application/` - iOS app container structure
- `814C9629-B9C2-4DC3-9A0A-B84B8C00CC16` - App container ID
- `Documents/ExponentExperienceData/@anonymous/chujingtong-{UUID}/` - Expo app directory
- `SQLite/tripsecretary_secure` - SQLite database file (without .db extension)

## For iPhone 17 Pro

The iPhone 17 Pro would have a similar path with a different device UUID:
```
/Users/bujin/Library/Developer/CoreSimulator/Devices/{iPhone_17_Pro_Device_UUID}/data/Containers/Data/Application/{APP_UUID}/Documents/ExponentExperienceData/@anonymous/chujingtong-{APP_ID}/SQLite/tripsecretary_secure
```

## Key Takeaway

Since both iPhone 17 Pro and Pro Max are running in the macOS simulator environment, they use the exact same directory structure pattern as any other iOS simulator - just with different device UUIDs.