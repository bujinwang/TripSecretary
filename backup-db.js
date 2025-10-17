// Database Backup Script for React Native Environment
// Run this in your React Native app to create a database backup

import SecureStorageService from './app/services/security/SecureStorageService.js';

async function createDatabaseBackup() {
  try {
    console.log('Creating database backup...');

    // Initialize the service first
    await SecureStorageService.initialize('backup_user');

    // Create backup
    const backupPath = await SecureStorageService.createBackup('backup_user');

    console.log('✅ Database backup created successfully!');
    console.log('Backup file location:', backupPath);

    return backupPath;
  } catch (error) {
    console.error('❌ Failed to create database backup:', error);
    throw error;
  }
}

// For testing the backup functionality
async function testBackup() {
  try {
    console.log('Testing database backup...');
    const backupPath = await createDatabaseBackup();
    console.log('Test completed successfully. Backup file:', backupPath);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Export for use in React Native
export { createDatabaseBackup, testBackup };

// Run if called directly (for testing purposes)
if (require.main === module) {
  testBackup();
}