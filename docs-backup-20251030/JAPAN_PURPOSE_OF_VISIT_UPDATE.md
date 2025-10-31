# Japan Purpose of Visit Update

## Summary
Updated Japan's travel purpose selection to match Thailand's approach with a simplified set of 5 options in English.

## Changes Made

### 1. JapanTravelInfoScreen.js
- **Replaced** `TravelPurposeSelector` component with button-based selector (matching Thailand's UI pattern)
- **Updated** travel purpose options to 5 simple English choices:
  - 🏖️ Tourism (TOURISM)
  - 💼 Business (BUSINESS)
  - 👨‍👩‍👧‍👦 Visiting relatives (VISITING_RELATIVES)
  - ✈️ Transit (TRANSIT)
  - ✏️ Other (OTHER)

- **Changed** default travel purpose from `'Tourism'` to `'TOURISM'` (uppercase constant)
- **Updated** field count logic to check for `'OTHER'` instead of `'Other'`
- **Modified** data loading to handle predefined purposes vs custom purposes
- **Updated** data saving to merge custom purpose into travelPurpose field when OTHER is selected
- **Added** new styles for button-based selector:
  - `fieldContainer`
  - `fieldLabel`
  - `optionsContainer`
  - `optionButton`
  - `optionButtonActive`
  - `optionIcon`
  - `optionText`
  - `optionTextActive`

### 2. travelPurposes.js
- **Updated** `getJapanTravelPurposes()` function to return simplified list of 5 purposes

## UI Behavior
- Users can now select from 5 predefined travel purposes with visual icons
- When "Other" is selected, a text input field appears for custom purpose entry
- Selected option is highlighted with primary color
- Data is automatically saved when selection changes
- Custom purposes are stored in the same field as predefined purposes for consistency

## Data Storage
- Predefined purposes are stored as uppercase constants (e.g., `'TOURISM'`, `'BUSINESS'`)
- Custom purposes (when OTHER is selected) are stored as the user's input text
- On load, the system checks if the stored value matches a predefined purpose or treats it as custom

## Consistency with Thailand
Both Japan and Thailand now use the same UI pattern for travel purpose selection, but with their own specific options appropriate for each country's entry requirements.
