# Requirements Document

## Introduction

This feature enhances the ProfileScreen to allow users to create, view, edit, and delete fund items directly within the Profile interface. Currently, users can only view existing fund items in Profile and must navigate to the ThailandTravelInfo screen to add new items. This creates an inconsistent user experience since passport and personal data can be fully managed in Profile. This enhancement will centralize all user data management in one location and remove the dependency on destination-specific screens for managing centralized data.

## Glossary

- **ProfileScreen**: The main user profile interface where users manage their passport, personal information, and fund items
- **FundItem**: A financial proof record (cash, bank card, document, etc.) stored in the centralized database
- **FundItemDetailModal**: A modal component that displays and allows editing of fund item details
- **PassportDataService**: The centralized service for managing all user data including fund items
- **Funding Section**: The collapsible section in ProfileScreen that displays the user's fund items list

## Requirements

### Requirement 1: Add Fund Item Creation Capability

**User Story:** As a user, I want to add new fund items directly from my Profile screen, so that I can manage all my data in one place without navigating to destination-specific screens.

#### Acceptance Criteria

1. WHEN the user expands the Funding Section, THE ProfileScreen SHALL display an "Add Fund Item" button
2. WHEN the user taps the "Add Fund Item" button, THE ProfileScreen SHALL open the FundItemDetailModal in create mode
3. WHEN the FundItemDetailModal opens in create mode, THE modal SHALL display empty fields for entering new fund item data
4. WHEN the user saves a new fund item, THE ProfileScreen SHALL refresh the fund items list to display the newly created item
5. WHEN the user cancels fund item creation, THE ProfileScreen SHALL close the modal without creating a new item

### Requirement 2: Remove Navigation to ThailandTravelInfo Screen

**User Story:** As a user, I want to manage fund items without being redirected to other screens, so that I have a seamless and intuitive experience.

#### Acceptance Criteria

1. THE ProfileScreen SHALL NOT display the "Scan / Upload Funding Proof" button that navigates to ThailandTravelInfo
2. THE ProfileScreen SHALL remove the handleManageFundItems function that navigates to ThailandTravelInfo
3. THE FundItemDetailModal SHALL NOT include a "Manage All" action that navigates to ThailandTravelInfo
4. WHEN the user wants to add a fund item, THE ProfileScreen SHALL provide the "Add Fund Item" button instead of navigation
5. THE ProfileScreen SHALL maintain all existing view and edit functionality for fund items

### Requirement 3: Maintain Existing Fund Item Functionality

**User Story:** As a user, I want to continue viewing and editing my existing fund items, so that I don't lose any functionality I currently have.

#### Acceptance Criteria

1. WHEN the user taps an existing fund item, THE ProfileScreen SHALL open the FundItemDetailModal in edit mode
2. WHEN the user updates a fund item, THE ProfileScreen SHALL refresh the fund items list to reflect the changes
3. WHEN the user deletes a fund item, THE ProfileScreen SHALL remove it from the list and close the modal
4. THE ProfileScreen SHALL continue to display fund item type icons, labels, and values as currently implemented
5. THE ProfileScreen SHALL maintain the field count indicator showing filled/total fund items

### Requirement 4: Update UI Layout and Styling

**User Story:** As a user, I want the fund item management interface to be visually consistent with the rest of the Profile screen, so that the experience feels cohesive.

#### Acceptance Criteria

1. THE "Add Fund Item" button SHALL use consistent styling with other action buttons in ProfileScreen
2. THE "Add Fund Item" button SHALL be positioned below the fund items list and above the footer note
3. WHEN no fund items exist, THE ProfileScreen SHALL display the "Add Fund Item" button with an empty state message
4. THE "Add Fund Item" button SHALL include an appropriate icon (e.g., "➕" or "📎")
5. THE button SHALL be accessible with proper accessibility labels and roles

### Requirement 5: Support Internationalization

**User Story:** As a user, I want the new fund item management features to support multiple languages, so that I can use the app in my preferred language.

#### Acceptance Criteria

1. THE "Add Fund Item" button text SHALL be translatable via the i18n system
2. THE empty state message SHALL be translatable via the i18n system
3. THE ProfileScreen SHALL use existing translation keys where applicable
4. WHEN the language changes, THE new UI elements SHALL display text in the selected language
5. THE translation keys SHALL follow the existing naming convention (e.g., 'profile.funding.addButton')
