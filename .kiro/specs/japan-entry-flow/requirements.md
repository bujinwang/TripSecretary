# Requirements Document

## Introduction

The Japan Entry Flow feature provides a guided, user-friendly workflow for travelers preparing for Japan entry. Unlike Thailand's digital submission system, Japan requires manual completion of physical arrival cards and customs declarations. The system collects and validates travel information, then presents it in an easy-to-reference format for manual form filling at the airport.

## Glossary

- **JapanTravelInfoScreen**: The screen where users enter Japan-specific travel information
- **PassportDataService**: The centralized service for persisting passport, personal, travel, and fund data
- **Entry Pack**: A complete set of travel documents and data prepared for immigration
- **Disembarkation Card**: Japan's arrival card (also called ED card) required for all foreign visitors
- **Customs Declaration**: Japan's customs form required for all arriving passengers
- **ResultScreen**: The screen displaying prepared entry information for manual reference
- **Traveler Payload**: The merged data object containing passport, personal, travel, and fund information

## Requirements

### Requirement 1: Data Collection and Validation

**User Story:** As a traveler preparing for Japan entry, I want to enter my travel information in a structured format, so that I have all required data ready for manual form completion.

#### Acceptance Criteria

1. THE JapanTravelInfoScreen SHALL display four collapsible sections: passport information, personal information, funds, and travel information
2. WHEN the user enters data in any field, THE JapanTravelInfoScreen SHALL save the data to PassportDataService on field blur
3. WHEN the user navigates away from JapanTravelInfoScreen, THE JapanTravelInfoScreen SHALL persist all entered data
4. THE JapanTravelInfoScreen SHALL validate passport number format, date formats, and email format
5. THE JapanTravelInfoScreen SHALL display field count badges showing completion status for each section

### Requirement 2: Passport Information Section

**User Story:** As a traveler, I want to enter my passport details, so that I can reference them when filling the arrival card.

#### Acceptance Criteria

1. THE JapanTravelInfoScreen SHALL collect full name in English, nationality, passport number, date of birth, and passport expiry date
2. THE JapanTravelInfoScreen SHALL display passport fields without visa number field
3. WHEN passport data exists in PassportDataService, THE JapanTravelInfoScreen SHALL pre-populate the passport fields
4. THE JapanTravelInfoScreen SHALL validate passport number format as 6-12 alphanumeric characters
5. THE JapanTravelInfoScreen SHALL validate that expiry date is in the future

### Requirement 3: Personal Information Section

**User Story:** As a traveler, I want to enter my contact and residence information, so that I have it ready for the arrival forms.

#### Acceptance Criteria

1. THE JapanTravelInfoScreen SHALL collect occupation, city of residence, resident country, phone number, email, and gender
2. WHEN the user selects a resident country, THE JapanTravelInfoScreen SHALL auto-populate phone code based on the selected country
3. THE JapanTravelInfoScreen SHALL validate email format
4. THE JapanTravelInfoScreen SHALL provide gender options: Male, Female, Undefined
5. WHEN personal info exists in PassportDataService, THE JapanTravelInfoScreen SHALL pre-populate the personal information fields

### Requirement 4: Fund Information Section

**User Story:** As a traveler, I want to document my available funds, so that I can reference them if asked by immigration.

#### Acceptance Criteria

1. THE JapanTravelInfoScreen SHALL allow adding multiple fund items: cash, credit card photo, bank balance
2. WHEN the user adds a fund item, THE JapanTravelInfoScreen SHALL save it to PassportDataService immediately
3. THE JapanTravelInfoScreen SHALL allow users to take photos or select from library for credit card proof and bank balance proof
4. THE JapanTravelInfoScreen SHALL store fund item photos in permanent storage
5. THE JapanTravelInfoScreen SHALL allow users to delete fund items

### Requirement 5: Travel Information Section for Japan

**User Story:** As a traveler to Japan, I want to enter my flight and accommodation details, so that I can accurately complete the arrival card.

#### Acceptance Criteria

1. THE JapanTravelInfoScreen SHALL collect travel purpose with Japan-specific options: Tourism, Business, Visiting Friends/Relatives, Conference, Other
2. THE JapanTravelInfoScreen SHALL collect arrival flight number and arrival date
3. THE JapanTravelInfoScreen SHALL collect accommodation type: Hotel, Ryokan, Friend's House, Airbnb, Other
4. THE JapanTravelInfoScreen SHALL collect accommodation name and full address in Japan
5. THE JapanTravelInfoScreen SHALL collect accommodation phone number
6. THE JapanTravelInfoScreen SHALL collect intended length of stay in days
7. THE JapanTravelInfoScreen SHALL display travel fields without departure flight information fields
8. THE JapanTravelInfoScreen SHALL display accommodation address as free-form text input without province/district selectors

### Requirement 6: Form Validation and Completion Tracking

**User Story:** As a traveler, I want to see which sections are complete, so that I know what information is still needed.

#### Acceptance Criteria

1. THE JapanTravelInfoScreen SHALL display a field count badge on each section showing filled fields count and total fields count
2. WHEN all required fields in a section are filled, THE JapanTravelInfoScreen SHALL display a green complete badge
3. WHEN fields are missing in a section, THE JapanTravelInfoScreen SHALL display a yellow incomplete badge
4. WHEN all required fields are filled, THE JapanTravelInfoScreen SHALL enable the "查看入境指南" button
5. THE JapanTravelInfoScreen SHALL allow progressive data entry without blocking navigation

### Requirement 7: Manual Entry Guide Navigation

**User Story:** As a traveler with complete information, I want to access a manual entry guide, so that I can efficiently fill out the physical forms at the airport.

#### Acceptance Criteria

1. THE JapanTravelInfoScreen SHALL display a "查看入境指南" button at the bottom
2. WHEN all required fields are filled, THE JapanTravelInfoScreen SHALL enable the "查看入境指南" button
3. WHEN the user taps the "查看入境指南" button, THE JapanTravelInfoScreen SHALL save all data to PassportDataService
4. WHEN data save completes, THE JapanTravelInfoScreen SHALL navigate to ResultScreen with Japan context
5. THE ResultScreen SHALL display the Traveler Payload formatted for easy reference

### Requirement 8: Data Persistence and Recovery

**User Story:** As a traveler who may close the app, I want my entered data to be saved, so that I don't have to re-enter everything.

#### Acceptance Criteria

1. WHEN the user enters data in any field, THE JapanTravelInfoScreen SHALL save to PassportDataService on blur
2. WHEN the user navigates back, THE JapanTravelInfoScreen SHALL save all current data before navigation
3. WHEN JapanTravelInfoScreen gains focus, THE JapanTravelInfoScreen SHALL reload data from PassportDataService
4. THE JapanTravelInfoScreen SHALL associate travel info with destination ID "japan" for consistent lookup
5. THE PassportDataService SHALL handle migration from legacy storage formats automatically

### Requirement 9: Japan-Specific Field Requirements

**User Story:** As a system collecting Japan entry data, I want to enforce Japan-specific requirements, so that users have the correct information for Japanese immigration.

#### Acceptance Criteria

1. THE JapanTravelInfoScreen SHALL display travel fields without departure flight information fields
2. THE JapanTravelInfoScreen SHALL display accommodation address without province/district selectors
3. THE JapanTravelInfoScreen SHALL collect full accommodation address as free-form text
4. THE JapanTravelInfoScreen SHALL collect accommodation phone number
5. THE JapanTravelInfoScreen SHALL collect intended length of stay in days

### Requirement 10: Accommodation Address Formatting

**User Story:** As a traveler, I want guidance on entering my Japan accommodation address, so that I format it correctly for the arrival card.

#### Acceptance Criteria

1. THE JapanTravelInfoScreen SHALL provide help text showing Japanese address format example
2. THE JapanTravelInfoScreen SHALL accept multi-line address input
3. THE JapanTravelInfoScreen SHALL save accommodation name separately from address
4. WHEN accommodation type is selected, THE JapanTravelInfoScreen SHALL validate that accommodation address is not empty
5. THE JapanTravelInfoScreen SHALL provide address examples like "1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0002"
