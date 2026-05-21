import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { singaporeEntryFlowConfig } from '../../config/destinations/singapore/entryFlowConfig';
import type { EntryFlowConfig } from '../../config/destinations/types';

interface SingaporeEntryFlowScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const SingaporeEntryFlowScreen = ({ navigation, route }: SingaporeEntryFlowScreenProps) => (
  <EntryFlowScreenTemplate config={singaporeEntryFlowConfig as EntryFlowConfig} navigation={navigation} route={route}>
    <EntryFlowScreenTemplate.Header />
    <EntryFlowScreenTemplate.StatusBanner />
    <EntryFlowScreenTemplate.AutoContent />
  </EntryFlowScreenTemplate>
);

export default SingaporeEntryFlowScreen;
