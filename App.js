// 出境通 - Main App Entry
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './app/navigation/AppNavigator';
import { LocaleProvider } from './app/i18n/LocaleContext';

export default function App() {
  return (
    <LocaleProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </LocaleProvider>
  );
}
