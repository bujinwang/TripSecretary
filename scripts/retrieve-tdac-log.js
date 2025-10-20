/**
 * Script to retrieve and display TDAC submission logs from local storage
 * Usage: Run this in your React Native app or browser console
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class TDACLogRetriever {
  
  /**
   * Retrieve a specific log by key
   */
  static async getLogByKey(logKey) {
    try {
      console.log(`🔍 Retrieving log: ${logKey}`);
      const logData = await AsyncStorage.getItem(logKey);
      
      if (!logData) {
        console.log('❌ Log not found');
        return null;
      }
      
      const parsedLog = JSON.parse(logData);
      console.log('✅ Log retrieved successfully:');
      console.log(JSON.stringify(parsedLog, null, 2));

      if (parsedLog?.additionalInfo?.resolvedSelectItems) {
        console.log('\n🔁 Resolved Select Items:');
        const resolved = parsedLog.additionalInfo.resolvedSelectItems;
        console.log(`  • tranModeId:      ${resolved.tranModeId || '(none)'}`);
        if (resolved.tranModeDesc) {
          console.log(`    ↳ ${resolved.tranModeDesc}`);
        }
        console.log(`  • accTypeId:       ${resolved.accTypeId || '(none)'}`);
        console.log(`  • accProvinceId:   ${resolved.accProvinceId || '(none)'} → ${resolved.accProvinceDesc || ''}`);
        console.log(`  • accDistrictId:   ${resolved.accDistrictId || '(none)'} → ${resolved.accDistrictDesc || ''}`);
        console.log(`  • accSubDistrictId:${resolved.accSubDistrictId || '(none)'} → ${resolved.accSubDistrictDesc || ''}`);
        console.log(`  • accPostCode:     ${resolved.accPostCode || '(none)'}`);
      }
      
      return parsedLog;
    } catch (error) {
      console.error('❌ Error retrieving log:', error);
      return null;
    }
  }
  
  /**
   * List all TDAC-related logs in storage
   */
  static async listAllTDACLogs() {
    try {
      console.log('🔍 Searching for all TDAC logs...');
      const allKeys = await AsyncStorage.getAllKeys();
      const tdacKeys = allKeys.filter(key => key.includes('tdac_'));
      
      console.log(`📋 Found ${tdacKeys.length} TDAC-related logs:`);
      tdacKeys.forEach((key, index) => {
        console.log(`  ${index + 1}. ${key}`);
      });
      
      return tdacKeys;
    } catch (error) {
      console.error('❌ Error listing logs:', error);
      return [];
    }
  }
  
  /**
   * Get all logs with their data
   */
  static async getAllTDACLogsWithData() {
    try {
      const keys = await this.listAllTDACLogs();
      const logs = [];
      
      for (const key of keys) {
        const logData = await AsyncStorage.getItem(key);
        if (logData) {
          try {
            const parsedLog = JSON.parse(logData);
            logs.push({
              key,
              data: parsedLog,
              timestamp: parsedLog.timestamp || 'Unknown'
            });
          } catch (parseError) {
            console.warn(`⚠️ Could not parse log ${key}:`, parseError);
          }
        }
      }
      
      // Sort by timestamp (newest first)
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      console.log(`📊 Retrieved ${logs.length} logs with data`);
      return logs;
    } catch (error) {
      console.error('❌ Error getting logs with data:', error);
      return [];
    }
  }
  
  /**
   * Get submission history (the centralized log)
   */
  static async getSubmissionHistory() {
    try {
      console.log('🔍 Retrieving submission history...');
      const historyData = await AsyncStorage.getItem('tdac_submission_history');
      
      if (!historyData) {
        console.log('❌ No submission history found');
        return [];
      }
      
      const history = JSON.parse(historyData);
      console.log(`✅ Found ${history.length} entries in submission history`);
      
      // Display summary
      history.forEach((entry, index) => {
        console.log(`\n📋 Entry ${index + 1}:`);
        console.log(`  ⏰ Time: ${new Date(entry.timestamp).toLocaleString()}`);
        console.log(`  🌐 Method: ${entry.submissionMethod || entry.fillMethod || 'Unknown'}`);
        if (entry.travelerData) {
          console.log(`  👤 Traveler: ${entry.travelerData.firstName} ${entry.travelerData.familyName}`);
          console.log(`  📄 Passport: ${entry.travelerData.passportNo}`);
          console.log(`  ✈️ Flight: ${entry.travelerData.flightNo}`);
        }
      });
      
      return history;
    } catch (error) {
      console.error('❌ Error retrieving submission history:', error);
      return [];
    }
  }
  
  /**
   * Export all logs to console in a readable format
   */
  static async exportAllLogs() {
    try {
      console.log('\n🚀 ===== TDAC LOGS EXPORT =====');
      
      // Get individual logs
      const logs = await this.getAllTDACLogsWithData();
      
      // Get submission history
      const history = await this.getSubmissionHistory();
      
      const exportData = {
        timestamp: new Date().toISOString(),
        individualLogs: logs,
        submissionHistory: history,
        summary: {
          totalIndividualLogs: logs.length,
          totalHistoryEntries: history.length
        }
      };
      
      console.log('\n📊 COMPLETE EXPORT DATA:');
      console.log(JSON.stringify(exportData, null, 2));
      
      return exportData;
    } catch (error) {
      console.error('❌ Error exporting logs:', error);
      return null;
    }
  }
}

// Usage examples:
console.log('🔧 TDAC Log Retriever loaded. Available methods:');
console.log('  TDACLogRetriever.getLogByKey("tdac_submission_log_hybrid_1760975435477")');
console.log('  TDACLogRetriever.listAllTDACLogs()');
console.log('  TDACLogRetriever.getAllTDACLogsWithData()');
console.log('  TDACLogRetriever.getSubmissionHistory()');
console.log('  TDACLogRetriever.exportAllLogs()');

// Auto-retrieve the specific log you mentioned
(async () => {
  console.log('\n🎯 Auto-retrieving your specific log...');
  await TDACLogRetriever.getLogByKey('tdac_submission_log_hybrid_1760975435477');
})();

export default TDACLogRetriever;
