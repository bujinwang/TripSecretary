// Test AsyncStorage functionality
import AsyncStorage from '@react-native-async-storage/async-storage';

const testAsyncStorage = async () => {
  try {
    console.log('Testing AsyncStorage...');

    // Test 1: Check if AsyncStorage is defined
    console.log('AsyncStorage object:', AsyncStorage);
    console.log('AsyncStorage.getItem:', AsyncStorage.getItem);

    if (!AsyncStorage || !AsyncStorage.getItem) {
      console.error('AsyncStorage or getItem method is undefined!');
      return false;
    }

    // Test 2: Try to set an item
    console.log('Setting test item...');
    await AsyncStorage.setItem('test_key', 'test_value');
    console.log('Test item set successfully');

    // Test 3: Try to get the item
    console.log('Getting test item...');
    const value = await AsyncStorage.getItem('test_key');
    console.log('Retrieved value:', value);

    if (value !== 'test_value') {
      console.error('Retrieved value does not match set value!');
      return false;
    }

    // Test 4: Clean up
    console.log('Cleaning up test item...');
    await AsyncStorage.removeItem('test_key');
    console.log('Test completed successfully');

    return true;
  } catch (error) {
    console.error('AsyncStorage test failed:', error);
    return false;
  }
};

// Export for use in React Native environment
export default testAsyncStorage;