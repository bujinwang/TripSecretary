/**
 * Script to check which simulator is currently being used by the app
 * and show database information from console logs
 */

const { execSync } = require('child_process');

console.log('📱 Checking Currently Booted Simulators...\n');

try {
  // Get booted simulators
  const output = execSync('xcrun simctl list devices --json', { encoding: 'utf-8' });
  const data = JSON.parse(output);
  
  const bootedDevices = [];
  
  for (const [runtime, devices] of Object.entries(data.devices)) {
    for (const device of devices) {
      if (device.state === 'Booted') {
        bootedDevices.push({
          name: device.name,
          udid: device.udid,
          runtime: runtime.replace('com.apple.CoreSimulator.SimRuntime.', '').replace('iOS-', '').replace(/-/g, '.')
        });
      }
    }
  }
  
  if (bootedDevices.length === 0) {
    console.log('❌ No simulators are currently booted');
    console.log('\n💡 To boot a simulator:');
    console.log('   xcrun simctl boot <UDID>');
    console.log('   or use Xcode: Window > Devices and Simulators');
  } else {
    console.log(`✅ Found ${bootedDevices.length} booted simulator(s):\n`);
    
    bootedDevices.forEach((device, index) => {
      console.log(`${index + 1}. ${device.name}`);
      console.log(`   UDID: ${device.udid}`);
      console.log(`   iOS Version: ${device.runtime}`);
      console.log('');
    });
    
    if (bootedDevices.length > 1) {
      console.log('⚠️  Multiple simulators are booted!');
      console.log('   The app will use the one specified in your Expo/Metro configuration.');
      console.log('   Check your console logs for "Opening database:" to see which one is active.\n');
    }
    
    console.log('💡 To identify which simulator the app is using:');
    console.log('   1. Check the console logs when the app starts');
    console.log('   2. Look for: "Opening database: tripsecretary_secure"');
    console.log('   3. The database path will be logged (if FileSystem is available)');
    console.log('   4. Match the device ID in the path to the UDID above\n');
    
    console.log('💡 To check database records in a specific simulator:');
    console.log('   1. Boot only ONE simulator');
    console.log('   2. Run the app');
    console.log('   3. Check console logs for entry_info record counts');
    console.log('   4. Look for: "[EntryInfoRepository] Total entry_info records in DB for user user_001: X"\n');
  }
  
  // Check if we can find the database files
  console.log('🔍 Searching for database files...\n');
  
  const fs = require('fs');
  const path = require('path');
  const simulatorPath = path.join(process.env.HOME, 'Library', 'Developer', 'CoreSimulator', 'Devices');
  
  if (fs.existsSync(simulatorPath)) {
    let foundCount = 0;
    
    for (const device of bootedDevices) {
      const devicePath = path.join(simulatorPath, device.udid);
      if (fs.existsSync(devicePath)) {
        // Search in common locations
        const searchPaths = [
          path.join(devicePath, 'data', 'Containers', 'Data', 'Application'),
          path.join(devicePath, 'data', 'Containers', 'Data', 'Application', '*', 'Library', 'LocalDatabase'),
          path.join(devicePath, 'data', 'Containers', 'Data', 'Application', '*', 'Documents', 'SQLite'),
        ];
        
        // Try to find the database
        const { execSync } = require('child_process');
        try {
          const findResult = execSync(`find "${devicePath}" -name "tripsecretary_secure.db" 2>/dev/null | head -5`, { encoding: 'utf-8' });
          if (findResult.trim()) {
            console.log(`📊 Database files found for ${device.name}:`);
            findResult.trim().split('\n').forEach(dbPath => {
              if (dbPath) {
                try {
                  const stats = fs.statSync(dbPath);
                  console.log(`   ${dbPath}`);
                  console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
                  foundCount++;
                } catch (e) {
                  // Ignore
                }
              }
            });
            console.log('');
          }
        } catch (e) {
          // No databases found
        }
      }
    }
    
    if (foundCount === 0) {
      console.log('⚠️  No database files found in booted simulators.');
      console.log('   This could mean:');
      console.log('   - The app hasn\'t created the database yet');
      console.log('   - The database is in a different location (expo-sqlite may use a different path)');
      console.log('   - The app is using a different simulator than expected\n');
    }
  }
  
} catch (error) {
  console.error('Error:', error.message);
}

