#!/usr/bin/env node

/**
 * Simulate App Initialization
 *
 * This script simulates what happens when the app initializes
 * by calling UserDataService.initialize with user_001
 *
 * Usage: node scripts/simulate-app-init.js
 */

const path = require('path');

// Mock React Native modules that are imported by the services
global.__DEV__ = true;

// Mock expo-sqlite
const mockDb = {
  getFirstAsync: async (query, params) => {
    console.log('Mock DB Query:', query, params);
    if (query.includes('SELECT id FROM users WHERE id = ?')) {
      return null; // Simulate user doesn't exist
    }
    return null;
  },
  runAsync: async (query, params) => {
    console.log('Mock DB Insert:', query, params);
    return { insertId: 1, changes: 1 };
  },
  execAsync: async (query) => {
    console.log('Mock DB Exec:', query);
    return;
  },
  withTransactionAsync: async (callback) => {
    console.log('Mock DB Transaction');
    return await callback();
  },
  getAllAsync: async (query, params) => {
    console.log('Mock DB Query All:', query, params);
    return [];
  }
};

// Mock expo modules
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve(mockDb))
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  makeDirectoryAsync: jest.fn(),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true }))
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn()
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
    clear: jest.fn()
  }
}));

async function simulateAppInit() {
  console.log('🚀 Simulating App Initialization...\n');

  try {
    // Import the services (this will use our mocked modules)
    const UserDataService = require('../app/services/data/UserDataService').default;
    
    console.log('📱 Calling UserDataService.initialize("user_001")...');
    
    // This should trigger our ensureUser method
    await UserDataService.initialize('user_001');
    
    console.log('✅ Initialization completed successfully!');
    console.log('💡 In a real app, this would create the user_001 record in the database.');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the simulation
simulateAppInit().catch(console.error);