# Requirements Document

## Introduction

This feature enhances the fund item management experience in the ProfileScreen by providing a detailed view when users tap on individual fund items. Currently, tapping a fund item navigates to the ThailandTravelInfo screen for general fund management. This feature will introduce a dedicated detail modal that allows users to view, edit, and delete specific fund items directly from the profile.

## Glossary

- **ProfileScreen**: The main user profile screen that displays personal information, passport details, and fund items
- **FundItem**: A database entity representing a funding proof item (cash, bank card, or supporting document)
- **FundItemDetailModal**: A modal component that displays detailed information about a single fund item
- **PassportDataService**: The centralized service for managing all user data including fund items
- **ThailandTravelInfoScreen**: The screen where users can add and manage multiple fund items for Thailand travel

## Requirements

### Requirement 1

**User Story:** As a traveler, I want to view detailed information about a specific fund item when I tap on it in my profile, so that I can quickly review its details without navigating away from the profile screen

#### Acceptance Criteria

1. WHEN the User taps on a fund item in the ProfileScreen funding section, THEN the FundItemDetailModal SHALL display with the selected fund item's details
2. THE FundItemDetailModal SHALL display the fund item type (cash, bank card, or document)
3. THE FundItemDetailModal SHALL display the amount and currency for cash and bank card types
4. THE FundItemDetailModal SHALL display the description field for all fund item types
5. THE FundItemDetailModal SHALL display the attached photo if one exists for the fund item

### Requirement 2

**User Story:** As a traveler, I want to edit fund item details from the detail view, so that I can update information without going to a different screen

#### Acceptance Criteria

1. WHEN the User taps the edit button in the FundItemDetailModal, THEN the modal SHALL transition to edit mode
2. WHILE in edit mode, THE FundItemDetailModal SHALL allow the User to modify the amount field for cash and bank card types
3. WHILE in edit mode, THE FundItemDetailModal SHALL allow the User to modify the currency field for cash and bank card types
4. WHILE in edit mode, THE FundItemDetailModal SHALL allow the User to modify the description field for all fund item types
5. WHEN the User saves changes, THEN the FundItemDetailModal SHALL call PassportDataService to update the fund item
6. WHEN the save operation completes successfully, THEN the FundItemDetailModal SHALL close and the ProfileScreen SHALL refresh the fund items list

### Requirement 3

**User Story:** As a traveler, I want to delete a fund item from the detail view, so that I can remove items I no longer need

#### Acceptance Criteria

1. THE FundItemDetailModal SHALL display a delete button
2. WHEN the User taps the delete button, THEN the FundItemDetailModal SHALL display a confirmation dialog
3. THE confirmation dialog SHALL ask "Are you sure you want to delete this fund item?"
4. WHEN the User confirms deletion, THEN the FundItemDetailModal SHALL call PassportDataService to delete the fund item
5. WHEN the deletion completes successfully, THEN the FundItemDetailModal SHALL close and the ProfileScreen SHALL refresh the fund items list
6. IF the deletion fails, THEN the FundItemDetailModal SHALL display an error message to the User

### Requirement 4

**User Story:** As a traveler, I want to view the photo attached to a fund item in full size, so that I can see all the details clearly

#### Acceptance Criteria

1. WHEN a fund item has an attached photo, THEN the FundItemDetailModal SHALL display a thumbnail of the photo
2. WHEN the User taps on the photo thumbnail, THEN the FundItemDetailModal SHALL display the photo in full-screen view
3. THE full-screen photo view SHALL allow the User to zoom and pan the image
4. THE full-screen photo view SHALL have a close button to return to the detail view
5. WHERE the fund item has no photo, THE FundItemDetailModal SHALL display a placeholder indicating no photo is attached

### Requirement 5

**User Story:** As a traveler, I want to add or replace a photo for a fund item from the detail view, so that I can keep my funding proof documentation up to date

#### Acceptance Criteria

1. THE FundItemDetailModal SHALL display an "Add Photo" button when no photo exists
2. THE FundItemDetailModal SHALL display a "Replace Photo" button when a photo already exists
3. WHEN the User taps the add or replace photo button, THEN the FundItemDetailModal SHALL present options to take a photo or select from gallery
4. WHEN the User selects a photo, THEN the FundItemDetailModal SHALL update the fund item with the new photo
5. WHEN the photo update completes successfully, THEN the FundItemDetailModal SHALL display the new photo thumbnail

### Requirement 6

**User Story:** As a traveler, I want the detail modal to have a consistent design with the rest of the app, so that the experience feels cohesive

#### Acceptance Criteria

1. THE FundItemDetailModal SHALL use the app's existing color scheme from the theme configuration
2. THE FundItemDetailModal SHALL use the app's existing typography styles from the theme configuration
3. THE FundItemDetailModal SHALL use the app's existing spacing and border radius values from the theme configuration
4. THE FundItemDetailModal SHALL support both light and dark mode if the app supports theme switching
5. THE FundItemDetailModal SHALL display appropriate icons for different fund item types (💵 for cash, 💳 for bank card, 📄 for document)

### Requirement 7

**User Story:** As a traveler, I want to navigate to the full fund management screen from the detail view, so that I can manage all my fund items if needed

#### Acceptance Criteria

1. THE FundItemDetailModal SHALL display a "Manage All Funds" button or link
2. WHEN the User taps the "Manage All Funds" button, THEN the FundItemDetailModal SHALL close
3. WHEN the User taps the "Manage All Funds" button, THEN the ProfileScreen SHALL navigate to the ThailandTravelInfoScreen
4. THE ThailandTravelInfoScreen SHALL display all fund items for the User to manage

### Requirement 8

**User Story:** As a traveler, I want the modal to handle errors gracefully, so that I understand what went wrong if an operation fails

#### Acceptance Criteria

1. IF PassportDataService fails to load the fund item details, THEN the FundItemDetailModal SHALL display an error message
2. IF PassportDataService fails to update a fund item, THEN the FundItemDetailModal SHALL display an error message and remain open
3. IF PassportDataService fails to delete a fund item, THEN the FundItemDetailModal SHALL display an error message and remain open
4. THE error messages SHALL be user-friendly and translated according to the User's language preference
5. WHEN an error occurs, THE FundItemDetailModal SHALL log the error details to the console for debugging purposes
