// @ts-nocheck

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

const SimpleTDACTest = () => {
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

  const testFetchTDAC = async () => {
    console.log('🔍 Testing fetch with TDAC...');
    const start = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('⏰ Fetch timeout triggered');
      }, 10000); // 10 second timeout

      console.log('📡 Starting fetch request...');
      const response = await fetch('https://tdac.immigration.go.th/arrival-card-api/api/v1/security/initActionToken?submitId=test123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          token: 'test_token',
          langague: 'EN'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - start;
      console.log(`✅ Fetch completed in ${duration}ms`);
      
      addResult('Fetch TDAC', true, duration);
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`❌ Fetch failed after ${duration}ms:`, error.message);
      addResult('Fetch TDAC', false, duration, error.message);
    }
  };

  const testAxiosTDAC = async () => {
    console.log('🔍 Testing axios with TDAC...');
    
    // Check if axios is available
    let axios;
    try {
      axios = require('axios');
    } catch (error) {
      console.log('⚠️ Axios not available');
      addResult('Axios TDAC', false, 0, 'Axios not available');
      return;
    }

    const start = Date.now();
    
    try {
      console.log('📡 Starting axios request...');
      const response = await axios.post(
        'https://tdac.immigration.go.th/arrival-card-api/api/v1/security/initActionToken?submitId=test123',
        {
          token: 'test_token',
          langague: 'EN'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      const duration = Date.now() - start;
      console.log(`✅ Axios completed in ${duration}ms`);
      
      addResult('Axios TDAC', true, duration);
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`❌ Axios failed after ${duration}ms:`, error.message);
      addResult('Axios TDAC', false, duration, error.message);
    }
  };

  const testGoogleControl = async () => {
    console.log('🔍 Testing Google (control)...');
    const start = Date.now();
    
    try {
      console.log('📡 Starting Google fetch...');
      const response = await fetch('https://www.google.com', {
        method: 'HEAD'
      });

      const duration = Date.now() - start;
      console.log(`✅ Google completed in ${duration}ms`);
      
      addResult('Google Control', true, duration);
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`❌ Google failed after ${duration}ms:`, error.message);
      addResult('Google Control', false, duration, error.message);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    console.log('🚀 Starting all tests...');
    
    try {
      await testGoogleControl();
      await testFetchTDAC();
      await testAxiosTDAC();
      
      console.log('✅ All tests completed');
      Alert.alert('Tests Complete', 'Check console and results below');
    } catch (error) {
      console.error('❌ Test suite error:', error);
      Alert.alert('Test Error', error.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple TDAC Test</Text>
      <Text style={styles.subtitle}>
        ✅ iOS 18.5+ simulator: Both fetch and axios should work
      </Text>
      
      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonDisabled]}
        onPress={runAllTests}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'Running Tests...' : 'Run Simple Tests'}
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
          <Text style={styles.noResults}>No results yet. Tap "Run Simple Tests" to start.</Text>
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
    fontStyle: 'italic',
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

export default SimpleTDACTest;