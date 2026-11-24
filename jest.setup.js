// Jest setup file for React Native testing

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => {
  const mockDb = {
    transaction: jest.fn((callback) => {
      callback({
        executeSql: jest.fn((sql, params, success) => {
          if (success) {
success({ rows: { _array: [], length: 0 } });
}
        }),
      });
    }),
    withTransactionAsync: jest.fn(async (callback) => {
      await callback();
    }),
    execAsync: jest.fn(() => Promise.resolve()),
    getAllAsync: jest.fn(() => Promise.resolve([])),
    runAsync: jest.fn(() => Promise.resolve({ rowsAffected: 1 })),
    getFirstAsync: jest.fn(() => Promise.resolve(null)),
  };
  return {
    openDatabase: jest.fn(() => mockDb),
    openDatabaseAsync: jest.fn(() => Promise.resolve(mockDb)),
  };
});

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ cancelled: true })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ cancelled: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  MediaTypeOptions: {
    Images: 'Images',
    Videos: 'Videos',
    All: 'All',
  },
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://mock-document-directory/',
  cacheDirectory: 'file://mock-cache-directory/',
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })), // Keep for backward compatibility
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  // New File/Directory API mocks
  File: jest.fn().mockImplementation((path) => ({
    exists: jest.fn(() => Promise.resolve(false)),
    getInfo: jest.fn(() => Promise.resolve({ exists: false, size: 0 }))
  })),
  Directory: jest.fn().mockImplementation((path) => ({
    exists: jest.fn(() => Promise.resolve(false))
  }))
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

// Suppress console warnings during tests

// Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};