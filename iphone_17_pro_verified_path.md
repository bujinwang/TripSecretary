# iPhone 17 Pro ACTUAL SQLite Database Path

## Verified Full Path Name

```
/Users/bujin/Library/Developer/CoreSimulator/Devices/458CE840-6033-4D95-B5D3-1DF637E552AA/data/Containers/Data/Application/ED3CDF94-B913-4ECC-9FF2-0DF133C58065/Documents/ExponentExperienceData/@anonymous/chujingtong-f61b0c42-6f26-43cf-9096-a32298ff88c2/SQLite/tripsecretary_secure
```

## Actual Path Breakdown

| Component | Value |
|-----------|--------|
| **Base Directory** | `/Users/bujin/Library/Developer/CoreSimulator/Devices/` |
| **iPhone 17 Pro Device UUID** | `458CE840-6033-4D95-B5D3-1DF637E552AA` |
| **App Container ID** | `ED3CDF94-B913-4ECC-9FF2-0DF133C58065` *(verified)* |
| **App Directory** | `Documents/ExponentExperienceData/@anonymous/chujingtong-f61b0c42-6f26-43cf-9096-a32298ff88c2/` |
| **Database File** | `SQLite/tripsecretary_secure` |

## Directory Structure Confirmation
✅ `/Users/bujin/Library/Developer/CoreSimulator/Devices/458CE840-6033-4D95-B5D3-1DF637E552AA/data/Containers/` - YES
✅ `Data/` - YES  
✅ `Application/` - YES
✅ `ED3CDF94-B913-4ECC-9FF2-0DF133C58065/Documents/` - YES
✅ `ExponentExperienceData/@anonymous/chujingtong-f61b0c42-6f26-43cf-9096-a32298ff88c2/SQLite/tripsecretary_secure` - YES (FILE FOUND)

## Verification Command
```bash
find "/Users/bujin/Library/Developer/CoreSimulator/Devices/458CE840-6033-4D95-B5D3-1DF637E552AA/data/Containers/Data/Application/" -name "tripsecretary_secure" 2>/dev/null
```

This path was verified by running the actual `find` command which returned the exact location.