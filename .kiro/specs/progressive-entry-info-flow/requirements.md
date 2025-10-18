# Requirements Document

## Introduction

The Progressive Entry Info Flow feature optimizes the user experience for travelers who need to fill out entry information across multiple sessions. Instead of forcing users to complete all fields before seeing the next steps, this feature allows users to save partial progress, view their completion status, and return to editing at any time. This addresses the real-world scenario where users may need time to gather documents (like fund proofs) or make travel arrangements before completing all required fields.

## Glossary

- **Entry Info**: The complete set of data required for entry card generation, including passport, personal info, funds, and travel details
- **Entry Pack**: A complete package of travel documents including QR code, PDF, submission confirmation, and immigration guide access
- **Completion Status**: A visual indicator showing which data categories are complete and which need attention
- **Progressive Filling**: The ability to save partial data and continue later without losing progress
- **Soft Validation**: Non-blocking validation that warns users about missing fields but allows navigation
- **Hard Validation**: Blocking validation that prevents TDAC submission until all required fields are complete
- **Preparation Screen**: The intermediate screen (ThailandEntryFlowScreen) that shows completion status and guides next steps
- **Auto-save**: Automatic data persistence when users navigate away or edit fields
- **72-Hour Window**: The time restriction requiring TDAC submission within 72 hours before arrival
- **Submission Countdown**: Real-time display showing time remaining until submission deadline or time until submission becomes available
- **Superseded Submission**: A previous TDAC submission that has been invalidated due to data edits, requiring resubmission
- **即将出行 (Upcoming Trips)**: Home screen section displaying active entry packs for trips with future arrival dates
- **历史记录 (History)**: Archive section for completed trips and past entry packs
- **开始入境指引 (Start Immigration Guide)**: Button that becomes available after successful TDAC submission, leading to step-by-step arrival instructions

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

### Requirement 9: Smart Notification System for Entry Preparation

**User Story:** As a traveler who saved partial entry information, I want to receive timely reminders to complete and submit my entry card, so that I don't miss critical deadlines.

#### Acceptance Criteria

1. WHEN the user has set an arrival flight date AND has incomplete entry information, THE System SHALL send a notification reminder
2. WHEN the user taps the incomplete information notification, THE System SHALL navigate directly to ThailandEntryFlowScreen
3. WHEN all entry information is complete AND the 72-hour submission window opens, THE System SHALL send a notification "可以提交泰国入境卡了"
4. WHEN the user taps the submission reminder notification, THE System SHALL navigate to ThailandEntryFlowScreen with the "自动提交 TDAC" button highlighted
5. WHEN the user is within 72 hours AND has not submitted, THE System SHALL send periodic reminders (at 72h, 48h, 24h, 12h, 6h before arrival)
6. THE notification SHALL help users complete Cloudflare human verification by opening the app at the right time
7. THE System SHALL NOT send notifications if the arrival date is not set or if TDAC has already been successfully submitted

### Requirement 10: Entry Pack Creation and Management

**User Story:** As a traveler who successfully submitted my TDAC, I want my entry documents organized in an entry pack with QR code and PDF, so that I have everything ready for immigration.

#### Acceptance Criteria

1. WHEN TDAC submission succeeds, THE System SHALL save the PDF document to the entry pack storage
2. WHEN the PDF is saved, THE System SHALL display the QR code on ThailandEntryFlowScreen
3. WHEN the QR code is displayed, THE System SHALL enable and highlight the "开始入境指引" button
4. THE "开始入境指引" button SHALL NOT be visible before successful TDAC submission
5. WHEN the user taps "开始入境指引", THE System SHALL navigate to the interactive immigration guide with Thailand-specific instructions
6. THE entry pack SHALL include: QR code image, PDF document, submission timestamp, and arrival card number (arrCardNo)

### Requirement 11: Entry Pack Display on Home Screen

**User Story:** As a traveler with an upcoming trip, I want to see my entry pack prominently displayed on the home screen, so that I can quickly access my travel documents.

#### Acceptance Criteria

1. WHEN an entry pack is created (TDAC submitted successfully), THE System SHALL display it in the "即将出行" section on the home screen
2. THE entry pack card SHALL display: destination flag, destination name, arrival date, QR code thumbnail, and completion status
3. WHEN the user taps the entry pack card, THE System SHALL navigate to ThailandEntryFlowScreen showing the complete entry pack
4. THE System SHALL sort entry packs by arrival date, showing the nearest trip first
5. WHEN the arrival date has passed, THE System SHALL automatically move the entry pack to "历史记录" section

### Requirement 12: Direct Entry to Preparation Flow from Destination Selection

**User Story:** As a traveler who selected Thailand from the destination list, I want to see entry requirements and then proceed directly to the preparation screen, so that I understand the context before filling information.

#### Acceptance Criteria

1. WHEN the user selects Thailand from the destination list, THE System SHALL navigate to ThailandInfoScreen (entry requirements overview)
2. WHEN the user completes viewing ThailandInfoScreen and ThailandRequirementsScreen, THE System SHALL navigate to ThailandEntryFlowScreen
3. WHEN the user arrives at ThailandEntryFlowScreen with incomplete data, THE System SHALL display "这个旅程还未完成，请继续填写信息"
4. THE System SHALL highlight the incomplete data categories with yellow warning indicators
5. WHEN the user taps "继续填写", THE System SHALL navigate to ThailandTravelInfoScreen with the first incomplete section expanded

### Requirement 13: Data Edit Confirmation and Resubmission Warning

**User Story:** As a traveler who already submitted my TDAC, I want to be warned before editing my information, so that I understand I'll need to resubmit.

#### Acceptance Criteria

1. WHEN the user has a successful TDAC submission AND attempts to edit any entry information field, THE System SHALL display a confirmation dialog
2. THE confirmation dialog SHALL state "修改信息后需要重新提交入境卡，确认要修改吗？"
3. WHEN the user confirms the edit, THE System SHALL mark the current submission as "superseded" and allow editing
4. WHEN the user cancels the edit, THE System SHALL return to the previous screen without changes
5. WHEN information is edited after submission, THE System SHALL change the entry pack status to "需要重新提交" and disable the QR code display
6. THE System SHALL require a new TDAC submission before the entry pack becomes valid again

### Requirement 14: Entry Pack Archival to History

**User Story:** As a traveler who completed my trip, I want my entry pack to be automatically archived, so that my home screen stays organized with only upcoming trips.

#### Acceptance Criteria

1. WHEN the arrival date has passed (current date > arrival date + 1 day), THE System SHALL automatically move the entry pack to "历史记录"
2. THE user SHALL be able to manually archive an entry pack by swiping left and selecting "移至历史"
3. WHEN an entry pack is in history, THE System SHALL display it in the "历史记录" tab with a "已完成" badge
4. THE System SHALL allow users to view archived entry packs for reference but NOT edit them
5. WHEN the user taps an archived entry pack, THE System SHALL display a read-only view with all documents and submission details

### Requirement 15: Multi-Destination Progress Tracking

**User Story:** As a traveler planning trips to multiple destinations, I want to track entry information progress separately for each destination, so that I can manage multiple trips efficiently.

#### Acceptance Criteria

1. THE System SHALL maintain separate completion status for each destination (Thailand, Japan, Singapore, etc.)
2. WHEN the user has partial data for multiple destinations, THE System SHALL display a list of all in-progress destinations
3. THE System SHALL allow users to switch between destinations without losing progress on any
4. WHEN the user completes one destination's entry info, THE System SHALL mark it as "Ready" while others remain "In Progress"
5. THE System SHALL display destination-specific completion percentages on the home screen



### Requirement 11: Entry Pack Snapshot Creation

**User Story:** As a system managing entry pack lifecycle, I want to create immutable snapshots of entry packs when they transition to history, so that historical records remain accurate even if user data changes.

#### Acceptance Criteria

1. WHEN an entry pack is marked as completed (user clicks "完成" in InteractiveImmigrationGuide), THE System SHALL create a snapshot of all associated data at that moment
2. WHEN the current time exceeds the arrival date by 24 hours AND the entry pack status is still "in_progress", THE System SHALL automatically create a snapshot and archive the entry pack
3. WHEN the user cancels an entry pack, THE System SHALL create a snapshot of the current state before archiving
4. THE snapshot SHALL include passport information, personal information, fund information, travel information, and the most recent TDAC submission result (if any)
5. WHEN multiple TDAC submissions exist for the same entry pack, THE snapshot SHALL only include the most recent submission data
6. WHEN an entry pack has no TDAC submission (user filled data but never submitted), THE snapshot SHALL still be created with tdacSubmission field set to null
7. THE snapshot SHALL be stored as a read-only immutable record with a unique snapshot ID and timestamp

### Requirement 12: Entry Pack Status Management

**User Story:** As a traveler reviewing my travel history, I want to see the status of each entry pack, so that I understand what happened with each trip.

#### Acceptance Criteria

1. THE System SHALL support the following entry pack statuses: "completed" (入境了), "cancelled" (用户取消), "expired" (过期未使用), "in_progress" (进行中)
2. WHEN the user marks an entry pack as completed in InteractiveImmigrationGuide, THE System SHALL set status to "completed"
3. WHEN the user explicitly cancels an entry pack, THE System SHALL set status to "cancelled"
4. WHEN the arrival date passes by 24 hours without user action, THE System SHALL automatically set status to "expired"
5. THE System SHALL display status badges with appropriate colors: green for "completed", gray for "cancelled", orange for "expired"
6. THE System SHALL only display entry packs with status "in_progress" on the home screen
7. THE System SHALL only display entry packs with status "completed", "cancelled", or "expired" in the History tab

### Requirement 13: History Tab Display with Snapshots

**User Story:** As a traveler viewing my history, I want to see all my past entry packs in chronological order with their status, so that I can review my travel history and access past documents.

#### Acceptance Criteria

1. THE History tab SHALL display entry packs in reverse chronological order (newest first) based on snapshot creation time
2. WHEN displaying an entry pack, THE System SHALL show destination flag, destination name, arrival date, and status badge
3. WHEN the user taps an entry pack in history, THE System SHALL load the snapshot data (not current user data)
4. THE System SHALL display snapshot data as read-only with a visual indicator showing "历史记录 - 只读"
5. THE System SHALL group history items by time periods: "今天", "昨天", "本周", "本月", "更早"
6. THE System SHALL NOT allow users to re-submit TDAC or edit any data from historical snapshots
7. THE System SHALL allow users to view TDAC QR codes and share entry pack information from snapshots

### Requirement 14: Snapshot Data Immutability

**User Story:** As a system maintaining data integrity, I want to ensure snapshot data cannot be modified, so that historical records remain accurate and trustworthy.

#### Acceptance Criteria

1. THE System SHALL store snapshots in a separate storage namespace from active user data
2. WHEN displaying snapshot data, THE System SHALL disable all edit controls and show read-only views
3. THE System SHALL prevent any API calls that attempt to modify snapshot data
4. WHEN the user views a snapshot, THE System SHALL display a banner: "这是历史记录的快照，无法修改"
5. THE System SHALL maintain referential integrity between snapshots and their source entry packs

### Requirement 15: Snapshot Data Structure

**User Story:** As a system storing entry pack snapshots, I want a comprehensive data structure that captures all relevant information, so that snapshots are complete and self-contained.

#### Acceptance Criteria

1. THE snapshot data structure SHALL include: snapshotId, entryPackId, userId, destinationId, status, createdAt, arrivalDate
2. THE snapshot SHALL include complete passport data: passportNumber, fullName, nationality, dateOfBirth, expiryDate, gender
3. THE snapshot SHALL include complete personal info: occupation, provinceCity, countryRegion, phoneNumber, email
4. THE snapshot SHALL include complete fund items array with all fund proofs and their photo URIs (referencing local file paths)
5. THE snapshot SHALL include complete travel info: travelPurpose, boardingCountry, flightNumbers, dates, accommodation details
6. THE snapshot SHALL include the most recent TDAC submission result: arrCardNo, qrUri, pdfPath, submittedAt, submissionMethod
7. WHEN no TDAC submission exists, THE snapshot SHALL set tdacSubmission field to null but still preserve all other entry information

### Requirement 16: Automatic Archival Triggers

**User Story:** As a system managing entry pack lifecycle, I want to automatically archive entry packs when appropriate, so that the active list stays clean and relevant.

#### Acceptance Criteria

1. THE System SHALL run a background check when the app is opened to identify entry packs past their arrival date
2. WHEN an entry pack's arrival date is more than 24 hours in the past AND status is still "in_progress", THE System SHALL create a snapshot and set status to "expired"
3. THE System SHALL use local scheduled notifications (not requiring network) to trigger archival checks
4. THE System SHALL send a local notification when an entry pack is automatically archived: "您的 [目的地] 入境包已自动归档"
5. THE System SHALL allow users to disable automatic archival notifications in Profile settings
6. THE System SHALL allow users to manually archive entry packs before the arrival date by selecting "取消入境包"
7. WHEN the user is offline (e.g., on airplane), THE System SHALL still perform archival operations using local time and cached data

### Requirement 17: History Filtering and Search

**User Story:** As a traveler with many historical entry packs, I want to filter and search my history, so that I can quickly find specific trips.

#### Acceptance Criteria

1. THE History tab SHALL display a filter button in the header
2. WHEN the user taps the filter button, THE System SHALL show filter options: "全部", "已完成", "已取消", "已过期"
3. THE System SHALL support search by destination name or arrival date
4. WHEN the user applies filters, THE System SHALL update the history list to show only matching entry packs
5. THE System SHALL display the count of filtered results: "显示 X 个结果"

### Requirement 18: Snapshot Deletion and Retention

**User Story:** As a user managing my data, I want control over how long historical snapshots are retained, so that I can manage storage and privacy.

#### Acceptance Criteria

1. THE System SHALL retain snapshots indefinitely by default
2. THE System SHALL provide a setting to auto-delete snapshots older than a specified period (30 days, 90 days, 1 year, never)
3. WHEN the user deletes a snapshot from history, THE System SHALL show a confirmation dialog: "删除后无法恢复，确定删除吗？"
4. WHEN a snapshot is deleted, THE System SHALL remove all associated data including photos and documents
5. THE System SHALL display storage usage for snapshots in the Profile settings: "历史记录占用: X MB"


### Requirement 19: Active vs Historical Entry Pack Separation

**User Story:** As a traveler managing my entry packs, I want to clearly distinguish between active (in-progress) and historical (completed/cancelled/expired) entry packs, so that I can focus on what's currently relevant.

#### Acceptance Criteria

1. THE System SHALL display only "in_progress" status entry packs on the Home screen
2. THE System SHALL display only "completed", "cancelled", and "expired" status entry packs in the History tab
3. WHEN an entry pack transitions from "in_progress" to any other status, THE System SHALL remove it from Home and add it to History
4. THE System SHALL display a count badge on the History tab showing the number of historical entry packs
5. WHEN the user has no active entry packs, THE System SHALL display a prompt: "开始新的旅程" on the Home screen

### Requirement 20: Multiple TDAC Submission Tracking

**User Story:** As a system tracking TDAC submissions, I want to record all submission attempts, so that users can see their submission history and troubleshoot issues.

#### Acceptance Criteria

1. THE System SHALL maintain a submission history array within each entry pack, recording all TDAC submission attempts
2. WHEN a TDAC submission is attempted, THE System SHALL append a submission record with timestamp, status, and result
3. WHEN creating a snapshot, THE System SHALL include the complete submission history array
4. THE snapshot SHALL prioritize the most recent successful submission for display purposes
5. WHEN displaying submission history, THE System SHALL show: attempt number, timestamp, status (success/failed), and error message if applicable

### Requirement 21: Snapshot Creation for Incomplete Entry Packs

**User Story:** As a system managing entry pack lifecycle, I want to handle incomplete entry packs appropriately when they expire, so that partial progress is not lost but clearly marked.

#### Acceptance Criteria

1. WHEN an entry pack expires without TDAC submission, THE System SHALL still create a snapshot with status "expired"
2. THE snapshot SHALL include a completeness indicator showing which sections were filled: "护照 ✓, 个人信息 ✓, 资金 ✗, 旅行信息 ✓"
3. WHEN displaying an incomplete snapshot, THE System SHALL show a notice: "此入境包未完成提交"
4. THE System SHALL allow users to filter history to show only "已提交" vs "未提交" entry packs
5. WHEN viewing an incomplete snapshot, THE System SHALL offer an action: "基于此记录创建新入境包"

### Requirement 22: Reuse Historical Data for New Entry Packs

**User Story:** As a traveler who frequently visits the same destination, I want to reuse data from previous entry packs, so that I don't have to re-enter the same information.

#### Acceptance Criteria

1. WHEN viewing a historical snapshot, THE System SHALL display a button: "基于此记录创建新入境包"
2. WHEN the user taps this button, THE System SHALL copy passport, personal info, and fund items (excluding travel info) to a new entry pack
3. THE System SHALL prompt the user to update travel information: "请更新您的旅行信息（航班、日期、酒店）"
4. THE new entry pack SHALL be marked as "in_progress" and appear on the Home screen
5. THE System SHALL maintain a reference linking the new entry pack to the source snapshot for audit purposes

### Requirement 23: Photo and File Management in Snapshots

**User Story:** As a system managing snapshot data integrity, I want to handle photos and files properly, so that snapshots remain complete even if original files are deleted.

#### Acceptance Criteria

1. WHEN creating a snapshot, THE System SHALL copy all fund item photos to a dedicated snapshot storage directory
2. THE snapshot photo copies SHALL be stored with naming convention: `snapshot_{snapshotId}_{fundItemId}_{timestamp}.jpg`
3. WHEN a snapshot is deleted, THE System SHALL delete all associated photo copies
4. THE System SHALL maintain separate storage quotas: active data vs snapshot data
5. WHEN storage is low, THE System SHALL prompt users to delete old snapshots: "历史记录占用空间较大，建议删除 X 个月前的记录"

### Requirement 24: Completion Trigger from Immigration Guide

**User Story:** As a traveler completing the immigration process, I want to mark my entry pack as completed from the immigration guide, so that the system knows I successfully entered the country.

#### Acceptance Criteria

1. THE InteractiveImmigrationGuide screen SHALL display a "标记为已完成" button on the final step
2. WHEN the user taps "标记为已完成", THE System SHALL show a confirmation dialog: "确认您已成功入境 [目的地]？"
3. WHEN confirmed, THE System SHALL create a snapshot with status "completed" and completion timestamp
4. THE System SHALL display a success message: "入境包已归档到历史记录" with a link to view the snapshot
5. THE System SHALL navigate the user back to the Home screen after completion

### Requirement 25: Offline Snapshot Creation

**User Story:** As a traveler who may not have internet connection when arriving, I want snapshots to be created offline, so that my entry pack is properly archived even without connectivity.

#### Acceptance Criteria

1. THE System SHALL support offline snapshot creation using local storage only
2. WHEN creating a snapshot offline, THE System SHALL queue the snapshot for cloud sync when connection is restored
3. THE System SHALL display a sync status indicator: "本地已保存，等待同步" for offline snapshots
4. WHEN connection is restored, THE System SHALL automatically sync pending snapshots to cloud storage
5. THE System SHALL handle sync conflicts by prioritizing the local snapshot if timestamps match

### Requirement 26: Snapshot Data Privacy and Export

**User Story:** As a user concerned about data privacy, I want control over my snapshot data, so that I can export or permanently delete my travel history.

#### Acceptance Criteria

1. THE Profile settings SHALL include a "历史记录管理" section with options to export or delete all snapshots
2. WHEN the user selects "导出历史记录", THE System SHALL generate a JSON file containing all snapshots
3. THE export file SHALL be encrypted and password-protected if the user enables this option
4. WHEN the user selects "永久删除所有历史记录", THE System SHALL show a warning and require password confirmation
5. THE System SHALL provide a "下载我的数据" option that includes all snapshots, photos, and metadata in a ZIP file

### Requirement 27: Notification Preferences for Archival

**User Story:** As a user managing notifications, I want to control when I receive archival notifications, so that I'm not disturbed unnecessarily.

#### Acceptance Criteria

1. THE Profile settings SHALL include notification preferences for entry pack archival
2. THE System SHALL support notification options: "立即通知", "每日摘要", "关闭通知"
3. WHEN "每日摘要" is selected, THE System SHALL send one notification per day summarizing all archived entry packs
4. THE System SHALL respect device "Do Not Disturb" settings and queue notifications accordingly
5. WHEN notifications are disabled, THE System SHALL still show in-app badges indicating new archived entry packs

### Requirement 28: Snapshot Versioning and Audit Trail

**User Story:** As a system maintaining data integrity, I want to track snapshot versions and changes, so that any modifications or issues can be audited.

#### Acceptance Criteria

1. THE System SHALL assign a version number to each snapshot: v1, v2, etc.
2. WHEN a snapshot is created, THE System SHALL record the app version, device info, and creation method (auto/manual)
3. THE System SHALL maintain an audit log for each snapshot showing: creation time, status changes, view count, and deletion time
4. THE audit log SHALL be immutable and stored separately from the snapshot data
5. THE System SHALL provide a debug mode (developer only) to view complete audit trails for troubleshooting


### Requirement 19: Multiple TDAC Submission Handling

**User Story:** As a traveler who may need to retry TDAC submission, I want the system to track all submission attempts but only show the most recent one, so that I have a clear view of my current status.

#### Acceptance Criteria

1. THE System SHALL maintain a submission history array for each entry pack, storing all TDAC submission attempts
2. WHEN creating a snapshot, THE System SHALL only include the most recent successful TDAC submission in the snapshot
3. WHEN no successful submission exists but failed attempts exist, THE System SHALL include the most recent attempt with failure status
4. THE System SHALL allow users to view submission history (all attempts) from the entry pack detail view before archival
5. WHEN an entry pack is archived, THE snapshot SHALL only preserve the final submission state, not the full submission history

### Requirement 20: GPS-Based Automatic Completion (Future Enhancement)

**User Story:** As a traveler who has arrived at the destination, I want the system to automatically detect my arrival and mark the entry pack as completed, so that I don't need to manually confirm.

#### Acceptance Criteria

1. THE System SHALL request location permissions with clear explanation: "用于自动确认您已抵达目的地"
2. WHEN location permissions are granted AND the user is within 5km of the destination airport, THE System SHALL show a prompt: "检测到您已抵达 [目的地]，是否标记入境包为已完成？"
3. WHEN the user confirms arrival via GPS prompt, THE System SHALL create a snapshot with status "completed" and location metadata
4. THE System SHALL schedule automatic archival 24 hours after GPS-detected arrival
5. THE System SHALL allow users to disable GPS-based detection in Profile settings

### Requirement 21: Fund Photo Storage Strategy

**User Story:** As a system managing fund proof photos, I want a clear storage strategy that balances local storage and future cloud sync, so that photos are preserved appropriately.

#### Acceptance Criteria

1. THE System SHALL store fund proof photos in local device storage at app installation
2. THE snapshot SHALL reference fund photos using local file URIs (e.g., file:///data/funds/photo123.jpg)
3. THE System SHALL maintain photo files even after entry pack archival to support snapshot viewing
4. THE System SHALL display a placeholder image if a referenced photo file is missing or deleted
5. THE System SHALL prepare photo storage structure to support future cloud sync in paid version (but not implement cloud sync in this version)

### Requirement 22: Legacy Data Migration

**User Story:** As a system with existing historical data, I want to handle legacy records gracefully without requiring snapshot migration, so that the transition is smooth.

#### Acceptance Criteria

1. THE System SHALL only create snapshots for newly created entry packs (created after this feature is deployed)
2. WHEN displaying history, THE System SHALL distinguish between legacy records (no snapshot) and new records (with snapshot)
3. WHEN a user views a legacy history record, THE System SHALL display a notice: "这是旧版本的历史记录"
4. THE System SHALL allow legacy records to remain in history without requiring snapshot creation
5. THE System SHALL NOT attempt to create snapshots for existing historical data during migration

### Requirement 23: Notification Preferences

**User Story:** As a user who wants control over notifications, I want to customize which notifications I receive, so that I'm not overwhelmed by alerts.

#### Acceptance Criteria

1. THE Profile settings SHALL include a "通知设置" section with toggles for different notification types
2. THE System SHALL support toggling: "自动归档通知", "72小时提醒", "入境提醒"
3. WHEN a notification type is disabled, THE System SHALL still perform the underlying action (e.g., archival) but not show the notification
4. THE System SHALL save notification preferences to local storage and respect them across app restarts
5. THE System SHALL default all notification types to "enabled" for new users

### Requirement 24: Offline Mode Support

**User Story:** As a traveler who may be offline during travel, I want all entry pack and snapshot features to work without network connectivity, so that I can access my documents anytime.

#### Acceptance Criteria

1. THE System SHALL store all entry pack data and snapshots in local device storage
2. THE System SHALL perform snapshot creation, archival, and status updates without requiring network connectivity
3. THE System SHALL use local scheduled notifications that work offline
4. WHEN the user views history or snapshots offline, THE System SHALL load all data from local storage
5. THE System SHALL display all TDAC QR codes and documents from local storage without network requests


### Requirement 25: Internationalization (i18n) Support

**User Story:** As a traveler who speaks different languages, I want all progressive entry flow features to be available in my preferred language, so that I can understand and use the system comfortably.

#### Acceptance Criteria

1. THE System SHALL support all text strings in the progressive entry flow in multiple languages: Chinese (Simplified), Chinese (Traditional), English, Spanish, French, German
2. THE System SHALL store all UI text strings in the i18n translation files following the existing structure in `app/i18n/translations/`
3. WHEN displaying entry pack status badges, THE System SHALL use localized status text: "completed" → "已完成" (zh), "Completed" (en), "Completado" (es)
4. WHEN displaying snapshot read-only banners, THE System SHALL show localized text: "这是历史记录的快照，无法修改" (zh), "This is a historical snapshot and cannot be modified" (en)
5. THE System SHALL localize all date and time displays according to the user's language preference
6. THE System SHALL localize notification messages in the user's preferred language
7. THE System SHALL provide translation keys for all new UI elements: buttons, labels, error messages, status indicators, and help text

### Requirement 26: Translation Key Structure

**User Story:** As a developer maintaining the i18n system, I want a clear and consistent translation key structure, so that translations are easy to find and update.

#### Acceptance Criteria

1. THE System SHALL organize progressive entry flow translations under the key namespace: `progressiveEntryFlow`
2. THE System SHALL use the following key structure for entry pack statuses: `progressiveEntryFlow.status.completed`, `progressiveEntryFlow.status.cancelled`, `progressiveEntryFlow.status.expired`, `progressiveEntryFlow.status.inProgress`
3. THE System SHALL use the following key structure for snapshot UI: `progressiveEntryFlow.snapshot.readOnlyBanner`, `progressiveEntryFlow.snapshot.viewTitle`, `progressiveEntryFlow.snapshot.legacyBadge`
4. THE System SHALL use the following key structure for history screen: `progressiveEntryFlow.history.title`, `progressiveEntryFlow.history.filterOptions`, `progressiveEntryFlow.history.timeGroups`
5. THE System SHALL use the following key structure for notifications: `progressiveEntryFlow.notifications.autoArchived`, `progressiveEntryFlow.notifications.reminderTitle`
6. THE System SHALL follow the existing i18n pattern used in the codebase for consistency
7. THE System SHALL provide default English translations for all keys with fallback behavior if a translation is missing

### Requirement 27: Localized Status and Time Displays

**User Story:** As a traveler viewing my entry pack history, I want dates, times, and statuses displayed in my language and format, so that information is clear and familiar.

#### Acceptance Criteria

1. THE System SHALL format dates according to locale: "2024-10-20" (en), "2024年10月20日" (zh-CN), "20/10/2024" (es)
2. THE System SHALL format relative time displays: "2 days ago" (en), "2天前" (zh), "hace 2 días" (es)
3. THE System SHALL format time periods: "Today", "Yesterday", "This Week", "This Month", "Earlier" in the user's language
4. THE System SHALL localize arrival countdown displays: "48 hours until arrival" (en), "距离抵达还有48小时" (zh)
5. THE System SHALL localize completion percentage displays: "75% complete" (en), "已完成 75%" (zh)
6. THE System SHALL use locale-appropriate number formatting for amounts and percentages

### Requirement 28: Multi-Language Notification Content

**User Story:** As a traveler receiving notifications, I want notification messages in my preferred language, so that I understand what action is needed.

#### Acceptance Criteria

1. THE System SHALL send automatic archival notifications in the user's preferred language
2. THE System SHALL send 72-hour reminder notifications in the user's preferred language
3. THE System SHALL send arrival reminder notifications in the user's preferred language
4. THE notification title SHALL be localized: "Entry Pack Archived" (en), "入境包已归档" (zh), "Paquete de entrada archivado" (es)
5. THE notification body SHALL be localized with dynamic content: "Your [destination] entry pack has been automatically archived" with proper grammar for each language

### Requirement 29: Translation File Organization

**User Story:** As a developer adding new features, I want translation files organized logically, so that I can easily add and maintain translations.

#### Acceptance Criteria

1. THE System SHALL add progressive entry flow translations to existing country translation files: `countries.zh.json`, `countries.en.json`, `countries.es.json`, etc.
2. THE System SHALL create a new translation namespace `progressiveEntryFlow` at the root level of each translation file
3. THE System SHALL group related translations together: all status translations under `status`, all snapshot translations under `snapshot`, all history translations under `history`
4. THE System SHALL include comments in translation files explaining context for translators: `"_comment": "Status shown when user completes immigration"`
5. THE System SHALL maintain alphabetical ordering of keys within each namespace for easy navigation
6. THE System SHALL validate that all translation files have the same key structure (no missing keys across languages)


### Requirement 30: Immigration Officer View (通关包)

**User Story:** As a traveler at immigration, I want to quickly show all required documents to the officer in their language, so that the inspection process is smooth and efficient.

#### Acceptance Criteria

1. THE System SHALL provide a dedicated "Immigration Officer View" accessible from the InteractiveImmigrationGuide
2. THE Immigration Officer View SHALL display all content in Thai and English (bilingual display)
3. THE Immigration Officer View SHALL prominently display the TDAC QR code at the top with high contrast for easy scanning
4. THE Immigration Officer View SHALL display the TDAC confirmation number (arrCardNo) in large, readable font below the QR code
5. THE Immigration Officer View SHALL include a "Show PDF" button to display the full TDAC PDF document if QR scanning fails
6. THE Immigration Officer View SHALL display passport information: full name (English), passport number, nationality, date of birth, expiry date
7. THE Immigration Officer View SHALL display travel information: arrival flight number, arrival date/time, departure flight number, departure date, accommodation name and address, purpose of visit
8. THE Immigration Officer View SHALL display fund proof summary: total amount by currency, list of fund items with photos (tappable to enlarge)
9. THE Immigration Officer View SHALL display contact information: phone number in Thailand, email address, emergency contact (if provided)
10. THE Immigration Officer View SHALL use a clean, high-contrast layout optimized for quick scanning by officers
11. THE Immigration Officer View SHALL support screen brightness boost for outdoor/bright light conditions
12. THE Immigration Officer View SHALL prevent screen auto-lock while the view is active

### Requirement 31: Bilingual Display Format

**User Story:** As a traveler showing documents to a Thai immigration officer, I want all information displayed in both Thai and English, so that the officer can read it in their preferred language.

#### Acceptance Criteria

1. THE System SHALL display field labels in both Thai and English: "ชื่อเต็ม / Full Name"
2. THE System SHALL display data values in English (as required by TDAC)
3. THE System SHALL use Thai script for section headers: "ข้อมูลหนังสือเดินทาง / Passport Information"
4. THE System SHALL display accommodation addresses in English with Thai translation if available
5. THE System SHALL format dates in international format (YYYY-MM-DD) with Thai month names as secondary: "2024-10-20 (20 ตุลาคม 2024)"
6. THE System SHALL display currency amounts with both symbol and Thai text: "฿10,000 (หนึ่งหมื่นบาท)"

### Requirement 32: Quick Access Actions in Immigration View

**User Story:** As a traveler at immigration, I want quick access to specific documents the officer requests, so that I can respond immediately without fumbling through screens.

#### Acceptance Criteria

1. THE Immigration Officer View SHALL include quick action buttons: "Show QR", "Show PDF", "Show Funds", "Show Hotel", "Show Return Ticket"
2. WHEN the officer requests specific information, THE user SHALL be able to tap the corresponding quick action to jump to that section
3. THE System SHALL support gesture navigation: swipe left/right to move between sections (Passport → Travel → Funds → Contact)
4. THE System SHALL display a floating "Back to QR" button that remains visible while scrolling
5. THE System SHALL allow users to mark frequently requested items as "favorites" for even quicker access

### Requirement 33: Offline Immigration View

**User Story:** As a traveler who may not have internet at immigration, I want the Immigration Officer View to work completely offline, so that I can show my documents regardless of connectivity.

#### Acceptance Criteria

1. THE Immigration Officer View SHALL load all data from local storage without requiring network connectivity
2. THE System SHALL pre-cache the TDAC QR code image for offline display
3. THE System SHALL pre-cache the TDAC PDF document for offline viewing
4. THE System SHALL pre-cache all fund proof photos for offline display
5. THE System SHALL display a subtle "Offline Mode" indicator when no network is available
6. THE System SHALL function identically in offline and online modes

### Requirement 34: Immigration View Content Sections

**User Story:** As a system designer, I want to define the exact content and layout of the Immigration Officer View, so that developers implement it consistently.

#### Acceptance Criteria

1. THE Immigration Officer View SHALL include the following sections in order: QR Code Section, Passport Section, Travel Section, Funds Section, Contact Section
2. THE QR Code Section SHALL display: large QR code (300x300px minimum), TDAC confirmation number, submission date/time, "Show PDF" button
3. THE Passport Section SHALL display: passport photo (if available), full name in English, passport number, nationality, date of birth, passport expiry date, gender
4. THE Travel Section SHALL display: arrival flight number and date/time, departure flight number and date/time, accommodation type and name, accommodation address and phone, purpose of visit, duration of stay
5. THE Funds Section SHALL display: total funds by currency (e.g., "THB 50,000 + USD 1,000"), list of fund items with type, amount, and thumbnail photo, "Tap to enlarge" hint for photos
6. THE Contact Section SHALL display: phone number in Thailand (with country code), email address, emergency contact name and phone (if provided), Thai address (accommodation address repeated)
7. THE System SHALL use visual separators (lines or cards) between sections for clarity
8. THE System SHALL use icons next to section headers for quick visual identification

### Requirement 35: Immigration View Accessibility

**User Story:** As a traveler with visual impairments or in challenging lighting conditions, I want the Immigration Officer View to be highly readable, so that I can show my documents confidently.

#### Acceptance Criteria

1. THE Immigration Officer View SHALL use a minimum font size of 16pt for body text and 20pt for headers
2. THE Immigration Officer View SHALL use high-contrast color scheme: black text on white background
3. THE System SHALL provide a "Boost Brightness" toggle that temporarily increases screen brightness to maximum
4. THE System SHALL provide a "Large Text Mode" toggle that increases all font sizes by 150%
5. THE System SHALL support VoiceOver/TalkBack for accessibility (though typically not used at immigration)
6. THE System SHALL use clear visual hierarchy with bold headers and adequate spacing between sections

### Requirement 36: Immigration View Security

**User Story:** As a traveler concerned about privacy, I want the Immigration Officer View to protect my sensitive information, so that only authorized personnel can see my full details.

#### Acceptance Criteria

1. THE Immigration Officer View SHALL require biometric authentication (Face ID/Touch ID) or PIN before displaying
2. THE System SHALL automatically lock the Immigration Officer View after 2 minutes of inactivity
3. THE System SHALL display a "Lock Screen" button for users to manually lock the view
4. THE System SHALL blur sensitive information (passport number, phone number) until the user taps "Show Full Details"
5. THE System SHALL log access to the Immigration Officer View with timestamp for security audit
6. THE System SHALL NOT allow screenshots of the Immigration Officer View (platform permitting)

### Requirement 37: Immigration View Language Toggle

**User Story:** As a traveler who may encounter officers who prefer English over Thai, I want to quickly toggle the display language, so that I can accommodate their preference.

#### Acceptance Criteria

1. THE Immigration Officer View SHALL display a language toggle button in the header: "TH/EN" or "EN/TH"
2. WHEN the user taps the language toggle, THE System SHALL switch between three modes: "Bilingual" (default), "Thai Only", "English Only"
3. THE System SHALL remember the last selected language mode for future Immigration View sessions
4. THE System SHALL animate the language transition smoothly without jarring layout shifts
5. THE System SHALL maintain the same content structure regardless of language mode


### Requirement 30: Immigration Officer Presentation Mode

**User Story:** As a traveler who doesn't speak the destination country's language, I want to show my entry pack to immigration officers in their language, so that they can easily understand my information without language barriers.

#### Acceptance Criteria

1. THE System SHALL provide a "Show to Officer" button on the entry pack result screen
2. WHEN the user taps "Show to Officer", THE System SHALL switch to a full-screen presentation mode optimized for showing to immigration officers
3. THE System SHALL automatically display all entry pack information in the destination country's official language (Thai for Thailand, English for Singapore, etc.)
4. THE presentation mode SHALL use large, clear fonts optimized for reading at arm's length
5. THE System SHALL display information in a structured format that immigration officers expect to see
6. THE System SHALL include a prominent "Exit Presentation Mode" button that returns to normal view
7. THE System SHALL keep the screen awake (prevent auto-lock) while in presentation mode

### Requirement 31: Destination-Specific Language Mapping

**User Story:** As a system displaying entry packs to immigration officers, I want to automatically select the appropriate language for each destination, so that officers see information in their working language.

#### Acceptance Criteria

1. THE System SHALL map each destination to its official immigration language: Thailand → Thai + English, Japan → Japanese + English, Singapore → English, Malaysia → English + Malay, Taiwan → Traditional Chinese, Hong Kong → Traditional Chinese + English
2. WHEN displaying to immigration officers, THE System SHALL prioritize the primary official language of the destination
3. THE System SHALL provide a language toggle button in presentation mode to switch between available languages (e.g., Thai ↔ English for Thailand)
4. THE System SHALL remember the user's language preference for presentation mode per destination
5. THE System SHALL fall back to English if the destination's official language translation is not available

### Requirement 32: Presentation Mode UI Design

**User Story:** As a traveler showing my entry pack to an immigration officer, I want the presentation to be clear and professional, so that the officer can quickly verify my information.

#### Acceptance Criteria

1. THE presentation mode SHALL use a clean, high-contrast design with white background and dark text
2. THE System SHALL display information in logical sections: Passport Information, Travel Details, Accommodation, Funds Proof, TDAC Confirmation
3. THE System SHALL show QR codes and barcodes at a size optimized for scanning (minimum 200x200 pixels)
4. THE System SHALL display photos (passport photo, fund proofs) at appropriate sizes for visual verification
5. THE System SHALL hide UI chrome (navigation bars, status bars) to maximize content display area
6. THE System SHALL provide quick access buttons: "Show QR Code", "Show Passport", "Show Funds", "Show Accommodation"
7. THE System SHALL display a subtle "Swipe to exit" hint at the bottom of the screen

### Requirement 33: Offline Presentation Support

**User Story:** As a traveler at immigration without internet connectivity, I want presentation mode to work offline, so that I can show my documents regardless of network availability.

#### Acceptance Criteria

1. THE presentation mode SHALL load all data from local storage without requiring network connectivity
2. THE System SHALL pre-cache all necessary translations for presentation mode when the entry pack is created
3. THE System SHALL display all images (QR codes, photos, documents) from local storage
4. THE System SHALL show a "Fully Offline" indicator in presentation mode to assure users
5. THE System SHALL gracefully handle missing translations by falling back to English

### Requirement 34: Quick Action Buttons in Presentation Mode

**User Story:** As a traveler interacting with an immigration officer, I want quick access to specific documents they request, so that I can respond promptly without fumbling through screens.

#### Acceptance Criteria

1. THE presentation mode SHALL provide a bottom action bar with quick access buttons
2. THE System SHALL include buttons for: "QR Code", "Passport", "Funds", "Hotel", "Return Ticket"
3. WHEN the user taps a quick action button, THE System SHALL immediately display that specific information in full screen
4. THE System SHALL provide a "Back to Summary" button to return to the main presentation view
5. THE System SHALL support swipe gestures to navigate between sections (swipe left/right)

### Requirement 35: Presentation Mode Accessibility

**User Story:** As a traveler with accessibility needs, I want presentation mode to support accessibility features, so that I can use it comfortably.

#### Acceptance Criteria

1. THE presentation mode SHALL support pinch-to-zoom for users with vision impairments
2. THE System SHALL maintain zoom level when switching between sections
3. THE System SHALL support VoiceOver/TalkBack for screen reader users (though typically disabled when showing to officers)
4. THE System SHALL provide high-contrast mode option for better visibility in bright sunlight
5. THE System SHALL allow users to adjust text size in presentation mode settings

### Requirement 36: No Direct Call/Contact Features

**User Story:** As a system designer prioritizing user safety, I want to avoid direct calling features that could lead to scams or unwanted charges, so that users are protected from potential fraud.

#### Acceptance Criteria

1. THE System SHALL NOT provide "Call Hotel" or "Call Contact" buttons that directly initiate phone calls
2. THE System SHALL display phone numbers as text that users can manually dial if needed
3. THE System SHALL provide a "Copy Phone Number" button that copies the number to clipboard
4. THE System SHALL display a warning if users try to copy international numbers: "Remember to add country code when dialing"
5. THE System SHALL NOT integrate with device dialer or messaging apps automatically
6. THE System SHALL allow users to view contact information but require manual action to initiate communication

### Requirement 37: Presentation Mode Translation Quality

**User Story:** As a traveler showing information to immigration officers, I want translations to be accurate and use official terminology, so that officers understand the information correctly.

#### Acceptance Criteria

1. THE System SHALL use official immigration terminology for each destination (e.g., "วีซ่า" for visa in Thai, not colloquial terms)
2. THE System SHALL translate field labels using terms that immigration officers expect to see
3. THE System SHALL maintain consistency with official government forms and documents
4. THE System SHALL provide context-appropriate translations (formal language for official documents)
5. THE System SHALL include a disclaimer in presentation mode: "This is a traveler-prepared document. Please verify with official systems."
