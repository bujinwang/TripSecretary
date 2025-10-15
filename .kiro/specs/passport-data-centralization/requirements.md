# Requirements Document

## Introduction

This feature addresses the current fragmentation of user data management across the application. Currently, passport information, personal information, and funding proof are duplicated and managed separately in different entry forms (Thailand, Japan, etc.) and the Profile screen, leading to data inconsistency and poor user experience. The goal is to centralize all user data storage in SQLite tables that serve as the single source of truth, ensuring data consistency across all screens and reducing redundant data entry.

The centralization covers three main data categories:
1. **Passport Data** - Passport number, full name, nationality, DOB, expiry date, issue date, issue place, gender
2. **Personal Information** - Phone number, email, occupation, city/province, country/region, home address
3. **Funding Proof** - Cash amount, bank cards, supporting documents

## Requirements

### Requirement 1: Centralized Passport Data Storage

**User Story:** As a traveler, I want my passport information to be stored in one place, so that I don't have to re-enter the same information for different destinations.

#### Acceptance Criteria

1. WHEN the app initializes THEN the system SHALL create a centralized `passports` table in SQLite if it doesn't exist
2. WHEN passport data is entered or updated in any screen THEN the system SHALL save it to the centralized `passports` table
3. WHEN a user navigates to any entry form (Thailand, Japan, etc.) THEN the system SHALL load passport data from the centralized table
4. WHEN a user updates passport data in the Profile screen THEN the system SHALL update the centralized table and reflect changes in all entry forms
5. IF passport data exists in the centralized table THEN the system SHALL pre-populate all passport fields in entry forms
6. WHEN passport data includes gender field THEN the system SHALL store and retrieve it consistently across all screens

### Requirement 2: Profile Screen as Passport Data Manager

**User Story:** As a traveler, I want to manage my passport information from my profile, so that I can update it once and have it apply everywhere.

#### Acceptance Criteria

1. WHEN a user opens the Profile screen THEN the system SHALL display current passport data from the centralized table
2. WHEN a user edits passport fields in the Profile screen THEN the system SHALL validate the data before saving
3. WHEN passport data is successfully updated in Profile THEN the system SHALL persist changes to the centralized SQLite table
4. WHEN a user returns to any entry form after updating Profile THEN the system SHALL display the updated passport data
5. IF passport data is missing in the centralized table THEN the Profile screen SHALL allow the user to enter it for the first time

### Requirement 3: Entry Form Integration with Centralized Data

**User Story:** As a traveler filling out an entry form, I want my passport information to be automatically loaded, so that I can focus on destination-specific details.

#### Acceptance Criteria

1. WHEN a user navigates to an entry form (e.g., ThailandTravelInfoScreen) THEN the system SHALL load passport data from the centralized table
2. WHEN passport data is loaded THEN the system SHALL populate all passport-related fields (name, passport number, nationality, DOB, expiry date, gender)
3. WHEN a user modifies passport data in an entry form THEN the system SHALL update the centralized table
4. WHEN passport data is updated in an entry form THEN the system SHALL sync the changes to the Profile screen
5. IF a user creates a new entry for a different destination THEN the system SHALL reuse the same passport data from the centralized table

### Requirement 4: Data Migration and Backward Compatibility

**User Story:** As an existing user, I want my previously entered passport data to be preserved, so that I don't lose any information when the app updates.

#### Acceptance Criteria

1. WHEN the app detects existing passport data in AsyncStorage THEN the system SHALL migrate it to the centralized SQLite table
2. WHEN migration occurs THEN the system SHALL preserve all existing passport fields without data loss
3. WHEN migration is complete THEN the system SHALL mark the migration as complete to prevent duplicate migrations
4. IF migration fails THEN the system SHALL log the error and fall back to AsyncStorage without breaking the app
5. WHEN migration succeeds THEN the system SHALL continue using the centralized SQLite table for all future operations

### Requirement 5: Data Consistency and Validation

**User Story:** As a traveler, I want the app to ensure my passport data is consistent and valid, so that I can trust the information when filling out entry forms.

#### Acceptance Criteria

1. WHEN passport data is saved THEN the system SHALL validate required fields (passport number, full name, nationality, DOB, expiry date)
2. WHEN validation fails THEN the system SHALL display clear error messages indicating which fields are invalid
3. WHEN passport data is updated in one location THEN the system SHALL ensure all other locations reflect the same data
4. WHEN a user has multiple passports THEN the system SHALL support storing and selecting between them
5. IF passport data conflicts exist between AsyncStorage and SQLite THEN the system SHALL prioritize SQLite as the source of truth

### Requirement 6: Secure Data Handling

**User Story:** As a traveler, I want my passport information to be stored securely, so that my sensitive data is protected.

#### Acceptance Criteria

1. WHEN passport data is saved to SQLite THEN the system SHALL use the existing SecureStorageService encryption mechanisms
2. WHEN passport data is retrieved THEN the system SHALL decrypt it using the appropriate encryption keys
3. WHEN the app is closed THEN the system SHALL ensure all encryption keys are properly cleared from memory
4. IF encryption fails THEN the system SHALL log the error and prevent saving unencrypted sensitive data
5. WHEN audit logging is enabled THEN the system SHALL log all passport data access and modifications

### Requirement 7: Centralized Personal Information Storage

**User Story:** As a traveler, I want my personal information to be stored centrally, so that I can reuse it across different entry forms without re-entering.

#### Acceptance Criteria

1. WHEN the app initializes THEN the system SHALL create a centralized `personal_info` table in SQLite if it doesn't exist
2. WHEN personal information is entered or updated in any screen THEN the system SHALL save it to the centralized `personal_info` table
3. WHEN a user navigates to any entry form THEN the system SHALL load personal information from the centralized table
4. WHEN a user updates personal information in the Profile screen THEN the system SHALL update the centralized table and reflect changes in all entry forms
5. IF personal information exists in the centralized table THEN the system SHALL pre-populate all personal info fields in entry forms
6. WHEN personal information includes occupation, city, country, phone, and email THEN the system SHALL store and retrieve them consistently

### Requirement 8: Centralized Funding Proof Storage

**User Story:** As a traveler, I want my funding proof information to be stored centrally, so that I can reuse it for different trips without re-entering.

#### Acceptance Criteria

1. WHEN the app initializes THEN the system SHALL create a centralized `funding_proof` table in SQLite if it doesn't exist
2. WHEN funding proof is entered or updated in any screen THEN the system SHALL save it to the centralized `funding_proof` table
3. WHEN a user navigates to any entry form THEN the system SHALL load funding proof from the centralized table
4. WHEN a user updates funding proof in the Profile screen THEN the system SHALL update the centralized table and reflect changes in all entry forms
5. IF funding proof exists in the centralized table THEN the system SHALL pre-populate funding proof fields in entry forms
6. WHEN funding proof includes cash amount, bank cards, and supporting documents THEN the system SHALL store and retrieve them consistently

### Requirement 9: Unified Data Service Layer

**User Story:** As a developer, I want a unified service layer for data access, so that all screens use consistent methods to read and write user data.

#### Acceptance Criteria

1. WHEN any screen needs to access user data THEN the system SHALL provide a unified PassportDataService
2. WHEN PassportDataService is called THEN it SHALL handle all CRUD operations for passport, personal info, and funding proof
3. WHEN data is requested THEN the service SHALL return data from SQLite as the single source of truth
4. WHEN data is updated THEN the service SHALL ensure all related screens are notified of changes
5. IF AsyncStorage data exists THEN the service SHALL migrate it to SQLite on first access

### Requirement 10: Performance and User Experience

**User Story:** As a traveler, I want all my data to load quickly, so that I can fill out entry forms without delays.

#### Acceptance Criteria

1. WHEN user data is requested THEN the system SHALL retrieve it from SQLite within 100ms
2. WHEN multiple screens request user data simultaneously THEN the system SHALL handle concurrent requests without data corruption
3. WHEN user data is being saved THEN the system SHALL provide visual feedback to the user
4. WHEN network is unavailable THEN the system SHALL continue to function using local SQLite data
5. IF SQLite operations fail THEN the system SHALL provide graceful error handling and user-friendly error messages
