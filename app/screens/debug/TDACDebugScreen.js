import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import ConnectivityTestRunner from '../../components/ConnectivityTestRunner';
import SimpleTDACTest from '../../components/SimpleTDACTest';
import MinimalNetworkTest from '../../components/MinimalNetworkTest';
import RobustNetworkTest from '../../components/RobustNetworkTest';

const TDACDebugScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>TDAC Debug & Connectivity Tests</Text>
          <Text style={styles.subtitle}>
            Test network connectivity and TDAC API behavior in React Native environment
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 What This Tests:</Text>
          <Text style={styles.bulletPoint}>• Fetch vs Axios behavior in React Native</Text>
          <Text style={styles.bulletPoint}>• Network timeout handling</Text>
          <Text style={styles.bulletPoint}>• TDAC API connectivity</Text>
          <Text style={styles.bulletPoint}>• AbortController vs Axios timeout</Text>
          <Text style={styles.bulletPoint}>• Platform-specific networking issues</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Expected Results:</Text>
          <Text style={styles.bulletPoint}>• Fetch should work consistently</Text>
          <Text style={styles.bulletPoint}>• Axios may hang on TDAC endpoints</Text>
          <Text style={styles.bulletPoint}>• Google (control) should always work</Text>
          <Text style={styles.bulletPoint}>• Response times should be &lt;1000ms</Text>
        </View>

        <RobustNetworkTest />
        
        <View style={styles.divider} />
        
        <MinimalNetworkTest />
        
        <View style={styles.divider} />
        
        <SimpleTDACTest />
        
        <View style={styles.divider} />
        
        <ConnectivityTestRunner />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#2196F3',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    paddingLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
  },
});

export default TDACDebugScreen;