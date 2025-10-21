import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const RobustNetworkTest = () => {
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test, success, duration, error = null) => {
    const result = {
      test,
      success,
      duration,
      error,
      timestamp: new Date().toLocaleTimeString()
    };
    console.log('📊 Test result:', result);
    setResults(prev => [...prev, result]);
  };

  // Individual test with proper timeout and error handling
  const runSingleTest = async (testName, testFn, timeoutMs = 5000) => {
    console.log(`🔍 Starting ${testName}...`);
    const start = Date.now();
    
    try {
      // Race between the test and a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Test timeout')), timeoutMs);
      });
      
      await Promise.race([testFn(), timeoutPromise]);
      
      const duration = Date.now() - start;
      console.log(`✅ ${testName} completed in ${duration}ms`);
      addResult(testName, true, duration);
      
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`❌ ${testName} failed after ${duration}ms:`, error.message);
      addResult(testName, false, duration, error.message);
    }
  };

  // Test functions
  const testGoogle = async () => {
    const response = await fetch('https://www.google.com', { method: 'HEAD' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  };

  const testTDACFetch = async () => {
    const response = await fetch('https://tdac.immigration.go.th/arrival-card-api/api/v1/security/initActionToken?submitId=test123', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'test', langague: 'EN' })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  };

  const testAxios = async () => {
    let axios;
    try {
      axios = require('axios');
    } catch (error) {
      throw new Error('Axios not available');
    }
    
    const response = await axios.post(
      'https://tdac.immigration.go.th/arrival-card-api/api/v1/security/initActionToken?submitId=test123',
      { token: 'test', langague: 'EN' },
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 3000 
      }
    );
  };

  // Run all tests with proper async handling
  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    console.log('🚀 Starting robust network tests...');
    
    // Create array of test promises that run in parallel
    const testPromises = [
      runSingleTest('Google Control', testGoogle, 3000),
      runSingleTest('TDAC Fetch', testTDACFetch, 5000),
      runSingleTest('TDAC Axios', testAxios, 5000)
    ];
    
    try {
      // Run all tests in parallel with overall timeout
      const overallTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Overall test timeout')), 15000);
      });
      
      await Promise.race([
        Promise.allSettled(testPromises), // Wait for all tests to complete or fail
        overallTimeout
      ]);
      
      console.log('✅ All tests completed (or timed out individually)');
      
    } catch (error) {
      console.error('❌ Overall test suite error:', error.message);
      addResult('Test Suite', false, 15000, 'Overall timeout - some tests may still be running');
    } finally {
      // This WILL always execute, even if tests hang
      setIsRunning(false);
      console.log('🏁 Test suite finished');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Robust Network Test</Text>
      <Text style={styles.subtitle}>Proper async handling with timeouts</Text>
      
      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonDisabled]}
        onPress={runAllTests}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'Running Tests...' : 'Run Robust Tests'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.clearButton}
        onPress={() => setResults([])}
      >
        <Text style={styles.clearButtonText}>Clear Results</Text>
      </TouchableOpacity>

      <ScrollView style={styles.results}>
        {results.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <Text style={styles.resultTest}>{result.test}</Text>
            <Text style={[styles.resultStatus, { color: result.success ? '#4CAF50' : '#F44336' }]}>
              {result.success ? '✅ Success' : '❌ Failed'}
            </Text>
            <Text style={styles.resultDuration}>Duration: {result.duration}ms</Text>
            {result.error && (
              <Text style={styles.resultError}>Error: {result.error}</Text>
            )}
            <Text style={styles.resultTime}>{result.timestamp}</Text>
          </View>
        ))}
        
        {results.length === 0 && !isRunning && (
          <Text style={styles.noResults}>No results yet. Tests run in parallel with individual timeouts.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#757575',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  clearButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  results: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  resultTest: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  resultDuration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  resultError: {
    fontSize: 12,
    color: '#F44336',
    marginBottom: 2,
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
  },
  noResults: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
});

export default RobustNetworkTest;