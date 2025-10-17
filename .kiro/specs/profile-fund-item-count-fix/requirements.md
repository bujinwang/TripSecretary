# Requirements Document

## Introduction

This feature fixes an incorrect fund item count display in the ProfileScreen. Currently, the funding section header shows "1/1" when there are actually 3 fund items displayed in the list. The count badge should accurately reflect the actual number of fund items the user has added.

## Glossary

- **ProfileScreen**: The main user profile interface where users manage their passport, personal information, and fund items
- **FundItem**: A financial proof record (cash, bank card, document, etc.) stored in the centralized database
- **Funding Section**: The collapsible section in ProfileScreen that displays the user's fund items list
- **Count Badge**: The visual indicator showing "filled/total" in the section header

## Requirements

### Requirement 1: Display Accurate Fund Item Count

**User Story:** As a user, I want to see the correct count of my fund items in the funding section header, so that I know exactly how many items I have added.

#### Acceptance Criteria

1. WHEN the user has fund items, THE ProfileScreen SHALL display the count badge as "{actual_count}/{actual_count}"
2. WHEN the user has 0 fund items, THE ProfileScreen SHALL display the count badge as "0/0"
3. WHEN the user has 1 fund item, THE ProfileScreen SHALL display the count badge as "1/1"
4. WHEN the user has 3 fund items, THE ProfileScreen SHALL display the count badge as "3/3"
5. WHEN the user adds a new fund item, THE count badge SHALL update immediately to reflect the new total
