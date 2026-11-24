import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { usaEntryFlowConfig } from '../../config/destinations/usa/entryFlowConfig';
import type { EntryFlowConfig } from '../../config/destinations/types';

interface USAEntryFlowScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const USAEntryFlowScreen = ({ navigation, route }: USAEntryFlowScreenProps) => (
  <EntryFlowScreenTemplate config={usaEntryFlowConfig as EntryFlowConfig} navigation={navigation} route={route}>
    <EntryFlowScreenTemplate.Header />
    <EntryFlowScreenTemplate.StatusBanner />
    <EntryFlowScreenTemplate.AutoContent />
  </EntryFlowScreenTemplate>
);

export default USAEntryFlowScreen;
