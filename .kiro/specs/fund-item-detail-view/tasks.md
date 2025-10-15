# Implementation Plan

- [x] 1. Create FundItemDetailModal component with view mode
  - Create `app/components/FundItemDetailModal.js` with basic modal structure
  - Implement view mode UI showing fund item type, amount, currency, description
  - Add proper styling using theme values (colors, typography, spacing)
  - Implement modal open/close animations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.5_

- [x] 2. Add photo display functionality
  - Implement photo thumbnail display in view mode
  - Add placeholder for items without photos
  - Implement full-screen photo view mode with zoom/pan capabilities
  - Add close button for full-screen photo view
  - _Requirements: 1.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3. Implement edit mode functionality
  - Add edit button and handler to switch to edit mode
  - Create edit mode UI with input fields for amount, currency, and description
  - Implement currency picker/dropdown component
  - Add form validation for amount (positive number) and currency format
  - Implement save button with loading state
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Integrate PassportDataService for updates
  - Implement save handler that calls PassportDataService.updateFundItem()
  - Add error handling for update failures
  - Implement success callback to close modal and refresh parent
  - Add loading state during save operation
  - _Requirements: 2.5, 2.6, 8.2_

- [x] 5. Implement delete functionality
  - Add delete button in view mode
  - Implement confirmation dialog using Alert
  - Create delete handler that calls PassportDataService.deleteFundItem()
  - Add error handling for delete failures
  - Implement success callback to close modal and refresh parent
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 8.3_

- [ ] 6. Add photo management features
  - Integrate expo-image-picker for photo selection
  - Implement "Add Photo" button when no photo exists
  - Implement "Replace Photo" button when photo exists
  - Add image compression and base64 conversion
  - Update fund item with new photo via PassportDataService
  - Add error handling for photo operations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.4_

- [ ] 7. Add navigation to full fund management
  - Implement "Manage All Funds" button/link in modal
  - Add handler to close modal and navigate to ThailandTravelInfoScreen
  - Pass appropriate navigation params
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 8. Update ProfileScreen to integrate modal
  - Add state for selected fund item and modal visibility
  - Update fund item onPress handler to open modal with selected item
  - Implement onUpdate callback to refresh fund items list
  - Implement onDelete callback to refresh fund items list
  - Implement onManageAll callback for navigation
  - Add FundItemDetailModal component to ProfileScreen render
  - _Requirements: 1.1, 2.6, 3.5_

- [ ] 9. Add internationalization support
  - Add translation keys to English translation file (en.json)
  - Add translation keys to Spanish translation file (es.json)
  - Add translation keys to Chinese translation file (zh.json)
  - Use translation hook in FundItemDetailModal component
  - Ensure all user-facing text is translatable
  - _Requirements: 6.1, 8.4_

- [ ] 10. Implement error handling and logging
  - Add try-catch blocks for all async operations
  - Implement user-friendly error messages for each error scenario
  - Add console logging for debugging purposes
  - Ensure errors don't crash the app
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 11. Add accessibility features
  - Add accessibilityRole and accessibilityLabel to interactive elements
  - Ensure modal can be closed with back button on Android
  - Add keyboard navigation support for form inputs
  - Ensure proper focus management when modal opens/closes
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 12. Write component tests
  - [ ] 12.1 Write unit tests for FundItemDetailModal component
    - Test rendering with different fund item types
    - Test mode switching (view, edit, photo)
    - Test save operation
    - Test delete operation with confirmation
    - Test error display
    - _Requirements: All_

  - [ ] 12.2 Write integration tests for ProfileScreen
    - Test modal opens when fund item is tapped
    - Test fund items list refreshes after update
    - Test fund items list refreshes after delete
    - Test navigation to ThailandTravelInfo
    - _Requirements: 1.1, 2.6, 3.5, 7.2, 7.3_

  - [ ] 12.3 Write end-to-end flow tests
    - Test complete view flow
    - Test complete edit and save flow
    - Test complete delete flow
    - Test photo add/replace flow
    - Test full-screen photo view flow
    - _Requirements: All_
