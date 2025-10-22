
// 入境通 - Main App Entry
import './app/utils/AbortSignalPolyfill';
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, Platform } from 'react-native';
import AppNavigator from './app/navigation/AppNavigator';
import { LocaleProvider } from './app/i18n/LocaleContext';
import { NotificationService } from './app/services/notification';
import BackgroundJobService from './app/services/background/BackgroundJobService';
import DataSyncService from './app/services/DataSyncService';

export default function App() {
  const navigationRef = useRef();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Initialize services when app starts
    const initializeServices = async () => {
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
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initializeServices();

    // Handle app state changes for pending deep links
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground, check for pending deep links
        console.log('App became active, checking for pending notification deep links');
        NotificationService.handlePendingDeepLink();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup services when app unmounts
    return () => {
      NotificationService.cleanup();
      BackgroundJobService.stop();
      subscription?.remove();
    };
  }, []);

  // Handle navigation ready event
  const onNavigationReady = () => {
    console.log('Navigation ready, checking for pending notification deep links');
    NotificationService.handlePendingDeepLink();
  };

  return (
    <LocaleProvider>
      <StatusBar style="dark" />
      <AppNavigator 
        ref={navigationRef}
        onReady={onNavigationReady}
      />
    </LocaleProvider>
  );
}
