import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const MinimalNetworkTest = () => {
  const [result, setResult] = useState('Ready to test');
  const [isRunning, setIsRunning] = useState(false);

  const testBasicFetch = async () => {
    setIsRunning(true);
    setResult('Testing basic fetch...');
    console.log('🔍 Starting minimal fetch test...');
    
    try {
      // Test 1: Basic fetch with short timeout
      console.log('📡 Testing fetch with 3 second timeout...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ 3 second timeout triggered');
        controller.abort();
      }, 3000);

      const start = Date.now();
      const response = await fetch('https://httpbin.org/delay/1', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - start;
      
      console.log(`✅ Fetch succeeded in ${duration}ms`);
      setResult(`✅ Success: ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`❌ Fetch failed after ${duration}ms:`, error.name, error.message);
      
      if (error.name === 'AbortError') {
        setResult(`⏰ Timeout after ${duration}ms`);
      } else {
        setResult(`❌ Error: ${error.message}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const testGoogleHead = async () => {
    setIsRunning(true);
    setResult('Testing Google HEAD...');
    console.log('🔍 Starting Google HEAD test...');
    
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Google HEAD timeout triggered');
        controller.abort();
      }, 5000);

      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - start;
      
      console.log(`✅ Google HEAD succeeded in ${duration}ms`);
      setResult(`✅ Google: ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`❌ Google HEAD failed after ${duration}ms:`, error.name, error.message);
      console.log('   Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 200)
      });
      setResult(`❌ Google failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testMultipleUrls = async () => {
    setIsRunning(true);
    setResult('Testing multiple URLs...');
    console.log('🔍 Starting multiple URL test...');
    
    const urls = [
      'https://httpbin.org/get',
      'https://jsonplaceholder.typicode.com/posts/1',
      'https://api.github.com',
      'https://www.apple.com'
    ];
    
    for (const url of urls) {
      try {
        console.log(`📡 Testing ${url}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`⏰ ${url} timeout`);
          controller.abort();
        }, 3000);

        const start = Date.now();
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const duration = Date.now() - start;
        console.log(`✅ ${url} succeeded in ${duration}ms`);
        
      } catch (error) {
        console.log(`❌ ${url} failed:`, error.name, error.message);
      }
    }
    
    setResult('Multiple URL test completed - check console');
    setIsRunning(false);
  };

  const testConsoleOnly = () => {
    console.log('🔍 Console test - this should appear immediately');
    console.log('📱 Device info:', {
      userAgent: navigator.userAgent || 'Not available',
      platform: navigator.platform || 'Not available'
    });
    setResult('Console test completed - check logs');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minimal Network Test</Text>
      
      <Text style={styles.result}>{result}</Text>
      
      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonDisabled]}
        onPress={testConsoleOnly}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>Test Console Only</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonDisabled]}
        onPress={testBasicFetch}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'Testing...' : 'Test Basic Fetch (3s timeout)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonDisabled]}
        onPress={testGoogleHead}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'Testing...' : 'Test Google HEAD (5s timeout)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonDisabled]}
        onPress={testMultipleUrls}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'Testing...' : 'Test Multiple URLs'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  result: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
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
});

export default MinimalNetworkTest;