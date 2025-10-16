# Requirements Document

## Introduction

The Thailand Entry Flow feature provides a guided, user-friendly workflow for travelers completing Thailand arrival card (TDAC) submissions. The system validates data completeness, enforces timing windows, offers multiple submission methods (automated digital, WebView-assisted, manual), and integrates with existing TDAC automation infrastructure while maintaining data persistence through PassportDataService.

## Glossary

- **TDAC**: Thailand Digital Arrival Card - the online arrival card system for Thailand immigration
- **ThailandTravelInfoScreen**: The existing screen where users enter Thailand-specific travel information
- **PassportDataService**: The centralized service for persisting passport, personal, travel, and fund data
- **Entry Pack**: A complete set of travel documents and data prepared for immigration
- **72h Window**: The time restriction requiring TDAC submission within 72 hours before arrival
- **TDACHybridScreen**: The existing screen that automates TDAC form submission
- **ResultScreen**: The screen displaying generated entry documents and submission results
- **Traveler Payload**: The merged data object containing passport, personal, travel, and fund information

## Requirements

### Requirement 1: Data Validation and Preflight Check

**User Story:** As a traveler completing the Thailand travel form, I want the system to validate my data before proceeding, so that I can fix any issues before attempting submission.

#### Acceptance Criteria

1. WHEN the user taps "生成入境卡" on ThailandTravelInfoScreen, THE System SHALL invoke saveDataToSecureStorage() to persist all current form data
2. WHEN data persistence completes, THE System SHALL validate passport completeness, personal information completeness, fund item validity, and travel information completeness
3. IF any required field is missing or invalid, THEN THE System SHALL display blocking error messages in-place on ThailandTravelInfoScreen
4. IF the arrival date is outside the 72-hour submission window, THEN THE System SHALL display a timing warning message
5. WHEN all validation passes, THE System SHALL navigate to ThailandEntryFlowScreen with validated data context

### Requirement 2: Readiness Summary Display

**User Story:** As a traveler preparing for Thailand entry, I want to see a summary of my data completeness, so that I can quickly identify and fix any missing information.

#### Acceptance Criteria

1. THE ThailandEntryFlowScreen SHALL display four data category tiles: passport, personal information, funds, and travel information
2. WHEN a data category is complete and valid, THE System SHALL display a checkmark indicator on that category tile
3. WHEN a data category is incomplete or invalid, THE System SHALL display a warning indicator on that category tile
4. WHEN the user taps a category tile, THE System SHALL navigate back to the appropriate editing screen
5. WHEN all four categories show checkmarks, THE System SHALL display "All set" status message

### Requirement 3: Digital TDAC Submission with Timing Enforcement

**User Story:** As a traveler within 72 hours of arrival, I want to automatically submit my TDAC digitally, so that I can complete the process quickly without manual form filling.

#### Acceptance Criteria

1. THE ThailandEntryFlowScreen SHALL display a primary CTA button labeled "自动提交 TDAC"
2. WHEN the arrival date is more than 72 hours away, THE System SHALL disable the "自动提交 TDAC" button and display the date and time when submission will be available
3. WHEN the arrival date is more than 72 hours away, THE System SHALL display the remaining time in "Days: HH:MM" format
4. WHEN the arrival date is within 72 hours, THE System SHALL enable the "自动提交 TDAC" button
5. WHEN the user taps the enabled "自动提交 TDAC" button, THE System SHALL build a traveler payload from PassportDataService data
6. WHEN the traveler payload is complete, THE System SHALL navigate to TDACSelectionScreen with the payload as navigation parameters

### Requirement 4: Manual Fallback Options

**User Story:** As a traveler who cannot use automated submission, I want alternative methods to complete my TDAC, so that I can still succeed even if automation fails.

#### Acceptance Criteria

1. THE ThailandEntryFlowScreen SHALL display a secondary action button labeled "手动抄写"
2. WHEN the user taps "手动抄写", THE System SHALL navigate to TDACGuideScreen
3. THE ThailandEntryFlowScreen SHALL display a secondary action button labeled "WebView 自动填表"
4. WHEN the user taps "WebView 自动填表", THE System SHALL navigate to TDACWebViewScreen with traveler payload
5. THE System SHALL display these fallback options regardless of the 72-hour window status

### Requirement 5: TDAC Submission Metadata Persistence

**User Story:** As a system managing TDAC submissions, I want to store submission results and metadata, so that users can track submission status and access generated documents.

#### Acceptance Criteria

1. WHEN a TDAC submission completes successfully, THE System SHALL persist submission status, arrCardNo, qrUri, submittedAt timestamp, and pdfPath
2. WHEN a TDAC submission fails, THE System SHALL persist error status and failure logs
3. THE System SHALL associate submission metadata with the specific travel information record via userId
4. WHEN the user returns to ThailandEntryFlowScreen, THE System SHALL retrieve and display the latest submission status
5. THE System SHALL support multiple submission attempts with historical tracking

### Requirement 6: Arrival Window Calculation and Messaging

**User Story:** As a traveler planning my submission timing, I want to see when I can submit my TDAC, so that I can plan accordingly and receive reminders.

#### Acceptance Criteria

1. THE System SHALL calculate the 72-hour window based on the arrival date from TravelInfo
2. WHEN the arrival is more than 72 hours away, THE System SHALL display the submission availability date and time
3. WHEN the arrival is more than 72 hours away, THE System SHALL display remaining time in "Days: HH:MM" format
4. WHEN the arrival is within 72 hours, THE System SHALL display "可以提交" status
5. WHEN the arrival is within 24 hours, THE System SHALL display countdown messaging showing hours remaining
6. THE System SHALL update window status dynamically when the user returns to ThailandEntryFlowScreen

### Requirement 7: Traveler Context Building

**User Story:** As a system preparing TDAC submissions, I want to merge all traveler data into a single payload, so that downstream screens receive consistent, complete data.

#### Acceptance Criteria

1. THE System SHALL implement buildThailandTravelerContext(userId) function
2. WHEN buildThailandTravelerContext is invoked, THE System SHALL retrieve passport data, personal information, travel information, and fund items in a single operation
3. WHEN data retrieval completes, THE System SHALL merge data using the existing mergeTDACData helper
4. WHEN any required data is missing, THE System SHALL return validation errors
5. THE System SHALL return a complete traveler payload object compatible with TDACHybridScreen expectations

### Requirement 8: Post-Submission Navigation and Status Display

**User Story:** As a traveler who completed TDAC submission, I want to see my submission results and access my entry documents, so that I can prepare for arrival.

#### Acceptance Criteria

1. WHEN TDAC submission succeeds, THE System SHALL navigate to ResultScreen with submission metadata
2. WHEN TDAC submission fails, THE System SHALL navigate back to ThailandEntryFlowScreen with error details
3. THE ThailandEntryFlowScreen SHALL display stored QR code thumbnail when submission succeeded
4. WHEN the user taps the QR code thumbnail, THE System SHALL navigate to ResultScreen
5. WHEN submission fails, THE System SHALL display "改用 WebView/手动填写" action buttons

### Requirement 9: Entry Pack Access

**User Story:** As a traveler preparing for arrival, I want to access my complete entry pack with all documents, so that I have everything ready for immigration.

#### Acceptance Criteria

1. THE ThailandEntryFlowScreen SHALL display a "查看入境包" CTA button
2. WHEN the user taps "查看入境包", THE System SHALL navigate to ResultScreen with preloaded traveler data
3. THE ResultScreen SHALL display QR code, submission confirmation, and sharing options
4. THE ResultScreen SHALL include a "落地流程" button
5. WHEN the user taps "落地流程", THE System SHALL navigate to InteractiveImmigrationGuide

### Requirement 10: Duplicate Prevention

**User Story:** As a system managing submissions, I want to prevent duplicate TDAC submissions for the same trip, so that users don't create conflicting records.

#### Acceptance Criteria

1. WHEN building traveler context, THE System SHALL check for existing TDAC submissions for the same userId and destination
2. IF a successful submission exists within 7 days for the same arrival date, THEN THE System SHALL display existing submission details instead of allowing new submission
3. WHEN the user explicitly requests resubmission, THE System SHALL mark the previous submission as superseded
4. THE System SHALL maintain submission history for audit purposes
5. THE System SHALL allow new submissions for different trips (different arrival dates or destinations)
