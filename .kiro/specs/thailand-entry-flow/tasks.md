# Implementation Plan

- [ ] 1. Create core validation and utility services
- [ ] 1.1 Implement ThailandDataValidator service
  - Create validation logic for passport, personal info, travel info, and fund data
  - Implement field counting and completion status calculation
  - Add Thailand-specific validation rules and error messages
  - _Requirements: 1.2, 2.2, 2.3, 2.4_

- [ ] 1.2 Implement ArrivalWindowCalculator utility
  - Create 72-hour window calculation logic
  - Implement status messaging for different time scenarios
  - Add timezone handling and countdown functionality
  - _Requirements: 3.2, 3.3, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 1.3 Implement ThailandTravelerContextBuilder service
  - Create function to merge PassportDataService data with TDAC defaults
  - Implement buildThailandTravelerContext function
  - Add payload validation and error handling
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 2. Create TDAC submission metadata management
- [ ] 2.1 Implement TDACSubmissionService
  - Create submission metadata storage and retrieval functions
  - Implement duplicate detection and prevention logic
  - Add submission history tracking and status management
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 2.2 Extend TravelInfo model for TDAC tracking
  - Add TDAC submission metadata fields to TravelInfo model
  - Update PassportDataService to handle TDAC metadata persistence
  - Implement migration logic for existing travel info records
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 3. Implement ThailandEntryFlowScreen component
- [ ] 3.1 Create ThailandEntryFlowScreen component structure
  - Set up React Native screen with navigation and state management
  - Implement data loading from PassportDataService
  - Create component lifecycle and refresh handling
  - _Requirements: 2.1, 2.5, 8.2_

- [ ] 3.2 Implement data validation and status display
  - Create four category tiles with completion indicators
  - Implement real-time validation status updates
  - Add navigation back to editing screens when tiles are tapped
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3.3 Implement arrival window display and messaging
  - Add arrival window calculation and status display
  - Implement dynamic messaging based on time remaining
  - Create countdown display for submissions within 24 hours
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 3.4 Implement digital submission CTA with timing enforcement
  - Create primary "自动提交 TDAC" button with enable/disable logic
  - Implement traveler payload building and navigation to TDACSelectionScreen
  - Add loading states and error handling for submission preparation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3.5 Implement manual fallback options
  - Create secondary action buttons for manual and WebView options
  - Implement navigation to TDACGuideScreen and TDACWebViewScreen
  - Ensure fallback options are always available regardless of timing
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 3.6 Implement submission status display and entry pack access
  - Add display of existing TDAC submission status and QR code thumbnail
  - Implement "查看入境包" CTA with navigation to ResultScreen
  - Create post-submission status updates and error recovery options
  - _Requirements: 8.1, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 4. Update ThailandTravelInfoScreen integration
- [ ] 4.1 Implement preflight validation in handleContinue
  - Update handleContinue to call saveDataToSecureStorage before navigation
  - Add comprehensive data validation with in-place error display
  - Implement blocking error handling for missing or invalid data
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 4.2 Add navigation to ThailandEntryFlowScreen
  - Update navigation logic to route to ThailandEntryFlowScreen after validation
  - Pass userId and refresh parameters for proper data loading
  - Ensure graceful error handling if navigation fails
  - _Requirements: 1.5_

- [ ] 5. Enhance existing screens for Thailand flow integration
- [ ] 5.1 Update TDACHybridScreen for return navigation
  - Modify success/failure navigation to return to ThailandEntryFlowScreen
  - Pass submission results and metadata for status updates
  - Implement refresh parameter handling for status updates
  - _Requirements: 8.1, 8.2, 8.5_

- [ ] 5.2 Update ResultScreen for Thailand entry pack display
  - Enhance ResultScreen to handle Thailand-specific context and metadata
  - Add "落地流程" button navigation to InteractiveImmigrationGuide
  - Implement preloaded data display for QR codes and submission confirmations
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 6. Add navigation routing and screen registration
- [ ] 6.1 Register ThailandEntryFlowScreen in navigation stack
  - Add screen registration to React Navigation configuration
  - Set up proper navigation options and header configuration
  - Ensure screen is accessible from ThailandTravelInfoScreen
  - _Requirements: 1.5, 2.1_

- [ ] 6.2 Update navigation flow between screens
  - Implement proper navigation parameters passing between screens
  - Add back navigation handling and state preservation
  - Ensure navigation stack management for complex flows
  - _Requirements: 8.1, 8.2, 8.5_

- [ ] 7. Add comprehensive error handling and user feedback
- [ ] 7.1 Implement error boundary components
  - Create error boundaries for ThailandEntryFlowScreen
  - Add graceful error handling for service failures
  - Implement user-friendly error messages and recovery options
  - _Requirements: 1.3, 1.4, 8.5_

- [ ] 7.2 Add loading states and progress indicators
  - Implement loading spinners for data validation and submission
  - Add progress indicators for multi-step operations
  - Create skeleton screens for data loading states
  - _Requirements: 3.4, 8.1_

- [ ] 8. Add localization support
- [ ] 8.1 Create translation keys for Thailand flow
  - Add Chinese, English, and other language translations
  - Implement dynamic text for countdown and status messages
  - Create localized error messages and user guidance
  - _Requirements: 6.2, 6.3, 6.4_

- [ ] 8.2 Implement locale-aware date and time formatting
  - Add proper date formatting for arrival window calculations
  - Implement timezone-aware time displays
  - Create locale-specific number and currency formatting
  - _Requirements: 6.1, 6.5_

- [ ] 9. Performance optimization and caching
- [ ] 9.1 Implement data caching for validation results
  - Add caching layer for validation results to improve performance
  - Implement cache invalidation when data changes
  - Create memory management for large datasets
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 9.2 Optimize screen transition performance
  - Implement lazy loading for heavy components
  - Add transition animations and smooth navigation
  - Optimize re-renders and state updates
  - _Requirements: 1.5, 8.2_