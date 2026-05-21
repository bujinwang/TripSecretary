/**
 * Thailand Entry Pack Preview Screen
 * Powered by EntryPackPreviewTemplate with Thailand-specific config.
 */
import React from 'react';
import { EntryPackPreviewTemplate } from '../../templates';
import { thailandEntryPackPreviewConfig } from '../../config/destinations/thailand/entryPackPreviewConfig';

interface ThailandEntryPackPreviewScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const ThailandEntryPackPreviewScreen = ({ navigation, route }: ThailandEntryPackPreviewScreenProps) => (
  <EntryPackPreviewTemplate config={thailandEntryPackPreviewConfig} navigation={navigation} route={route}>
    <EntryPackPreviewTemplate.AutoContent />
  </EntryPackPreviewTemplate>
);

export default ThailandEntryPackPreviewScreen;
