# PDF Export & Sharing Feature

## Overview
Added comprehensive PDF and QR code export/sharing functionality for TDAC submissions.

## Features Added

### 1. PDFManagementService Enhancements

#### New Methods:
- **`sharePDF(filepath)`** - Share PDF using native share dialog
- **`shareQRImage(filepath)`** - Share QR code image using native share dialog
- **`getAllSavedPDFs()`** - Get all saved PDFs with metadata
- **`getAllSavedQRImages()`** - Get all saved QR images with metadata

#### Metadata Provided:
```javascript
{
  filename: "TDAC_WV2025001_1234567890.pdf",
  filepath: "/path/to/file",
  arrCardNo: "WV2025001",
  savedAt: "2025-01-27T10:30:00.000Z",
  timestamp: 1234567890,
  size: 45678,
  exists: true
}
```

### 2. TDACFilesScreen

New screen for managing saved TDAC files with:
- **Two Tabs**: PDFs and QR Codes
- **File List**: Shows all saved files with card number, date, and size
- **Actions**: Share and Delete for each file
- **Pull to Refresh**: Reload file list
- **Empty State**: Helpful message when no files exist

### 3. Navigation

Added route: `TDACFiles`

**Navigate to it:**
```javascript
navigation.navigate('TDACFiles');
```

## Usage

### From Code

#### Share a PDF:
```javascript
import PDFManagementService from './services/PDFManagementService';

// Share by filename
await PDFManagementService.sharePDF('TDAC_WV2025001_1234567890.pdf');

// Or by full path
await PDFManagementService.sharePDF(savedPdf.filepath);
```

#### Get All Saved Files:
```javascript
// Get all PDFs
const pdfs = await PDFManagementService.getAllSavedPDFs();
console.log(`Found ${pdfs.length} PDFs`);

// Get all QR codes
const qrImages = await PDFManagementService.getAllSavedQRImages();
console.log(`Found ${qrImages.length} QR codes`);
```

### From UI

Users can navigate to the TDAC Files screen to:
1. View all saved PDFs and QR codes
2. Share files to other apps (email, messaging, cloud storage, etc.)
3. Delete old files to free up space
4. See file details (card number, date saved, file size)

## File Storage

### Location:
```
iOS: /var/.../Documents/tdac/
Android: /data/data/.../files/tdac/
```

### Filename Formats:
- **PDFs**: `TDAC_{cardNo}_{timestamp}.pdf`
- **QR Codes**: `TDAC_QR_{cardNo}_{timestamp}.png`

### Examples:
```
TDAC_WV2025001_1737982200000.pdf
TDAC_QR_WV2025001_1737982200000.png
```

### Directory Layout & Helpers

`PDFManagementService.initialize()` guarantees that Expo's `documentDirectory` contains a `tdac/` subfolder with the following structure:

```
Documents/
└── tdac/
    ├── TDAC_{cardNo}_{timestamp}.pdf
    └── TDAC_QR_{cardNo}_{timestamp}.png
```

Use `PDFManagementService.getFilePath('<filename>')` whenever you need the fully-qualified URI (for example, when passing a path to sharing dialogs or other storage helpers). All saves rely on async helpers backed by `expo-file-system.writeAsStringAsync`, so the directory must exist before writing.

## Integration Points

### Add "View Saved Files" Button

Add this to your Thailand entry screen or TDAC success screen:

```javascript
<TouchableOpacity
  style={styles.viewFilesButton}
  onPress={() => navigation.navigate('TDACFiles')}
>
  <Ionicons name="folder-open-outline" size={20} color="#1976D2" />
  <Text style={styles.viewFilesText}>
    View Saved TDAC Files
  </Text>
</TouchableOpacity>
```

### Quick Share After Submission

Add to result screens:

```javascript
// After successful TDAC submission
const handleQuickShare = async () => {
  const pdfs = await PDFManagementService.getAllSavedPDFs();
  if (pdfs.length > 0) {
    // Share the most recent PDF
    await PDFManagementService.sharePDF(pdfs[0].filepath);
  }
};
```

## Sharing Options

When users share, they can send to:
- Email apps (Gmail, Outlook, etc.)
- Messaging apps (WhatsApp, WeChat, etc.)
- Cloud storage (Google Drive, iCloud, Dropbox, etc.)
- Other PDF viewers
- AirDrop (iOS) / Nearby Share (Android)

## Dependencies

Required package (already included):
```json
{
  "expo-sharing": "~14.0.7"
}
```

## Testing

1. **Complete a TDAC submission** to generate PDF and QR files
2. **Navigate to TDACFiles screen**: `navigation.navigate('TDACFiles')`
3. **Test tabs**: Switch between PDFs and QR Codes
4. **Test sharing**: Tap share icon and select an app
5. **Test deletion**: Tap trash icon and confirm
6. **Test pull-to-refresh**: Pull down to reload list

## Future Enhancements

Potential additions:
- [ ] Preview PDF in-app before sharing
- [ ] Bulk share multiple files
- [ ] Export all files as ZIP
- [ ] Auto-cleanup old files (configurable)
- [ ] Search/filter by card number or date
- [ ] Sort options (by date, size, card number)

## File Locations Reference

### Development:
Use `console.log()` to see actual paths:
```javascript
const pdfs = await PDFManagementService.getAllSavedPDFs();
pdfs.forEach(pdf => console.log('PDF path:', pdf.filepath));
```

### Production:
Files are in the app's private sandbox:
- **iOS**: App's Documents directory
- **Android**: App's internal files directory

Users can access via:
- Share functionality (recommended)
- iTunes File Sharing (iOS, if enabled)
- adb commands (Android, development only)
