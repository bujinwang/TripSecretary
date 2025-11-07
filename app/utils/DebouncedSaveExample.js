/**
 * Example usage of DebouncedSave with UserDataService
 * This demonstrates how to integrate the debounced save utility
 * with the existing data service for auto-save functionality.
 */

import DebouncedSave from './DebouncedSave';
import UserDataService from '../services/data/UserDataService';

/**
 * Example implementation showing how to use DebouncedSave
 * in a React Native screen for auto-saving form data
 */
class AutoSaveExample {
  constructor(userId) {
    this.userId = userId;
    
    // Create debounced save functions for different data types
    this.savePassport = DebouncedSave.debouncedSave(
      'passport_' + userId,
      (passportData) => UserDataService.savePassport(passportData, userId),
      300 // 300ms delay
    );
    
    this.savePersonalInfo = DebouncedSave.debouncedSave(
      'personalInfo_' + userId,
      (personalData) => UserDataService.upsertPersonalInfo(userId, personalData),
      300
    );
    
    this.saveTravelInfo = DebouncedSave.debouncedSave(
      'travelInfo_' + userId,
      (travelData) => UserDataService.saveTravelInfo(travelData, userId),
      300
    );
  }

  // Example: Handle passport field changes with auto-save
  handlePassportFieldChange(fieldName, value) {
    const passportData = {
      [fieldName]: value
    };
    
    // This will debounce the save operation
    this.savePassport(passportData);
    
    // Get current save state for UI feedback
    const saveState = DebouncedSave.getSaveState('passport_' + this.userId);
    console.log('Save state:', saveState); // 'pending', 'saving', 'saved', 'error', or null
  }

  // Example: Handle personal info field changes
  handlePersonalInfoFieldChange(fieldName, value) {
    const personalData = {
      [fieldName]: value
    };
    
    this.savePersonalInfo(personalData);
  }

  // Example: Flush all pending saves before navigation
  async handleNavigation() {
    try {
      // Flush all pending saves before navigating
      await DebouncedSave.flushPendingSave();
      console.log('All data saved successfully');
      
      // Now safe to navigate
      // navigation.navigate('NextScreen');
    } catch (error) {
      console.error('Failed to save data before navigation:', error);
      // Handle error - maybe show alert or block navigation
    }
  }

  // Example: Check if there are unsaved changes
  hasUnsavedChanges() {
    return DebouncedSave.hasPendingSaves();
  }

  // Example: Get save state for UI indicators
  getSaveStateForField(fieldType) {
    const key = fieldType + '_' + this.userId;
    return DebouncedSave.getSaveState(key);
  }

  // Cleanup when component unmounts
  cleanup() {
    DebouncedSave.clear();
  }
}

export default AutoSaveExample;
