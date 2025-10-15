# Fund Item Detail View - Design Document

## Overview

This feature introduces a dedicated detail modal (`FundItemDetailModal`) that displays when users tap on individual fund items in the ProfileScreen. The modal provides a focused view for viewing, editing, and deleting fund items without navigating away from the profile. This improves the user experience by reducing navigation complexity and providing quick access to fund item management.

## Architecture

### Component Hierarchy

```
ProfileScreen
├── FundingSection (existing)
│   └── FundItemList (existing)
│       └── FundItemRow (existing) → onPress triggers modal
└── FundItemDetailModal (new)
    ├── DetailView (default mode)
    │   ├── Header
    │   ├── ItemTypeDisplay
    │   ├── AmountDisplay
    │   ├── DescriptionDisplay
    │   ├── PhotoDisplay
    │   └── ActionButtons (Edit, Delete, Manage All)
    ├── EditView (edit mode)
    │   ├── Header
    │   ├── AmountInput
    │   ├── CurrencyInput
    │   ├── DescriptionInput
    │   ├── PhotoActions
    │   └── SaveButton
    └── PhotoFullScreenView (photo view mode)
        ├── ZoomableImage
        └── CloseButton
```

### State Management

The modal will manage its own internal state:

```javascript
{
  visible: boolean,              // Modal visibility
  mode: 'view' | 'edit' | 'photo', // Current mode
  fundItem: FundItem | null,     // The fund item being displayed
  editedData: {                  // Temporary edit state
    amount: string,
    currency: string,
    description: string,
    photoUri: string
  },
  loading: boolean,              // Loading state for async operations
  error: string | null           // Error message if operation fails
}
```

## Components and Interfaces

### 1. FundItemDetailModal Component

**Location**: `app/components/FundItemDetailModal.js`

**Props Interface**:
```javascript
{
  visible: boolean,              // Controls modal visibility
  fundItem: FundItem | null,     // The fund item to display
  onClose: () => void,           // Callback when modal closes
  onUpdate: (fundItem) => void,  // Callback when item is updated
  onDelete: (fundItemId) => void, // Callback when item is deleted
  onManageAll: () => void        // Callback to navigate to full management
}
```

**Key Methods**:
- `handleEdit()` - Switches to edit mode
- `handleSave()` - Saves changes and calls onUpdate
- `handleDelete()` - Shows confirmation and deletes item
- `handlePhotoPress()` - Opens full-screen photo view
- `handleAddPhoto()` - Opens image picker
- `handleReplacePhoto()` - Opens image picker to replace existing photo

### 2. ProfileScreen Updates

**Changes Required**:
```javascript
// Add state for modal
const [selectedFundItem, setSelectedFundItem] = useState(null);
const [fundItemModalVisible, setFundItemModalVisible] = useState(false);

// Update fund item onPress handler
const handleFundItemPress = (fundItem) => {
  setSelectedFundItem(fundItem);
  setFundItemModalVisible(true);
};

// Add callbacks
const handleFundItemUpdate = async (updatedItem) => {
  // Refresh fund items list
  const items = await PassportDataService.getFundItems('default_user');
  setFundItems(items);
  setFundItemModalVisible(false);
};

const handleFundItemDelete = async (fundItemId) => {
  // Refresh fund items list
  const items = await PassportDataService.getFundItems('default_user');
  setFundItems(items);
  setFundItemModalVisible(false);
};
```

### 3. Image Picker Integration

Use React Native's `expo-image-picker` for photo selection:

```javascript
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
    base64: true
  });
  
  if (!result.canceled) {
    return `data:image/jpeg;base64,${result.base64}`;
  }
  return null;
};
```

## Data Models

### FundItem (existing)

The modal will work with existing FundItem model:

```javascript
{
  id: string,
  userId: string,
  itemType: 'CASH' | 'BANK_CARD' | 'DOCUMENT',
  amount: number,
  currency: string,
  description: string,
  photoUri: string | null,
  createdAt: string,
  updatedAt: string
}
```

## User Interface Design

### Modal Layout

```
┌─────────────────────────────────────┐
│  ← Fund Item Details            ✕   │ Header
├─────────────────────────────────────┤
│                                     │
│  💵 Cash                            │ Item Type
│                                     │
│  Amount                             │
│  5,000 USD                          │ Amount Display
│                                     │
│  Description                        │
│  Cash for immigration check         │ Description
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │      [Photo Thumbnail]      │   │ Photo
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────┐  ┌─────────────┐  │
│  │    Edit     │  │   Delete    │  │ Actions
│  └─────────────┘  └─────────────┘  │
│                                     │
│  Manage All Funds →                 │ Navigation
│                                     │
└─────────────────────────────────────┘
```

### Edit Mode Layout

```
┌─────────────────────────────────────┐
│  ← Edit Fund Item               ✕   │ Header
├─────────────────────────────────────┤
│                                     │
│  💵 Cash                            │ Item Type (read-only)
│                                     │
│  Amount *                           │
│  ┌─────────────────────────────┐   │
│  │ 5000                        │   │ Amount Input
│  └─────────────────────────────┘   │
│                                     │
│  Currency *                         │
│  ┌─────────────────────────────┐   │
│  │ USD                    ▼    │   │ Currency Picker
│  └─────────────────────────────┘   │
│                                     │
│  Description                        │
│  ┌─────────────────────────────┐   │
│  │ Cash for immigration check  │   │ Description Input
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │      [Photo Thumbnail]      │   │ Photo
│  │                             │   │
│  └─────────────────────────────┘   │
│  Replace Photo                      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Save Changes           │   │ Save Button
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Styling Guidelines

Use existing theme values from `app/theme`:
- Colors: `colors.primary`, `colors.background`, `colors.text`, `colors.error`
- Typography: `typography.h2`, `typography.body`, `typography.caption`
- Spacing: `spacing.sm`, `spacing.md`, `spacing.lg`
- Border Radius: `borderRadius.md`, `borderRadius.lg`

## Error Handling

### Error Scenarios

1. **Load Failure**: Fund item cannot be loaded
   - Display error message in modal
   - Provide "Retry" button
   - Log error to console

2. **Update Failure**: Changes cannot be saved
   - Display error alert
   - Keep modal open with unsaved changes
   - Allow user to retry or cancel

3. **Delete Failure**: Item cannot be deleted
   - Display error alert
   - Keep modal open
   - Log error to console

4. **Photo Upload Failure**: Photo cannot be added/replaced
   - Display error message
   - Keep existing photo (if any)
   - Allow user to retry

### Error Messages

```javascript
const errorMessages = {
  loadFailed: t('fundItem.errors.loadFailed', { 
    defaultValue: 'Failed to load fund item details' 
  }),
  updateFailed: t('fundItem.errors.updateFailed', { 
    defaultValue: 'Failed to save changes. Please try again.' 
  }),
  deleteFailed: t('fundItem.errors.deleteFailed', { 
    defaultValue: 'Failed to delete fund item. Please try again.' 
  }),
  photoFailed: t('fundItem.errors.photoFailed', { 
    defaultValue: 'Failed to update photo. Please try again.' 
  })
};
```

## Testing Strategy

### Unit Tests

1. **FundItemDetailModal Component Tests**
   - Renders correctly with fund item data
   - Switches between view and edit modes
   - Handles save operation correctly
   - Handles delete operation with confirmation
   - Displays error messages appropriately

2. **ProfileScreen Integration Tests**
   - Opens modal when fund item is tapped
   - Refreshes fund items list after update
   - Refreshes fund items list after delete
   - Navigates to ThailandTravelInfo when "Manage All" is tapped

### Integration Tests

1. **End-to-End Flow Tests**
   - View fund item details
   - Edit fund item and save changes
   - Delete fund item with confirmation
   - Add photo to fund item
   - Replace existing photo
   - View photo in full screen

### Test Files

- `app/components/__tests__/FundItemDetailModal.test.js`
- `app/screens/__tests__/ProfileScreen.fundItems.test.js`

## Internationalization

### Translation Keys

Add to `app/i18n/translations/*.json`:

```json
{
  "fundItem": {
    "detail": {
      "title": "Fund Item Details",
      "edit": "Edit",
      "delete": "Delete",
      "save": "Save Changes",
      "cancel": "Cancel",
      "manageAll": "Manage All Funds",
      "addPhoto": "Add Photo",
      "replacePhoto": "Replace Photo",
      "viewPhoto": "Tap to view full size",
      "noPhoto": "No photo attached"
    },
    "fields": {
      "amount": "Amount",
      "currency": "Currency",
      "description": "Description",
      "type": "Type"
    },
    "types": {
      "CASH": "Cash",
      "BANK_CARD": "Bank Card",
      "DOCUMENT": "Supporting Document"
    },
    "deleteConfirm": {
      "title": "Delete Fund Item",
      "message": "Are you sure you want to delete this fund item?",
      "confirm": "Delete",
      "cancel": "Cancel"
    },
    "errors": {
      "loadFailed": "Failed to load fund item details",
      "updateFailed": "Failed to save changes. Please try again.",
      "deleteFailed": "Failed to delete fund item. Please try again.",
      "photoFailed": "Failed to update photo. Please try again."
    }
  }
}
```

## Performance Considerations

1. **Image Optimization**
   - Compress images to 80% quality
   - Limit image dimensions to 1024x768
   - Use base64 encoding for storage

2. **Modal Animation**
   - Use React Native's `Modal` with slide animation
   - Optimize re-renders with `React.memo` where appropriate

3. **Data Fetching**
   - Leverage PassportDataService cache (5-minute TTL)
   - No additional API calls needed if data is cached

## Security Considerations

1. **Data Validation**
   - Validate amount is a positive number
   - Validate currency code format
   - Sanitize description input

2. **Photo Handling**
   - Validate image format (JPEG, PNG only)
   - Limit file size to 5MB
   - Store as base64 in secure database

## Migration and Backward Compatibility

No database migrations required - this feature uses existing fund_items table and PassportDataService API.

## Design Decisions

### 1. Modal vs Separate Screen
**Decision**: Use modal
**Rationale**: 
- Faster interaction (no navigation)
- Maintains context (user stays on profile)
- Consistent with existing edit patterns in ProfileScreen

### 2. Edit Mode vs Separate Edit Screen
**Decision**: Toggle edit mode within modal
**Rationale**:
- Simpler navigation flow
- Faster editing experience
- Consistent with mobile app patterns

### 3. Photo Storage
**Decision**: Continue using base64 in database
**Rationale**:
- Consistent with existing implementation
- No file system management needed
- Works with current SecureStorageService

### 4. Delete Confirmation
**Decision**: Use Alert dialog
**Rationale**:
- Native platform pattern
- Clear and familiar to users
- Prevents accidental deletions

### 5. Currency Selection
**Decision**: Use picker/dropdown
**Rationale**:
- Prevents invalid currency codes
- Consistent with existing patterns
- Better UX than free text input
