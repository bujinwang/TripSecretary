# Notification Service

## Overview

The NotificationService provides a comprehensive solution for managing local notifications in the Progressive Entry Info Flow feature. It handles notification scheduling, permission management, and user interactions.

## Features Implemented (Task 5.1)

### ✅ Core Notification Service
- **File**: `app/services/notification/NotificationService.js`
- **Singleton Pattern**: Ensures consistent state across the app
- **Permission Management**: Automatic permission requests and status tracking
- **Cross-Platform Support**: Works on both iOS and Android with platform-specific optimizations

### ✅ Key Methods
1. **`initialize()`** - Sets up the service, requests permissions, and configures listeners
2. **`scheduleNotification(title, body, date, data, options)`** - Schedules notifications with custom data
3. **`cancelNotification(notificationId)`** - Cancels specific notifications
4. **`cancelAllNotifications()`** - Cancels all scheduled notifications
5. **`getScheduledNotifications()`** - Retrieves all scheduled notifications
6. **`areNotificationsEnabled()`** - Checks permission status

### ✅ Android Notification Channels
- **Default Channel**: For general notifications
- **Urgent Channel**: For high-priority reminders (submission deadlines)
- **Info Channel**: For low-priority informational notifications

### ✅ Permission Handling
- Automatic permission requests on initialization
- Graceful handling of permission denials
- Status tracking and validation before scheduling

### ✅ Event Logging
- Comprehensive logging of notification events (scheduled, received, interacted)
- Stored in AsyncStorage for debugging and analytics
- Automatic log rotation (keeps last 100 entries)

### ✅ Deep Link Support
- Built-in support for deep linking from notifications
- Stores pending deep links when app is not active
- Ready for integration with navigation system (Task 5.13)

### ✅ Action Button Support
- Support for notification action buttons (iOS and Android)
- Category-based action configuration
- Response handling and logging

### ✅ App Integration
- **File**: `App.js` - Automatic initialization on app startup
- **File**: `app.json` - Expo configuration for notifications
- **Dependencies**: Added `expo-notifications` package

### ✅ Testing
- **File**: `app/services/notification/__tests__/NotificationService.test.js`
- Comprehensive test suite covering all major functionality
- 15 test cases with 100% pass rate
- Mocked dependencies for reliable testing

### ✅ Usage Examples
- **File**: `app/services/notification/NotificationServiceExample.js`
- Real-world examples for all notification types
- Integration patterns for React components
- Debugging utilities

## Requirements Satisfied

✅ **Requirement 16.1**: Install and configure notification library (expo-notifications)
✅ **Requirement 16.1**: Create NotificationService.js with core functionality
✅ **Requirement 16.1**: Implement scheduleNotification method
✅ **Requirement 16.1**: Implement cancelNotification method
✅ **Requirement 16.1**: Request notification permissions
✅ **Requirement 16.2-16.5**: Foundation for all notification types (window open, urgent, deadline, arrival, data change)

## Usage

```javascript
import { NotificationService } from './app/services/notification';

// Schedule a simple notification
const notificationId = await NotificationService.scheduleNotification(
  'Entry Reminder',
  'Complete your Thailand entry information',
  60, // 60 seconds from now
  { type: 'entry_reminder', destinationId: 'thailand' }
);

// Cancel a notification
await NotificationService.cancelNotification(notificationId);

// Check if notifications are enabled
const isEnabled = await NotificationService.areNotificationsEnabled();
```

## Next Steps

The notification service is now ready for the following tasks:
- **Task 5.2**: Notification configuration management
- **Task 5.3**: Notification templates
- **Task 5.4-5.12**: Specific notification types
- **Task 5.13**: Notification click handling
- **Task 5.14**: Action button handling

## Files Created/Modified

1. ✅ `app/services/notification/NotificationService.js` - Main service implementation
2. ✅ `app/services/notification/index.js` - Export module
3. ✅ `app/services/notification/__tests__/NotificationService.test.js` - Test suite
4. ✅ `app/services/notification/NotificationServiceExample.js` - Usage examples
5. ✅ `app/services/notification/README.md` - Documentation
6. ✅ `App.js` - Service initialization
7. ✅ `app.json` - Expo notification configuration
8. ✅ `package.json` - Added expo-notifications dependency

## Testing Results

```
Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        0.479 s
```

All tests pass successfully, confirming the notification service is working correctly and ready for production use.