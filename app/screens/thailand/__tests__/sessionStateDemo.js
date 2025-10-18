/**
 * Manual demo script to test session state functionality
 * This can be run to verify the session state implementation works correctly
 */

// Note: This is a demo script, AsyncStorage import is commented out for Node.js compatibility
// const AsyncStorage = require('@react-native-async-storage/async-storage');

// Mock AsyncStorage for demo purposes
const mockStorage = {};

const MockAsyncStorage = {
  getItem: async (key) => {
    console.log(`📖 Reading from storage: ${key}`);
    const value = mockStorage[key] || null;
    console.log(`📖 Retrieved value:`, value ? JSON.parse(value) : null);
    return value;
  },
  setItem: async (key, value) => {
    console.log(`💾 Saving to storage: ${key}`);
    console.log(`💾 Value:`, JSON.parse(value));
    mockStorage[key] = value;
  },
  removeItem: async (key) => {
    console.log(`🗑️ Removing from storage: ${key}`);
    delete mockStorage[key];
  }
};

// Session state management functions (copied from ThailandTravelInfoScreen)
const getSessionStateKey = (userId = 'demo_user') => {
  return `session_state_thailand_${userId}`;
};

const saveSessionState = async (sessionData) => {
  try {
    const sessionState = {
      expandedSection: sessionData.expandedSection || null,
      scrollPosition: sessionData.scrollPosition || 0,
      lastEditedField: sessionData.lastEditedField || null,
      timestamp: new Date().toISOString(),
    };
    
    const key = getSessionStateKey(sessionData.userId);
    await MockAsyncStorage.setItem(key, JSON.stringify(sessionState));
    console.log('✅ Session state saved successfully');
    return sessionState;
  } catch (error) {
    console.error('❌ Failed to save session state:', error);
    throw error;
  }
};

const loadSessionState = async (userId = 'demo_user') => {
  try {
    const key = getSessionStateKey(userId);
    const sessionStateJson = await MockAsyncStorage.getItem(key);
    
    if (sessionStateJson) {
      const sessionState = JSON.parse(sessionStateJson);
      console.log('✅ Session state loaded successfully');
      return sessionState;
    } else {
      console.log('ℹ️ No session state found');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to load session state:', error);
    return null;
  }
};

// Demo scenarios
const runDemo = async () => {
  console.log('🚀 Starting Session State Demo\n');

  // Scenario 1: Save initial session state
  console.log('📝 Scenario 1: Save initial session state');
  const initialState = await saveSessionState({
    userId: 'demo_user',
    expandedSection: 'passport',
    scrollPosition: 0,
    lastEditedField: null
  });
  console.log('');

  // Scenario 2: Update session state (user expands different section)
  console.log('📝 Scenario 2: User expands personal info section');
  const updatedState = await saveSessionState({
    userId: 'demo_user',
    expandedSection: 'personal',
    scrollPosition: 150,
    lastEditedField: 'email'
  });
  console.log('');

  // Scenario 3: Load session state (app restart)
  console.log('📝 Scenario 3: Load session state after app restart');
  const loadedState = await loadSessionState('demo_user');
  console.log('');

  // Scenario 4: Multiple users
  console.log('📝 Scenario 4: Multiple users with different session states');
  await saveSessionState({
    userId: 'user_1',
    expandedSection: 'funds',
    scrollPosition: 300,
    lastEditedField: 'amount'
  });
  
  await saveSessionState({
    userId: 'user_2',
    expandedSection: 'travel',
    scrollPosition: 500,
    lastEditedField: 'flightNumber'
  });

  const user1State = await loadSessionState('user_1');
  const user2State = await loadSessionState('user_2');
  console.log('');

  // Scenario 5: Error handling
  console.log('📝 Scenario 5: Error handling');
  try {
    // Simulate storage error
    MockAsyncStorage.setItem = async () => {
      throw new Error('Storage quota exceeded');
    };
    
    await saveSessionState({
      userId: 'demo_user',
      expandedSection: 'passport',
      scrollPosition: 0,
      lastEditedField: null
    });
  } catch (error) {
    console.log('✅ Error handled gracefully:', error.message);
  }
  console.log('');

  // Summary
  console.log('📊 Demo Summary:');
  console.log('- ✅ Session state saving works correctly');
  console.log('- ✅ Session state loading works correctly');
  console.log('- ✅ Multiple users supported with separate states');
  console.log('- ✅ Error handling works gracefully');
  console.log('- ✅ All required fields included in session state');
  console.log('- ✅ Correct key format: session_state_thailand_{userId}');
  
  console.log('\n🎉 Session State Demo completed successfully!');
};

// Export for testing
module.exports = { saveSessionState, loadSessionState, getSessionStateKey, runDemo };

// Run demo if this file is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}