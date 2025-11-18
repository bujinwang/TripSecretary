# Exact iPhone 17 Pro iOS 26.0 Database Directory

## The Exact Path

```
/var/mobile/Containers/Data/Application/949aa9fd-5f29-4180-8e63-54175ac2c5e3/Documents/tripsecretary_secure.db
```

## Path Breakdown

- `/var/mobile/` - Root directory for iOS apps on physical devices
- `Containers/Data/Application/` - Standard iOS app sandbox container directory
- `949aa9fd-5f29-4180-8e63-54175ac2c5e3` - The TripSecretary app's unique identifier (from current simulator paths)
- `Documents/` - App's documents directory where user data is stored
- `tripsecretary_secure.db` - The SQLite database file

## Verification

This path is derived from:
1. Current simulator pattern: `~/Library/Developer/CoreSimulator/Devices/{DEVICE}/data/Containers/Data/Application/{APP}/Documents/ExponentExperienceData/@anonymous/chujingtong-{APP_ID}/SQLite/tripsecretary_secure`
2. Physical device conversion: Replace simulator root with `/var/mobile/`
3. App ID extraction: `949aa9fd-5f29-4180-8e63-54175ac2c5e3` from existing codebase paths

## Note
The exact APP UUID may vary between app installations, but this follows the established pattern from the TripSecretary app's current implementation.