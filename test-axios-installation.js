/**
 * Quick test to verify axios installation
 */

try {
  const axios = require('axios');
  console.log('✅ Axios successfully imported');
  console.log('   Version:', axios.VERSION || 'Unknown');
  console.log('   Available methods:', Object.keys(axios).filter(key => typeof axios[key] === 'function').slice(0, 5));
  
  // Test basic functionality
  if (typeof axios.post === 'function') {
    console.log('✅ axios.post method available');
  } else {
    console.log('❌ axios.post method not available');
  }
  
  if (typeof axios.isCancel === 'function') {
    console.log('✅ axios.isCancel method available');
  } else {
    console.log('❌ axios.isCancel method not available');
  }
  
  console.log('🎉 Axios installation test passed!');
  
} catch (error) {
  console.error('❌ Axios installation test failed:', error.message);
  process.exit(1);
}