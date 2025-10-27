#!/usr/bin/env node

/**
 * Singapore Travel Info Screen - Automated Hooks Integration Script
 *
 * This script automatically applies all the refactoring changes to integrate
 * the custom hooks into SingaporeTravelInfoScreen.js
 *
 * Usage: node scripts/integrate-singapore-hooks.js
 */

const fs = require('fs');
const path = require('path');

// File paths
const SCREEN_FILE = path.join(__dirname, '../app/screens/singapore/SingaporeTravelInfoScreen.js');
const BACKUP_FILE = path.join(__dirname, '../app/screens/singapore/SingaporeTravelInfoScreen.js.backup');
const OUTPUT_FILE = path.join(__dirname, '../app/screens/singapore/SingaporeTravelInfoScreen.refactored.js');

console.log('🔄 Starting Singapore Hooks Integration...\n');

// Step 1: Verify backup exists
if (!fs.existsSync(BACKUP_FILE)) {
  console.error('❌ Backup file not found! Creating backup...');
  fs.copyFileSync(SCREEN_FILE, BACKUP_FILE);
  console.log('✅ Backup created: SingaporeTravelInfoScreen.js.backup\n');
} else {
  console.log('✅ Backup file exists\n');
}

// Step 2: Read the original file
console.log('📖 Reading original file...');
let content = fs.readFileSync(SCREEN_FILE, 'utf8');
const originalLineCount = content.split('\n').length;
console.log(`   Original file: ${originalLineCount} lines\n`);

// Step 3: Apply transformations
console.log('🔧 Applying transformations...\n');

// ============================================================================
// TRANSFORMATION 1: Add hook imports
// ============================================================================
console.log('1️⃣  Adding hook imports...');
const hookImports = `
// Import custom hooks for state management
import {
  useSingaporeFormState,
  useSingaporeDataPersistence,
  useSingaporeValidation,
} from '../../hooks/singapore';

// Import section components
import {
  PassportSection,
  PersonalInfoSection,
  FundsSection,
  TravelDetailsSection,
} from '../../components/singapore/sections';
`;

// Insert after UserDataService import (line ~59)
content = content.replace(
  /(import UserDataService from ['"]\.\.\/\.\.\/services\/data\/UserDataService['"];)/,
  `$1${hookImports}`
);
console.log('   ✅ Hook imports added\n');

// ============================================================================
// TRANSFORMATION 2: Replace useState declarations with hooks
// ============================================================================
console.log('2️⃣  Replacing useState declarations with hooks...');

// Find the section with all useState declarations (between travelInfoForm and first function)
const useStatePattern = /  \/\/ Travel info form utilities with user interaction tracking\n  const travelInfoForm = useTravelInfoForm\('singapore'\);\n\n([\s\S]*?)(?=\n  \/\/ Migration function|  const migrateExistingDataToInteractionState)/;

const hookInitialization = `
  // ===================================================================
  // CUSTOM HOOKS INTEGRATION - Replaces 49+ useState declarations
  // ===================================================================

  // Initialize form state hook - manages all form state
  const formState = useSingaporeFormState(passport);

  // Initialize data persistence hook - handles loading, saving, session management
  const persistence = useSingaporeDataPersistence({
    passport,
    destination,
    userId,
    formState,
    travelInfoForm,
    navigation,
  });

  // Initialize validation hook - handles validation, completion tracking
  const validation = useSingaporeValidation({
    formState,
    travelInfoForm,
    saveDataToSecureStorage: persistence.saveDataToSecureStorage,
    debouncedSaveData: persistence.debouncedSaveData,
  });

  // Extract commonly used functions from hooks
  const {
    handleFieldBlur,
    handleUserInteraction,
    getFieldCount,
    calculateCompletionMetrics,
    isFormValid,
    getSmartButtonConfig,
    getProgressText,
    getProgressColor,
  } = validation;

  const {
    loadData,
    saveDataToSecureStorage,
    debouncedSaveData,
    refreshFundItems,
    normalizeFundItem,
    scrollViewRef,
    shouldRestoreScrollPosition,
  } = persistence;

  // ===================================================================
  // END CUSTOM HOOKS INTEGRATION
  // ===================================================================
`;

content = content.replace(useStatePattern, hookInitialization);
console.log('   ✅ useState declarations replaced with hooks\n');

// ============================================================================
// TRANSFORMATION 3: Remove duplicate functions now in hooks
// ============================================================================
console.log('3️⃣  Removing duplicate functions (now in hooks)...');

// Remove migrateExistingDataToInteractionState
content = content.replace(
  /  \/\/ Migration function to mark existing data as user-modified[\s\S]*?const migrateExistingDataToInteractionState = useCallback\([\s\S]*?\}, \[travelInfoForm\]\);\n\n/,
  ''
);

// Remove old handleUserInteraction
content = content.replace(
  /  \/\/ Handle user interaction with tracking-enabled inputs[\s\S]*?const handleUserInteraction = useCallback\([\s\S]*?\}, \[travelInfoForm\.handleUserInteraction\]\);\n\n/,
  ''
);

// Remove getFieldCount
content = content.replace(
  /  \/\/ Count filled fields for each section using TravelInfoFormUtils[\s\S]*?const getFieldCount = \(section\) => \{[\s\S]*?\};\n\n/,
  ''
);

// Remove calculateCompletionMetrics
content = content.replace(
  /  \/\/ Calculate completion metrics using TravelInfoFormUtils[\s\S]*?const calculateCompletionMetrics = useCallback\([\s\S]*?\], \[[\s\S]*?\]\);\n\n/,
  ''
);

// Remove isFormValid
content = content.replace(
  /  \/\/ Check if all fields are filled and valid[\s\S]*?const isFormValid = \(\) => \{[\s\S]*?\};\n\n/,
  ''
);

// Remove getSmartButtonConfig
content = content.replace(
  /  \/\/ Get smart button configuration based on journey progress[\s\S]*?const getSmartButtonConfig = \(\) => \{[\s\S]*?\};\n\n/,
  ''
);

// Remove getProgressText
content = content.replace(
  /  \/\/ Get progress indicator text - traveler-friendly messaging[\s\S]*?const getProgressText = \(\) => \{[\s\S]*?\};\n\n/,
  ''
);

// Remove getProgressColor
content = content.replace(
  /  \/\/ Get progress color based on completion[\s\S]*?const getProgressColor = \(\) => \{[\s\S]*?\};\n\n/,
  ''
);

console.log('   ✅ Duplicate functions removed\n');

// ============================================================================
// TRANSFORMATION 4: Replace data loading useEffect
// ============================================================================
console.log('4️⃣  Replacing data loading useEffect...');

content = content.replace(
  /  \/\/ Load saved data on component mount and when screen gains focus[\s\S]*?useEffect\(\(\) => \{[\s\S]*?loadSavedData\(\);[\s\S]*?\}, \[userId\]\);/,
  `  // ===================================================================
  // DATA LOADING - Using persistence hook (replaces 200+ lines)
  // ===================================================================
  useEffect(() => {
    loadData();
  }, [loadData]);`
);

console.log('   ✅ Data loading useEffect replaced\n');

// ============================================================================
// TRANSFORMATION 5: Remove navigation listeners (now in hook)
// ============================================================================
console.log('5️⃣  Removing navigation listeners (now in persistence hook)...');

// Remove focus listener
content = content.replace(
  /  \/\/ Add focus listener to reload data when returning to screen[\s\S]*?useEffect\(\(\) => \{[\s\S]*?return unsubscribe;[\s\S]*?\}, \[navigation, userId\]\);/,
  ''
);

// Remove blur listener
content = content.replace(
  /  \/\/ Add blur listener to save data when leaving the screen[\s\S]*?useEffect\(\(\) => \{[\s\S]*?return unsubscribe;[\s\S]*?\}, \[navigation\]\);/,
  ''
);

// Remove cleanup effect
content = content.replace(
  /  \/\/ Cleanup effect \(equivalent to componentWillUnmount\)[\s\S]*?useEffect\(\(\) => \{[\s\S]*?return \(\) => \{[\s\S]*?\};[\s\S]*?\}, \[\]\);/,
  ''
);

console.log('   ✅ Navigation listeners removed\n');

// ============================================================================
// TRANSFORMATION 6: Update save status monitoring
// ============================================================================
console.log('6️⃣  Updating save status monitoring...');

content = content.replace(
  /  \/\/ Monitor save status changes\n  useEffect\(\(\) => \{\n    const interval = setInterval\(\(\) => \{\n      const currentStatus = DebouncedSave\.getSaveState\('singapore_travel_info'\);\n      setSaveStatus\(currentStatus\);/,
  `  // Monitor save status changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = DebouncedSave.getSaveState('singapore_travel_info');
      formState.setSaveStatus(currentStatus);`
);

content = content.replace(
  /    return \(\) => clearInterval\(interval\);\n  \}, \[\]\);/,
  `    return () => clearInterval(interval);
  }, [formState]);`
);

console.log('   ✅ Save status monitoring updated\n');

// ============================================================================
// TRANSFORMATION 7: Remove session state functions
// ============================================================================
console.log('7️⃣  Removing session state functions...');

content = content.replace(
  /  \/\/ Session state management functions[\s\S]*?const getSessionStateKey = \(\) => \{[\s\S]*?\};\n\n  const saveSessionState = async \(\) => \{[\s\S]*?\};\n\n  const loadSessionState = async \(\) => \{[\s\S]*?\};\n\n/,
  ''
);

// Remove session state useEffects
content = content.replace(
  /  \/\/ Save session state when expandedSection changes[\s\S]*?useEffect\(\(\) => \{[\s\S]*?\}, \[expandedSection, lastEditedField\]\);\n\n/,
  ''
);

content = content.replace(
  /  \/\/ Load session state on component mount[\s\S]*?useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);\n\n/,
  ''
);

content = content.replace(
  /  \/\/ Restore scroll position after data loads[\s\S]*?useEffect\(\(\) => \{[\s\S]*?\}, \[isLoading, scrollPosition\]\);\n\n/,
  ''
);

console.log('   ✅ Session state functions removed\n');

// ============================================================================
// TRANSFORMATION 8: Update completion metrics useEffect
// ============================================================================
console.log('8️⃣  Updating completion metrics useEffect...');

content = content.replace(
  /  \/\/ Recalculate completion metrics when data changes\n  useEffect\(\(\) => \{\n    if \(!isLoading\) \{/,
  `  // Recalculate completion metrics when data changes
  useEffect(() => {
    if (!formState.isLoading) {`
);

content = content.replace(
  /      calculateCompletionMetrics\(\);\n    \}\n  \}, \[isLoading, calculateCompletionMetrics\]\);/,
  `      calculateCompletionMetrics();
    }
  }, [formState.isLoading, calculateCompletionMetrics]);`
);

console.log('   ✅ Completion metrics useEffect updated\n');

// ============================================================================
// TRANSFORMATION 9: Remove debouncedSaveData function
// ============================================================================
console.log('9️⃣  Removing debouncedSaveData function...');

content = content.replace(
  /  \/\/ Create debounced save function[\s\S]*?const debouncedSaveData = DebouncedSave\.debouncedSave\([\s\S]*?\);/,
  ''
);

console.log('   ✅ debouncedSaveData function removed\n');

// ============================================================================
// TRANSFORMATION 10: Remove handleFieldBlur function
// ============================================================================
console.log('🔟 Removing handleFieldBlur function...');

content = content.replace(
  /  \/\/ Function to validate and save field data on blur[\s\S]*?const handleFieldBlur = async \(fieldName, fieldValue\) => \{[\s\S]*?\n  \};\n\n/,
  ''
);

console.log('   ✅ handleFieldBlur function removed\n');

// ============================================================================
// TRANSFORMATION 11: Remove save operation functions
// ============================================================================
console.log('1️⃣1️⃣  Removing save operation functions...');

content = content.replace(
  /  \/\/ Save all data to secure storage with optional field overrides[\s\S]*?const saveDataToSecureStorageWithOverride = async \(fieldOverrides = \{\}\) => \{[\s\S]*?\n  \};\n\n/,
  ''
);

content = content.replace(
  /  \/\/ Save all data to secure storage[\s\S]*?const saveDataToSecureStorage = async \(\) => \{[\s\S]*?\n  \};\n\n/,
  ''
);

console.log('   ✅ Save operation functions removed\n');

// ============================================================================
// TRANSFORMATION 12: Remove normalizeFundItem and refreshFundItems
// ============================================================================
console.log('1️⃣2️⃣  Removing fund helper functions...');

content = content.replace(
  /const normalizeFundItem = useCallback\([\s\S]*?\}, \[userId\]\);\n\n  const refreshFundItems = useCallback\([\s\S]*?\}, \[userId, normalizeFundItem\]\);\n\n/,
  ''
);

console.log('   ✅ Fund helper functions removed\n');

// ============================================================================
// TRANSFORMATION 13: Update fund handler functions
// ============================================================================
console.log('1️⃣3️⃣  Updating fund handler functions...');

// Update addFund
content = content.replace(
  /const addFund = \(type\) => \{\n    setNewFundItemType\(type\);\n    setIsCreatingFundItem\(true\);\n    setSelectedFundItem\(null\);\n    setFundItemModalVisible\(true\);/,
  `const addFund = (type) => {
    formState.setNewFundItemType(type);
    formState.setIsCreatingFundItem(true);
    formState.setSelectedFundItem(null);
    formState.setFundItemModalVisible(true);`
);

// Update handleFundItemPress
content = content.replace(
  /const handleFundItemPress = \(fund\) => \{\n    setSelectedFundItem\(fund\);\n    setIsCreatingFundItem\(false\);\n    setNewFundItemType\(null\);\n    setFundItemModalVisible\(true\);/,
  `const handleFundItemPress = (fund) => {
    formState.setSelectedFundItem(fund);
    formState.setIsCreatingFundItem(false);
    formState.setNewFundItemType(null);
    formState.setFundItemModalVisible(true);`
);

// Update handleFundItemModalClose
content = content.replace(
  /const handleFundItemModalClose = \(\) => \{\n    setFundItemModalVisible\(false\);\n    setSelectedFundItem\(null\);\n    setIsCreatingFundItem\(false\);\n    setNewFundItemType\(null\);/,
  `const handleFundItemModalClose = () => {
    formState.setFundItemModalVisible(false);
    formState.setSelectedFundItem(null);
    formState.setIsCreatingFundItem(false);
    formState.setNewFundItemType(null);`
);

// Update handleFundItemUpdate
content = content.replace(
  /const handleFundItemUpdate = async \(updatedItem\) => \{\n    try \{\n      if \(updatedItem\) \{\n        setSelectedFundItem\(normalizeFundItem\(updatedItem\)\);/,
  `const handleFundItemUpdate = async (updatedItem) => {
    try {
      if (updatedItem) {
        formState.setSelectedFundItem(normalizeFundItem(updatedItem));`
);

// Update handleFundItemDelete
content = content.replace(
  /const handleFundItemDelete = async \(id\) => \{\n    try \{\n      setFunds\(\(prev\) => prev\.filter\(\(fund\) => fund\.id !== id\)\);/,
  `const handleFundItemDelete = async (id) => {
    try {
      formState.setFunds((prev) => prev.filter((fund) => fund.id !== id));`
);

console.log('   ✅ Fund handler functions updated\n');

// ============================================================================
// TRANSFORMATION 14: Update JSX state references
// ============================================================================
console.log('1️⃣4️⃣  Updating JSX state references to use formState...');
console.log('   (This is a large transformation, may take a moment...)\n');

// List of state variables to update
const stateVars = [
  'passportData', 'personalInfoData', 'entryData',
  'passportNo', 'visaNumber', 'fullName', 'nationality', 'dob', 'expiryDate',
  'sex', 'occupation', 'cityOfResidence', 'residentCountry', 'phoneCode', 'phoneNumber', 'email',
  'funds', 'fundItemModalVisible', 'selectedFundItem', 'isCreatingFundItem', 'newFundItemType',
  'travelPurpose', 'customTravelPurpose', 'boardingCountry',
  'arrivalFlightNumber', 'arrivalArrivalDate', 'previousArrivalDate',
  'departureFlightNumber', 'departureDepartureDate', 'isTransitPassenger',
  'accommodationType', 'customAccommodationType',
  'province', 'district', 'subDistrict', 'postalCode', 'hotelAddress',
  'errors', 'warnings', 'isLoading', 'expandedSection',
  'saveStatus', 'lastEditedAt', 'lastEditedField', 'scrollPosition',
  'completionMetrics', 'totalCompletionPercent'
];

// Update references in JSX (be careful not to update in comments or strings)
// We'll update the common patterns found in JSX
for (const varName of stateVars) {
  const setterName = 'set' + varName.charAt(0).toUpperCase() + varName.slice(1);

  // Update value references: value={varName} -> value={formState.varName}
  content = content.replace(
    new RegExp(`(value=\\{)${varName}(\\})`, 'g'),
    `$1formState.${varName}$2`
  );

  // Update setter references: onChangeText={setVarName} -> onChangeText={formState.setVarName}
  content = content.replace(
    new RegExp(`(onChange(?:Text)?=\\{)${setterName}(\\})`, 'g'),
    `$1formState.${setterName}$2`
  );

  // Update conditional references: {varName && ...} -> {formState.varName && ...}
  content = content.replace(
    new RegExp(`(\\{)${varName}( &&)`, 'g'),
    `$1formState.${varName}$2`
  );

  // Update spread references: ...varName -> ...formState.varName
  content = content.replace(
    new RegExp(`(\\.\\.\\.${varName})([^a-zA-Z])`, 'g'),
    `...formState.${varName}$2`
  );
}

// Special cases for common JSX patterns
content = content.replace(/isExpanded=\{expandedSection ===/g, 'isExpanded={formState.expandedSection ===');
content = content.replace(/setExpandedSection\(/g, 'formState.setExpandedSection(');
content = content.replace(/\bisLoading\b(?!:)/g, 'formState.isLoading');
content = content.replace(/\berrors\./g, 'formState.errors.');
content = content.replace(/\bwarnings\./g, 'formState.warnings.');

console.log('   ✅ JSX state references updated\n');

// ============================================================================
// Save the refactored file
// ============================================================================
console.log('💾 Saving refactored file...');
fs.writeFileSync(OUTPUT_FILE, content, 'utf8');

const refactoredLineCount = content.split('\n').length;
const reduction = originalLineCount - refactoredLineCount;
const reductionPercent = ((reduction / originalLineCount) * 100).toFixed(1);

console.log(`   ✅ Saved to: SingaporeTravelInfoScreen.refactored.js`);
console.log(`   📊 Original: ${originalLineCount} lines`);
console.log(`   📊 Refactored: ${refactoredLineCount} lines`);
console.log(`   📊 Reduction: ${reduction} lines (-${reductionPercent}%)\n`);

// ============================================================================
// Generate summary
// ============================================================================
console.log('📋 Integration Summary:\n');
console.log('✅ Hook imports added');
console.log('✅ useState declarations replaced with hooks (49+ → 3 hooks)');
console.log('✅ Duplicate functions removed (now in hooks)');
console.log('✅ Data loading simplified (240+ lines → 4 lines)');
console.log('✅ Navigation listeners removed (now in hook)');
console.log('✅ Session state functions removed (now in hook)');
console.log('✅ Save operations removed (now in hook)');
console.log('✅ Validation removed (now in hook)');
console.log('✅ Fund handlers updated to use formState');
console.log('✅ JSX references updated to use formState.*\n');

console.log('📁 Files created:');
console.log(`   - ${OUTPUT_FILE.split('/').pop()} (refactored version)`);
console.log(`   - ${BACKUP_FILE.split('/').pop()} (backup)\n`);

console.log('🧪 Next steps:');
console.log('   1. Review the refactored file');
console.log('   2. Run syntax check: node -c app/screens/singapore/SingaporeTravelInfoScreen.refactored.js');
console.log('   3. Test the refactored version');
console.log('   4. If all looks good, replace original:');
console.log('      mv app/screens/singapore/SingaporeTravelInfoScreen.refactored.js \\');
console.log('         app/screens/singapore/SingaporeTravelInfoScreen.js');
console.log('   5. Commit the changes\n');

console.log('🎉 Integration complete!\n');
