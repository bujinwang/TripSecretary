/**
 * Debug function to retrieve TDAC logs - add this to any React Native screen
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const debugTDACLogs = async () => {
  try {
    // Try to get your specific log
    const specificLog = await AsyncStorage.getItem('tdac_submission_log_hybrid_1760975435477');
    
    if (specificLog) {
      const parsedLog = JSON.parse(specificLog);
      console.log('🎯 Found your specific log:');
      console.log(JSON.stringify(parsedLog, null, 2));
      
      // Show alert with basic info
      Alert.alert(
        'TDAC Log Found',
        `Timestamp: ${parsedLog.timestamp}\nMethod: ${parsedLog.submissionMethod}\nTraveler: ${parsedLog.travelerData?.firstName} ${parsedLog.travelerData?.familyName}`,
        [{ text: 'OK' }]
      );
    } else {
      console.log('❌ Specific log not found');
      
      // List all TDAC logs
      const allKeys = await AsyncStorage.getAllKeys();
      const tdacKeys = allKeys.filter(key => key.includes('tdac_'));
      
      console.log('📋 Available TDAC logs:');
      tdacKeys.forEach(key => console.log(`  - ${key}`));
      
      Alert.alert(
        'Log Not Found',
        `Specific log not found, but found ${tdacKeys.length} other TDAC logs. Check console for details.`,
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('❌ Error retrieving logs:', error);
    Alert.alert('Error', 'Failed to retrieve logs: ' + error.message);
  }
};

// Export for use in components
export default debugTDACLogs;

// Usage in a React component:
/*
import debugTDACLogs from './debug-tdac-logs';

// Add a button or call directly
<Button title="Debug TDAC Logs" onPress={debugTDACLogs} />
*/