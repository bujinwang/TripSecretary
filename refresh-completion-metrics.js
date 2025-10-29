// Temporary script to refresh completion metrics for all entries
import SecureStorageService from './app/services/security/SecureStorageService.js';
import EntryInfo from './app/models/EntryInfo.js';
import UserDataService from './app/services/data/UserDataService.js';

async function refreshCompletionMetrics() {
  const userId = 'user_001';
  
  try {
    await UserDataService.initialize(userId);
    
    // Get all entry infos
    const entries = await SecureStorageService.getAllEntryInfos(userId);
    console.log(`Found ${entries.length} entries`);
    
    for (const entryData of entries) {
      const entry = new EntryInfo(entryData);
      
      // Load related data
      const passport = await SecureStorageService.getPassport(entry.passportId);
      const personalInfo = await SecureStorageService.getPersonalInfo(entry.personalInfoId);
      const travelInfo = await SecureStorageService.getTravelInfo(entry.travelInfoId);
      const funds = entry.fundItemIds ? await Promise.all(
        Array.from(entry.fundItemIds).map(id => SecureStorageService.getFund(id))
      ) : [];
      
      // Update metrics
      entry.updateCompletionMetrics(passport, personalInfo, funds, travelInfo);
      
      console.log(`Entry ${entry.id} (${entry.destinationId}):`, entry.completionMetrics);
      
      // Save updated entry
      await entry.save();
    }
    
    console.log('Completion metrics refreshed!');
  } catch (error) {
    console.error('Error refreshing metrics:', error);
  }
}

refreshCompletionMetrics();
