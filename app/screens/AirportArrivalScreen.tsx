// 入境通 - Airport Arrival Screen (机场到达)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme';
import UserDataService from '../services/data/UserDataService';

const AirportArrivalScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination, travelInfo } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const [currentStep, setCurrentStep] = useState(0);

  // Simulate arrival detection (in real app, this would use GPS/time)
  useEffect(() => {
    // Vibrate to get attention when arriving at airport
    Vibration.vibrate([0, 500, 200, 500]);
  }, []);

  const handleStartImmigration = () => {
    navigation.navigate('ImmigrationGuide', {
      passport,
      destination,
      travelInfo,
      currentStep: 0,
    });
  };

  const handleEmergency = () => {
    Alert.alert(
      '紧急求助',
      '需要帮助吗？我们将为您连接机场工作人员或紧急联系人。',
      [
        { text: '呼叫机场工作人员', onPress: () => {/* Implement emergency call */} },
        { text: '联系家人', onPress: () => {/* Implement family contact */} },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Emergency Button - Always visible */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={handleEmergency}
      >
        <Text style={styles.emergencyIcon}>🚨</Text>
        <Text style={styles.emergencyText}>紧急求助</Text>
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Airport Icon */}
        <View style={styles.airportIcon}>
          <Text style={styles.planeIcon}>✈️</Text>
          <Text style={styles.airportText}>已到达机场</Text>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>欢迎来到{destination?.name || '目的地'}</Text>
          <Text style={styles.welcomeSubtitle}>
            BorderBuddy将一步步指导您完成入境手续
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>📋 入境准备清单</Text>
          <View style={styles.checklist}>
            <Text style={styles.checklistItem}>✓ 护照</Text>
            <Text style={styles.checklistItem}>✓ 往返机票</Text>
            <Text style={styles.checklistItem}>✓ 酒店确认单</Text>
            <Text style={styles.checklistItem}>✓ 现金和银行卡</Text>
          </View>
        </View>

        {/* Start Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartImmigration}
          >
            <Text style={styles.startButtonIcon}>🚶‍♂️</Text>
            <Text style={styles.startButtonText}>开始入境手续</Text>
            <Text style={styles.startButtonSubtext}>跟着我一步步来</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsText}>
            💡 不用担心，我会用大字体和简单语言指导您
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryLight,
  },
  emergencyButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    backgroundColor: '#FF4444',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  emergencyIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  emergencyText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  airportIcon: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  planeIcon: {
    fontSize: 80,
    marginBottom: spacing.sm,
  },
  airportText: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 16,
    width: '100%',
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  instructionTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  checklist: {
    paddingLeft: spacing.md,
  },
  checklistItem: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  buttonSection: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
  },
  startButtonIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  startButtonText: {
    ...typography.h1,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  startButtonSubtext: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tipsSection: {
    alignItems: 'center',
  },
  tipsText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AirportArrivalScreen;
