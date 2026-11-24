/**
 * Thailand Entry Flow Screen - Template Implementation
 */
import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { thailandEntryFlowConfig } from '../../config/destinations/thailand/entryFlowConfig';
import type { EntryFlowConfig } from '../../config/destinations/types';

interface ThailandEntryFlowScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const ThailandEntryFlowScreen = ({ navigation, route }: ThailandEntryFlowScreenProps) => (
  <EntryFlowScreenTemplate config={thailandEntryFlowConfig as EntryFlowConfig} navigation={navigation} route={route}>
    <EntryFlowScreenTemplate.Header />
    <EntryFlowScreenTemplate.StatusBanner />
    <EntryFlowScreenTemplate.AutoContent />
  </EntryFlowScreenTemplate>
);

export default ThailandEntryFlowScreen;
