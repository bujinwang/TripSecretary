# Design Document

## Overview

This design document outlines the implementation approach for enabling fund item creation, viewing, editing, and deletion directly within the ProfileScreen. The enhancement will remove the dependency on the ThailandTravelInfo screen for fund item management and provide a consistent user experience where all user data (passport, personal info, and fund items) can be managed in one centralized location.

## Architecture

### Component Structure

```
ProfileScreen
├── Funding Section (collapsible)
│   ├── Fund Items List
│   │   └── Fund Item Row (tap to view/edit)
│   ├── Add Fund Item Button (new)
│   └── Footer Note
└── FundItemDetailModal (enhanced)
    ├── View Mode (existing)
    ├── Edit Mode (existing)
    ├── Create Mode (new)
    └── Photo View Mode (existing)
```

### Data Flow

```
User Action → ProfileScreen → FundItemDetailModal → PassportDataService → SQLite Database
                    ↓                    ↓
              State Update ← Callback ← Success/Error
```

## Components and Interfaces

### 1. ProfileScreen Enhancements

**New State:**
```javascript
const [isCreatingFundItem, setIsCreatingFundItem] = useState(false);
const [newFundItemType, setNewFundItemType] = useState(null);
```

**New Handlers:**
```javascript
// Handle add fund item button press
const handleAddFundItem = () => {
  // Show fund item type selector
  showFundItemTypeSelector();
};

// Show fund item type selector alert
const showFundItemTypeSelector = () => {
  Alert.alert(
    'Select Fund Item Type',
    'Choose the type of fund item to add',
    [
      { text: 'Cash', onPress: () => handleCreateFundItem('CASH') },
      { text: 'Bank Card', onPress: () => handleCreateFundItem('BANK_CARD') },
      { text: 'Supporting Document', onPress: () => handleCreateFundItem('DOCUMENT') },
      { text: 'Cancel', style: 'cancel' }
    ]
  );
};

// Handle create fund item with selected type
const handleCreateFundItem = (type) => {
  setNewFundItemType(type);
  setIsCreatingFundItem(true);
  setFundItemModalVisible(true);
};

// Handle fund item created
const handleFundItemCreate = async (newItem) => {
  // Refresh fund items list
  const userId = 'default_user';
  const items = await PassportDataService.getFundItems(userId);
  setFundItems(items || []);
  setFundItemModalVisible(false);
  setIsCreatingFundItem(false);
  setNewFundItemType(null);
};
```

**Modified JSX:**
```jsx
{/* Add Fund Item Button - positioned after fund items list */}
<TouchableOpacity
  style={styles.addFundItemButton}
  onPress={handleAddFundItem}
  accessibilityRole="button"
  accessibilityLabel={t('profile.funding.addButton', { defaultValue: 'Add Fund Item' })}
>
  <Text style={styles.addFundItemIcon}>➕</Text>
  <Text style={styles.addFundItemText}>
    {t('profile.funding.addButton', { defaultValue: 'Add Fund Item' })}
  </Text>
</TouchableOpacity>

{/* Fund Item Detail Modal - pass create mode props */}
<FundItemDetailModal
  visible={fundItemModalVisible}
  fundItem={isCreatingFundItem ? null : selectedFundItem}
  isCreateMode={isCreatingFundItem}
  createItemType={newFundItemType}
  onClose={handleFundItemModalClose}
  onUpdate={handleFundItemUpdate}
  onCreate={handleFundItemCreate}
  onDelete={handleFundItemDelete}
/>
```

**Removed Code:**
- `handleManageFundItems` function
- `onManageAll` prop from FundItemDetailModal
- "Scan / Upload Funding Proof" button and related JSX

### 2. FundItemDetailModal Enhancements

**New Props:**
```javascript
{
  isCreateMode: PropTypes.bool,
  createItemType: PropTypes.string,
  onCreate: PropTypes.func,
  // ... existing props
}
```

**Modified Logic:**
```javascript
// Update initial check to allow null fundItem in create mode
if (!fundItem && !isCreateMode) {
  return null;
}

// Initialize state for create mode
useEffect(() => {
  if (visible && isCreateMode && createItemType) {
    setMode('edit'); // Start in edit mode for creation
    setError(null);
    setValidationErrors({ amount: '', currency: '' });
    setEditedAmount('');
    setEditedCurrency('USD');
    setEditedDescription('');
    // Initialize with empty fund item structure
    setCurrentFundItem({
      type: createItemType,
      amount: null,
      currency: 'USD',
      details: '',
      photoUri: null,
    });
  }
}, [visible, isCreateMode, createItemType]);

// Modified save handler to support creation
const handleSave = async () => {
  // ... existing validation logic
  
  if (isCreateMode) {
    // Create new fund item
    const fundData = {
      type: createItemType,
      amount: shouldUpdateAmount ? parseFloat(editedAmount) : null,
      currency: shouldUpdateAmount ? editedCurrency.toUpperCase() : null,
      details: editedDescription,
      photoUri: currentFundItem.photoUri,
    };
    
    const userId = 'default_user';
    const newFundItem = await PassportDataService.saveFundItem(fundData, userId);
    
    if (onCreate) {
      await onCreate(newFundItem);
    }
  } else {
    // ... existing update logic
  }
};
```

**UI Changes:**
- Modal title changes based on mode: "Add Fund Item" vs "Fund Item Details"
- Cancel button in create mode closes modal without saving
- Delete button hidden in create mode

### 3. Translation Keys

**New i18n Keys:**
```javascript
{
  "profile": {
    "funding": {
      "addButton": "Add Fund Item",
      "selectType": "Select Fund Item Type",
      "selectTypeMessage": "Choose the type of fund item to add"
    }
  },
  "fundItem": {
    "create": {
      "title": "Add Fund Item",
      "success": "Fund item added successfully"
    },
    "types": {
      "selectPrompt": "Select Type"
    }
  }
}
```

## Data Models

### Fund Item Structure (Create Mode)

```javascript
{
  type: 'CASH' | 'BANK_CARD' | 'DOCUMENT' | 'BANK_BALANCE' | 'INVESTMENT',
  amount: number | null,
  currency: string | null,
  details: string,
  photoUri: string | null,
  // id, userId, createdAt, updatedAt added by PassportDataService
}
```

## Error Handling

### Validation Errors
- Amount required for CASH and BANK_CARD types
- Currency required for amount-based types
- Display inline validation errors in modal

### Creation Errors
- Database errors: Show alert with retry option
- Network errors (if applicable): Show alert with retry option
- Validation errors: Display inline in form

### User Feedback
- Success: Close modal and refresh list
- Error: Display error message in modal, keep modal open
- Loading: Show activity indicator during save

## Testing Strategy

### Unit Tests
- Test `handleAddFundItem` function
- Test `handleCreateFundItem` function with different types
- Test `handleFundItemCreate` callback
- Test FundItemDetailModal in create mode

### Integration Tests
- Test complete flow: tap Add → select type → fill form → save → verify in list
- Test cancel during creation
- Test validation errors during creation
- Test photo upload during creation

### Accessibility Tests
- Verify Add Fund Item button has proper accessibility labels
- Verify type selector alert is accessible
- Verify create mode modal is accessible
- Test with screen reader

## UI/UX Considerations

### Button Placement
- Position "Add Fund Item" button below fund items list
- Use consistent styling with other action buttons
- Include icon (➕) for visual clarity

### Empty State
- When no fund items exist, show empty state message above Add button
- Message: "No fund items yet. Tap below to add your first item."

### Type Selection
- Use native Alert.alert for type selection (iOS/Android native UI)
- Clear, concise type labels
- Cancel option available

### Modal Behavior
- Create mode starts in edit mode (fields editable)
- Title indicates "Add Fund Item"
- Save button creates new item
- Cancel button closes without saving
- No delete button in create mode

### Visual Consistency
- Match existing ProfileScreen styling
- Use theme colors and spacing
- Consistent with other collapsible sections

## Performance Considerations

- Minimal re-renders: Use proper state management
- Efficient list updates: Only refresh after successful creation
- Photo handling: Reuse existing compression logic
- Database operations: Leverage existing PassportDataService optimizations

## Security Considerations

- Validate all user input before saving
- Use existing SecureStorageService for sensitive data
- Sanitize photo URIs
- Prevent SQL injection through parameterized queries (already handled by PassportDataService)

## Migration Strategy

This is an additive change with minimal breaking changes:

1. Add new UI elements (button, handlers)
2. Enhance FundItemDetailModal with create mode
3. Remove deprecated navigation code
4. Add translation keys
5. Test thoroughly before deployment

No data migration required.

## Rollback Plan

If issues arise:
1. Revert ProfileScreen changes
2. Restore "Scan / Upload" button
3. Revert FundItemDetailModal changes
4. Users can still manage fund items via ThailandTravelInfo screen

## Future Enhancements

- Bulk import fund items from photos
- Fund item templates for common scenarios
- Export fund items as PDF
- Share fund items with other users
