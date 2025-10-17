# Implementation Plan

- [x] 1. Set up Japan travel info screen structure and navigation
  - Create JapanTravelInfoScreen component in app/screens/japan/
  - Set up basic screen layout with header, title section, and scroll view
  - Implement navigation integration from existing Japan flow
  - Add screen to navigation stack
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement collapsible section component and UI framework
  - Create CollapsibleSection component with expand/collapse functionality
  - Implement field count badge system with completion status indicators
  - Add section header with title, badge, and expand/collapse controls
  - Style sections with proper spacing and visual hierarchy
  - _Requirements: 1.1, 1.5, 6.1, 6.2, 6.3_

- [x] 3. Build passport information section
  - [x] 3.1 Create passport data collection fields
    - Implement full name input with PassportNameInput component
    - Add nationality selector using existing NationalitySelector
    - Create passport number input with validation
    - Add date of birth and expiry date inputs with DateTimeInput
    - _Requirements: 2.1, 2.4, 2.5_
  
  - [x] 3.2 Integrate passport data with PassportDataService
    - Load existing passport data from PassportDataService on screen mount
    - Implement field blur handlers to save data automatically
    - Add passport data validation and error handling
    - _Requirements: 2.3, 8.1, 8.2, 8.3_

- [x] 4. Build personal information section
  - [x] 4.1 Create personal info data collection fields
    - Add occupation, city of residence, and resident country inputs
    - Implement phone code auto-population based on country selection
    - Create email input with validation
    - Add gender selection with Male/Female/Undefined options
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 4.2 Integrate personal info with PassportDataService
    - Load existing personal info from PassportDataService
    - Implement auto-save on field changes
    - Add personal info validation and error display
    - _Requirements: 3.5, 8.1, 8.2_

- [x] 5. Build fund information section
  - [x] 5.1 Create fund item management UI in JapanTravelInfoScreen
    - Import FundItemDetailModal component
    - Add "Add Fund Item" button in funds section
    - Display fund items list with type icons, amounts, and currency
    - Implement fund item deletion with confirmation dialog
    - Add fund item edit functionality by reopening modal with existing data
    - _Requirements: 4.1, 4.3, 4.5_
  
  - [x] 5.2 Integrate fund data with PassportDataService
    - Load existing fund items from PassportDataService on screen mount (already implemented in useEffect)
    - Implement handleAddFundItem to save new fund items via PassportDataService.saveFundItem
    - Implement handleDeleteFundItem to remove fund items via PassportDataService.deleteFundItem
    - Handle photo storage for credit card/bank balance items using photo URI
    - Update field count badge when fund items change (already implemented in getFieldCount)
    - _Requirements: 4.2, 4.4, 8.1_

- [x] 6. Build Japan-specific travel information section
  - [x] 6.1 Implement complete travel information UI
    - Replace placeholder text in travel section with actual form fields
    - Add Picker component for travelPurpose with options: Tourism, Business, Visiting Friends/Relatives, Conference, Other
    - Add conditional Input field for customTravelPurpose when "Other" is selected
    - Add Input component for arrivalFlightNumber with validation
    - Add DateTimeInput component for arrivalDate
    - Add Picker component for accommodationType: Hotel, Ryokan, Friend's House, Airbnb, Other
    - Add conditional Input for customAccommodationType when "Other" selected
    - Add Input for accommodationName
    - Add multiline Input for accommodationAddress with helpText showing Japanese format example
    - Add Input for accommodationPhone with phone-pad keyboard
    - Add Input for lengthOfStay with numeric keyboard
    - Wire all fields to auto-save via handleFieldBlur (handler already exists)
    - Validation logic already implemented in validateField function
    - Field count calculation already implemented in getFieldCount function
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 8.1, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3_

- [x] 7. Implement form validation and completion tracking
  - [x] 7.1 Create field counting system for each section
    - Implement getFieldCount function for passport, personal, funds, and travel sections
    - Add logic to handle conditional fields (custom purpose, custom accommodation type)
    - Create completion status calculation for each section
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 7.2 Implement form validation and continue button logic
    - Create isFormValid function to check all sections are complete
    - Implement continue button enable/disable based on completion status
    - Add validation error display and handling
    - _Requirements: 6.4, 6.5_

- [x] 8. Implement data persistence and navigation
  - [x] 8.1 Create comprehensive data saving system
    - Implement saveDataToSecureStorage function for all data types
    - Add field-level validation and auto-save on blur
    - Create data loading system for screen focus/mount
    - Handle data migration from legacy storage formats
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [x] 8.2 Implement navigation to manual entry guide
    - Create handleContinue function with validation and data saving
    - Add navigation to ResultScreen with Japan context
    - Implement proper error handling for save failures
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9. Enhance ResultScreen for Japan manual entry guide
  - [x] 9.1 Add Japan context detection in ResultScreen
    - Check for Japan destination and manual_entry_guide context in route params
    - Load Japan traveler data using JapanTravelerContextBuilder
    - Display formatted data for manual form completion reference
    - _Requirements: 7.4, 7.5_
  
  - [x] 9.2 Create Japan manual entry guide UI
    - Display passport information in easy-to-reference format
    - Show personal information with proper formatting
    - Display travel information with Japan-specific fields
    - Add accommodation details with full address
    - Show fund items summary
    - Include navigation to InteractiveImmigrationGuide screen
    - _Requirements: 7.5, 10.1, 10.2, 10.3_

- [x] 10. Create validation services and utilities
  - [x] 10.1 Create JapanDataValidator service
    - Implement validation methods for passport, personal info, funds, and travel data
    - Add Japan-specific validation rules (no departure flight, accommodation phone required)
    - Create complete validation function for all sections
    - _Requirements: All validation requirements_
  
  - [x] 10.2 Create JapanTravelerContextBuilder service
    - Implement buildContext method to create complete traveler payload
    - Add context validation for Japan manual entry requirements
    - Create helper methods for data formatting
    - _Requirements: 7.5_

- [x] 11. Add localization support
  - [x] 11.1 Add Chinese translations for Japan travel info screen
    - Chinese translations already exist in locales.js under japan.travelInfo
    - All field labels, placeholders, and help text are translated
    - All validation error messages are translated
    - _Requirements: All UI requirements_
  
  - [x] 11.2 Add English translations for Japan travel info screen
    - Add English translations in locales.js under japan.travelInfo
    - Translate all field labels, placeholders, and help text
    - Translate all validation error messages
    - Translate travel purpose options
    - Translate accommodation type options
    - _Requirements: All UI requirements_