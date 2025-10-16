# Implementation Plan

- [x] 1. Enhance FundItemDetailModal to support create mode
  - Add new props: `isCreateMode`, `createItemType`, `onCreate`
  - Modify initial null check to allow null fundItem when isCreateMode is true
  - Add useEffect to initialize state for create mode with empty values
  - Update modal title to show "Add Fund Item" in create mode
  - Hide delete button in create mode
  - Modify handleSave to create new fund item when in create mode
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Add fund item creation UI to ProfileScreen
  - Add state variables: `isCreatingFundItem`, `newFundItemType`
  - Create `handleAddFundItem` function to show type selector
  - Create `showFundItemTypeSelector` function using Alert.alert
  - Create `handleCreateFundItem` function to set type and open modal
  - Create `handleFundItemCreate` callback to refresh list after creation
  - Add "Add Fund Item" button JSX below fund items list
  - Update FundItemDetailModal props to include create mode props
  - Add styles for addFundItemButton, addFundItemIcon, addFundItemText
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4_

- [x] 3. Remove ThailandTravelInfo navigation code
  - Remove `handleManageFundItems` function from ProfileScreen
  - Remove "Scan / Upload Funding Proof" button JSX
  - Remove `onManageAll` prop from FundItemDetailModal usage
  - Remove `handleFundItemManageAll` function from ProfileScreen
  - Remove `onManageAll` prop from FundItemDetailModal component definition
  - Remove related handler code in FundItemDetailModal
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Add internationalization support
  - Add translation key: `profile.funding.addButton`
  - Add translation key: `profile.funding.selectType`
  - Add translation key: `profile.funding.selectTypeMessage`
  - Add translation key: `profile.funding.empty`
  - Add translation key: `fundItem.create.title`
  - Add translation key: `fundItem.create.success`
  - Add translations for all three languages (en, es, zh)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Update empty state handling
  - Modify empty state JSX to show when fundItems.length === 0
  - Update empty state message to encourage adding first fund item
  - Ensure Add Fund Item button is visible in empty state
  - _Requirements: 4.3_

- [x] 6. Verify and test the implementation
  - Test creating fund item of type CASH
  - Test creating fund item of type BANK_CARD
  - Test creating fund item of type DOCUMENT
  - Test canceling fund item creation
  - Test validation errors during creation
  - Test that created items appear in the list
  - Test that "Scan / Upload" button is removed
  - Test that onManageAll navigation is removed
  - Verify translations work in all languages
  - Test accessibility labels and roles
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_
