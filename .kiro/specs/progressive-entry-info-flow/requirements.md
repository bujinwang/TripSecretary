# Requirements Document

## Introduction

The Progressive Entry Info Flow feature optimizes the user experience for travelers who need to fill out entry information across multiple sessions. Instead of forcing users to complete all fields before seeing the next steps, this feature allows users to save partial progress, view their completion status, and return to editing at any time. This addresses the real-world scenario where users may need time to gather documents (like fund proofs) or make travel arrangements before completing all required fields.

## Glossary

- **Entry Info**: The complete set of data required for entry card generation, including passport, personal info, funds, and travel details
- **Completion Status**: A visual indicator showing which data categories are complete and which need attention
- **Progressive Filling**: The ability to save partial data and continue later without losing progress
- **Soft Validation**: Non-blocking validation that warns users about missing fields but allows navigation
- **Hard Validation**: Blocking validation that prevents TDAC submission until all required fields are complete
- **Preparation Screen**: The intermediate screen (ThailandEntryFlowScreen) that shows completion status and guides next steps
- **Auto-save**: Automatic data persistence when users navigate away or edit fields

## Requirements

### Requirement 1: Allow Partial Progress Navigation

**User Story:** As a traveler who hasn't finished filling all entry information, I want to see what's required and check my progress, so that I can understand what's missing and plan when to complete it.

#### Acceptance Criteria

1. THE System SHALL allow users to navigate from ThailandTravelInfoScreen to ThailandEntryFlowScreen at any time, regardless of form completion status
2. WHEN the user taps "查看准备状态" button on ThailandTravelInfoScreen, THE System SHALL save all current form data automatically
3. WHEN navigation occurs, THE System SHALL NOT block users with validation errors for incomplete fields
4. THE System SHALL display soft validation warnings for missing required fields without preventing navigation
5. WHEN the user returns to ThailandTravelInfoScreen from ThailandEntryFlowScreen, THE System SHALL restore all previously entered data

### Requirement 2: Visual Completion Status Dashboard

**User Story:** As a traveler reviewing my entry preparation, I want to see a clear visual summary of what's complete and what's missing, so that I can quickly identify what I need to do next.

#### Acceptance Criteria

1. THE ThailandEntryFlowScreen SHALL display four data category cards: Passport Information, Personal Information, Fund Information, and Travel Information
2. WHEN a data category is 100% complete, THE System SHALL display a green checkmark (✓) icon on that category card
3. WHEN a data category is partially complete, THE System SHALL display a yellow warning (⚠) icon and show "X/Y fields completed"
4. WHEN a data category is empty or has critical errors, THE System SHALL display a red alert (❌) icon
5. THE System SHALL display the total completion percentage prominently at the top of the screen
6. WHEN the user taps any category card, THE System SHALL navigate back to ThailandTravelInfoScreen with that section expanded

### Requirement 3: 72-Hour Window Display and Countdown Logic

**User Story:** As a traveler preparing my Thailand entry, I want to see clear timing information about when I can submit my TDAC, so that I can plan my submission appropriately.

#### Acceptance Criteria

1. WHEN the arrival flight date is NOT set, THE System SHALL display "未设置泰国入境日期，无法提交入境卡" message
2. WHEN the arrival date is more than 72 hours away, THE System SHALL display "还有 X 天 HH:MM 可以提交入境卡"
3. WHEN the arrival date is within 72 hours, THE System SHALL display "距离截止还有 HH:MM，请尽快提交"
4. WHEN the arrival date is within 24 hours, THE System SHALL display countdown in red color with urgency indicator
5. THE System SHALL calculate time remaining based on arrival flight date from TravelInfo
6. THE System SHALL update countdown display in real-time when the user is viewing the screen

### Requirement 4: Smart Button States Based on Completion

**User Story:** As a traveler on the preparation screen, I want the available actions to reflect my current completion status, so that I know what I can do next.

#### Acceptance Criteria

1. WHEN all four data categories are 100% complete AND within the 72-hour submission window, THE System SHALL display an enabled "自动提交 TDAC" primary button
2. WHEN any data category is incomplete, THE System SHALL display a disabled "自动提交 TDAC" button with explanatory text showing what's missing
3. WHEN all data is complete BUT outside the 72-hour window, THE System SHALL display the submission availability time and disabled button
4. WHEN the arrival date is not set, THE System SHALL hide the "自动提交 TDAC" button entirely
5. THE System SHALL always display "返回继续填写" button as an enabled secondary action
6. THE System SHALL always display "手动抄写" and "WebView 自动填表" buttons as enabled fallback options

### Requirement 4: Automatic Data Persistence

**User Story:** As a traveler filling out entry information over multiple sessions, I want my data to be saved automatically, so that I don't lose my progress if I close the app or navigate away.

#### Acceptance Criteria

1. WHEN the user edits any field and moves to the next field (onBlur event), THE System SHALL save that field's data to PassportDataService
2. WHEN the user navigates away from ThailandTravelInfoScreen, THE System SHALL save all current form data before navigation
3. WHEN the user closes the app, THE System SHALL persist all entered data to secure local storage
4. WHEN the user returns to ThailandTravelInfoScreen, THE System SHALL load all previously saved data automatically
5. THE System SHALL display "上次编辑: [timestamp]" indicator showing when data was last saved

### Requirement 5: Progressive Validation Strategy

**User Story:** As a traveler filling out forms, I want to receive helpful validation feedback without being blocked from exploring the process, so that I can understand requirements while working at my own pace.

#### Acceptance Criteria

1. THE System SHALL perform soft validation (warnings only) when navigating from ThailandTravelInfoScreen to ThailandEntryFlowScreen
2. THE System SHALL perform hard validation (blocking) only when attempting to submit TDAC
3. WHEN a field has a format error (e.g., invalid email), THE System SHALL display an inline error message immediately after blur
4. WHEN a required field is empty, THE System SHALL display a yellow warning indicator but NOT prevent navigation
5. THE System SHALL collect all validation warnings and display them as a summary on ThailandEntryFlowScreen

### Requirement 6: Session Continuity and Recovery

**User Story:** As a traveler who needs to gather documents over time, I want to easily resume where I left off, so that I can complete my entry information efficiently across multiple sessions.

#### Acceptance Criteria

1. WHEN the user returns to the app after closing it, THE System SHALL restore the last editing session state
2. THE System SHALL display a "继续上次填写" quick action on the home screen if incomplete entry data exists
3. WHEN the user taps "继续上次填写", THE System SHALL navigate directly to ThailandTravelInfoScreen with the last edited section expanded
4. THE System SHALL preserve section expansion state (which CollapsibleSection was open) across sessions
5. THE System SHALL display progress indicators showing "3/4 sections complete" on the home screen

### Requirement 7: Clear Missing Field Guidance

**User Story:** As a traveler viewing my preparation status, I want to see exactly which fields are missing, so that I know precisely what to fill in next.

#### Acceptance Criteria

1. WHEN a data category is incomplete, THE System SHALL display a list of missing required fields when the user taps the category card
2. THE System SHALL prioritize critical missing fields (passport number, arrival date) over optional fields
3. WHEN the user taps a specific missing field in the list, THE System SHALL navigate to ThailandTravelInfoScreen and focus that field
4. THE System SHALL display field-specific help text explaining why each field is required
5. THE System SHALL update the missing fields list in real-time as the user completes fields

### Requirement 8: Flexible "Continue" Button Behavior

**User Story:** As a traveler on the travel info screen, I want the continue button to adapt to my current progress, so that I can always move forward regardless of completion status.

#### Acceptance Criteria

1. THE "查看准备状态" button on ThailandTravelInfoScreen SHALL always be enabled, regardless of form completion
2. WHEN the user taps "查看准备状态", THE System SHALL save current data and navigate to ThailandEntryFlowScreen
3. THE System SHALL replace the current disabled "生成入境卡" button with the always-enabled "查看准备状态" button
4. THE button label SHALL change based on context: "查看准备状态" when incomplete, "提交入境卡" when complete
5. THE System SHALL display a subtle progress indicator (e.g., "75% complete") near the button

### Requirement 9: Time-Based Reminders and Notifications

**User Story:** As a traveler who saved partial entry information, I want to receive reminders when I should complete my submission, so that I don't miss the 72-hour submission window.

#### Acceptance Criteria

1. WHEN the user has incomplete entry data AND the arrival date is within 5 days, THE System SHALL display a reminder notification
2. WHEN the 72-hour submission window opens, THE System SHALL send a push notification (if permissions granted)
3. WHEN the user opens the app with pending incomplete data, THE System SHALL display a banner showing days until arrival
4. THE System SHALL display urgency indicators: green (>3 days), yellow (1-3 days), red (<24 hours)
5. THE System SHALL allow users to dismiss reminders or set custom reminder times

### Requirement 10: Multi-Destination Progress Tracking

**User Story:** As a traveler planning trips to multiple destinations, I want to track entry information progress separately for each destination, so that I can manage multiple trips efficiently.

#### Acceptance Criteria

1. THE System SHALL maintain separate completion status for each destination (Thailand, Japan, Singapore, etc.)
2. WHEN the user has partial data for multiple destinations, THE System SHALL display a list of all in-progress destinations
3. THE System SHALL allow users to switch between destinations without losing progress on any
4. WHEN the user completes one destination's entry info, THE System SHALL mark it as "Ready" while others remain "In Progress"
5. THE System SHALL display destination-specific completion percentages on the home screen

