// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';

// Try to import axios, fallback if not available
let axios;
try {
  axios = require('axios');
} catch (error) {
  console.warn('⚠️ Axios not available, will skip axios tests');
  axios = null;
}

const ConnectivityTestRunner = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const TDAC_BASE_URL = 'https://tdac.immigration.go.th/arrival-card-api/api/v1';
  const TEST_TIMEOUTS = [5000, 10000, 15000, 30000];

  const addResult = (test, result) => {
    const newResult = { ...test, ...result, timestamp: new Date() };
    console.log('📊 Test result:', {
      client: newResult.client,
      endpoint: newResult.endpoint,
      success: newResult.success,
      duration: newResult.duration,
      error: newResult.error
    });
    setTestResults(prev => [...prev, newResult]);
  };

  const testConnectivityWithFetch = async () => {
    console.log('🔍 Starting fetch connectivity tests...');
    const endpoints = [
      { name: 'Google (control)', url: 'https://www.google.com', method: 'HEAD' },
      { name: 'TDAC Base', url: `${TDAC_BASE_URL}/health`, method: 'GET' },
      { name: 'TDAC Init Token', url: `${TDAC_BASE_URL}/security/initActionToken`, method: 'POST' }
    ];

    for (const endpoint of endpoints) {
      console.log(`📡 Testing fetch → ${endpoint.name}`);
      for (const timeout of TEST_TIMEOUTS) {
        console.log(`⏱️  Fetch ${endpoint.name} with ${timeout}ms timeout...`);
        try {
          const start = Date.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const response = await fetch(endpoint.url, {
            method: endpoint.method,
            signal: controller.signal,
            headers: endpoint.method === 'POST' ? {
              'Content-Type': 'application/json'
            } : {}
          });

          clearTimeout(timeoutId);
          const duration = Date.now() - start;

          addResult({
            client: 'fetch',
            endpoint: endpoint.name,
            timeout: timeout
          }, {
            success: true,
            status: response.status,
            duration: duration
          });
        } catch (error) {
          addResult({
            client: 'fetch',
            endpoint: endpoint.name,
            timeout: timeout
          }, {
            success: false,
            error: `${error.name}: ${error.message}`
          });
        }
      }
    }
  };

  const testConnectivityWithAxios = async () => {
    if (!axios) {
      console.log('⚠️ Skipping axios tests - axios not available');
      addResult({
        client: 'axios',
        endpoint: 'All endpoints',
        timeout: 0
      }, {
        success: false,
        error: 'Axios not available in this environment'
      });
      return;
    }

    console.log('🔍 Starting axios connectivity tests...');
    const endpoints = [
      { name: 'Google (control)', url: 'https://www.google.com', method: 'HEAD' },
      { name: 'TDAC Base', url: `${TDAC_BASE_URL}/health`, method: 'GET' },
      { name: 'TDAC Init Token', url: `${TDAC_BASE_URL}/security/initActionToken`, method: 'POST' }
    ];

    for (const endpoint of endpoints) {
      console.log(`📡 Testing axios → ${endpoint.name}`);
      for (const timeout of TEST_TIMEOUTS) {
        console.log(`⏱️  Axios ${endpoint.name} with ${timeout}ms timeout...`);
        const start = Date.now();
        try {
          const config = {
            method: endpoint.method,
            url: endpoint.url,
            timeout: timeout,
            headers: {
              'Content-Type': 'application/json',
              'Accept': '*/*',
              'User-Agent': 'PostmanRuntime/7.49.0'
            }
          };

          if (endpoint.method === 'POST') {
            config.data = { test: 'connectivity' };
          }

          const response = await axios(config);
          const duration = Date.now() - start;

          addResult({
            client: 'axios',
            endpoint: endpoint.name,
            timeout: timeout
          }, {
            success: true,
            status: response.status,
            duration: duration
          });
        } catch (error) {
          const duration = Date.now() - start;
          addResult({
            client: 'axios',
            endpoint: endpoint.name,
            timeout: timeout
          }, {
            success: false,
            error: `${error.code || error.name}: ${error.message}`,
            duration: duration
          });
        }
      }
    }
  };

  const testTDACInitActionToken = async () => {
    console.log('🔍 Starting TDAC initActionToken specific tests...');
    const testToken = "test_token_placeholder";
    const submitId = 'test' + Math.random().toString(36).substring(2, 15);

    // Test with axios (if available)
    if (axios) {
      console.log('📡 Testing TDAC initActionToken with axios...');
      try {
        const start = Date.now();
        const response = await axios.post(
          `${TDAC_BASE_URL}/security/initActionToken?submitId=${submitId}`,
          {
            token: testToken,
            langague: 'EN'
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': '*/*',
              'User-Agent': 'PostmanRuntime/7.49.0'
            },
            timeout: 30000
          }
        );
        addResult({
          client: 'axios',
          endpoint: 'TDAC initActionToken',
          timeout: 30000
        }, {
          success: true,
          status: response.status,
          duration: Date.now() - start
        });
      } catch (error) {
        addResult({
          client: 'axios',
          endpoint: 'TDAC initActionToken',
          timeout: 30000
        }, {
          success: false,
          error: `${error.code || error.name}: ${error.message}`
        });
      }
    } else {
      console.log('⚠️ Skipping axios TDAC test - axios not available');
      addResult({
        client: 'axios',
        endpoint: 'TDAC initActionToken',
        timeout: 30000
      }, {
        success: false,
        error: 'Axios not available in this environment'
      });
    }

    // Test with fetch + AbortController
    console.log('📡 Testing TDAC initActionToken with fetch...');
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(
        `${TDAC_BASE_URL}/security/initActionToken?submitId=${submitId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'User-Agent': 'PostmanRuntime/7.49.0'
          },
          body: JSON.stringify({
            token: testToken,
            langague: 'EN'
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);
      addResult({
        client: 'fetch+AbortController',
        endpoint: 'TDAC initActionToken',
        timeout: 30000
      }, {
        success: true,
        status: response.status,
        duration: Date.now() - start
      });
    } catch (error) {
      addResult({
        client: 'fetch+AbortController',
        endpoint: 'TDAC initActionToken',
        timeout: 30000
      }, {
        success: false,
        error: `${error.name}: ${error.message}`
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    let totalTests = 0;

    try {
      console.log('🔍 Starting connectivity tests...');
      
      console.log('📡 Testing fetch connectivity...');
      await testConnectivityWithFetch();
      totalTests += TEST_TIMEOUTS.length * 3; // 3 endpoints * 4 timeouts
      
      console.log('📡 Testing axios connectivity...');
      await testConnectivityWithAxios();
      totalTests += TEST_TIMEOUTS.length * 3; // 3 endpoints * 4 timeouts
      
      console.log('📡 Testing TDAC initActionToken...');
      await testTDACInitActionToken();
      totalTests += 2; // 2 specific tests
      
      console.log('✅ All tests completed');
      Alert.alert('Tests Complete', `Completed ${totalTests} connectivity tests. Check results below.`);
    } catch (error) {
      console.error('❌ Test error:', error);
      Alert.alert('Test Error', error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusColor = (result) => {
    if (result.success) {
return '#4CAF50';
} // Green
    if (result.error?.includes('Timeout') || result.error?.includes('AbortError')) {
return '#FF9800';
} // Orange
    return '#F44336'; // Red
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TDAC Connectivity Tests</Text>
      <Text style={styles.subtitle}>
        📱 iOS 18.5+ simulator: Networking issues resolved
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Tests...' : 'Run Connectivity Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
          <Text style={styles.clearButtonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                {result.client} → {result.endpoint}
              </Text>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(result) }]} />
            </View>

            <Text style={styles.resultDetails}>
              Timeout: {result.timeout}ms
            </Text>

            {result.success ? (
              <Text style={styles.successText}>
                ✓ Status: {result.status}, Duration: {result.duration}ms
              </Text>
            ) : (
              <Text style={styles.errorText}>
                ✗ {result.error}
              </Text>
            )}

            <Text style={styles.timestamp}>
              {result.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        ))}

        {testResults.length === 0 && !isRunning && (
          <Text style={styles.noResults}>No test results yet. Tap "Run Tests" to start.</Text>
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
    fontSize: 24,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
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
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultsContainer: {
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  resultDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  noResults: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
});

export default ConnectivityTestRunner;