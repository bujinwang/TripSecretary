import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConnectivityTestRunner from '../../components/ConnectivityTestRunner';
import SimpleTDACTest from '../../components/SimpleTDACTest';

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
          <Text style={styles.sectionTitle}>📱 iOS 18.5+ Update:</Text>
          <Text style={styles.bulletPoint}>• Simulator networking issues resolved</Text>
          <Text style={styles.bulletPoint}>• Both fetch and axios now work properly</Text>
          <Text style={styles.bulletPoint}>• Consistent behavior across all environments</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 What This Tests:</Text>
          <Text style={styles.bulletPoint}>• Basic TDAC API connectivity</Text>
          <Text style={styles.bulletPoint}>• Network timeout handling</Text>
          <Text style={styles.bulletPoint}>• Fetch vs Axios performance comparison</Text>
          <Text style={styles.bulletPoint}>• General network debugging</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Expected Results (iOS 18.5+):</Text>
          <Text style={styles.bulletPoint}>• Both fetch and axios should work</Text>
          <Text style={styles.bulletPoint}>• Response times should be ~3-5s</Text>
          <Text style={styles.bulletPoint}>• No timeout errors in simulator</Text>
          <Text style={styles.bulletPoint}>• Consistent cross-platform behavior</Text>
        </View>

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