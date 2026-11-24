/**
 * Vietnam Entry Flow Screen - Template-Based Implementation
 */
import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { vietnamEntryFlowConfig } from '../../config/destinations/vietnam/entryFlowConfig';
import type { EntryFlowConfig } from '../../config/destinations/types';

interface VietnamEntryFlowScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const VietnamEntryFlowScreen = ({ navigation, route }: VietnamEntryFlowScreenProps) => (
  <EntryFlowScreenTemplate config={vietnamEntryFlowConfig as EntryFlowConfig} route={route} navigation={navigation}>
    <EntryFlowScreenTemplate.Header />
    <EntryFlowScreenTemplate.StatusBanner />
    <EntryFlowScreenTemplate.AutoContent />
  </EntryFlowScreenTemplate>
);

export default VietnamEntryFlowScreen;
