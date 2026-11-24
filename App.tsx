// 入境通 - Main App Entry
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, Platform } from 'react-native';
import AppNavigator from './app/navigation/AppNavigator';
import { LocaleProvider } from './app/i18n/LocaleContext';
import { TamaguiProvider, Theme } from 'tamagui';
import tamaguiConfig from './tamagui.config';
import { NotificationService } from './app/services/notification';
import BackgroundJobService from './app/services/background/BackgroundJobService';
import DataSyncService from './app/services/DataSyncService';
import BiometricAuthService from './app/services/security/BiometricAuthService';
import OfflineQueueService from './app/services/offline/OfflineQueueService';
import OfflineIndicator from './app/components/offline/OfflineIndicator';

export default function App(): React.JSX.Element {
  const navigationRef = useRef<any>(null);
  const appState = useRef<string>(AppState.currentState);

  useEffect(() => {
    // Initialize services when app starts
    const initializeServices = async (): Promise<void> => {
      try {
        // Initialize notification service with iOS 18.5 simulator protection
        if (Platform.OS === 'ios' && __DEV__) {
          console.log('Skipping notification initialization in iOS simulator to prevent crash');
          // Set navigation reference for deep link handling
          NotificationService.setNavigationRef(navigationRef);
        } else {
          const permissionStatus = await NotificationService.initialize();
          console.log('Notification service initialized:', permissionStatus);
          
          // Set navigation reference for deep link handling
          NotificationService.setNavigationRef(navigationRef);
        }
        
        // Start background job service for automatic archival
        await BackgroundJobService.start();
        console.log('Background job service started');

        // Check for data updates
        await DataSyncService.checkForUpdates();

        // Initialize offline queue service
        await OfflineQueueService.initialize();
        console.log('Offline queue service initialized');
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initializeServices();

    // Handle app state changes for pending deep links and biometric lock
    const handleAppStateChange = (nextAppState: string): void => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground, check for pending deep links
        console.log('App became active, checking for pending notification deep links');
        NotificationService.handlePendingDeepLink();

        // Check biometric app-lock
        checkBiometricLock();
      }
      appState.current = nextAppState;
    };

    // Biometric app-lock: require authentication when app returns to foreground
    const checkBiometricLock = async (): Promise<void> => {
      try {
        const settings = await BiometricAuthService.getBiometricSettings();
        if (settings.enabled) {
          console.log('Biometric lock enabled, requesting authentication');
          await BiometricAuthService.authenticate({
            promptMessage: 'Verify your identity to access 入境通',
            cancelLabel: 'Cancel',
            fallbackLabel: 'Use Passcode',
          });
        }
      } catch (error) {
        console.error('Biometric lock check failed:', error);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup services when app unmounts
    return () => {
      NotificationService.cleanup();
      BackgroundJobService.stop();
      OfflineQueueService.cleanup();
      subscription?.remove();
    };
  }, []);

  // Handle navigation ready event
  const onNavigationReady = (): void => {
    console.log('Navigation ready, checking for pending notification deep links');
    NotificationService.handlePendingDeepLink();
  };

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <Theme name="light">
        <LocaleProvider>
          <StatusBar style="dark" />
          <OfflineIndicator />
          <AppNavigator ref={navigationRef} />
        </LocaleProvider>
      </Theme>
    </TamaguiProvider>
  );
}