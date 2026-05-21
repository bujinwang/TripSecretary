import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { malaysiaEntryFlowConfig } from '../../config/destinations/malaysia/entryFlowConfig';
import type { EntryFlowConfig } from '../../config/destinations/types';

interface MalaysiaEntryFlowScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const MalaysiaEntryFlowScreen = ({ navigation, route }: MalaysiaEntryFlowScreenProps) => (
  <EntryFlowScreenTemplate config={malaysiaEntryFlowConfig as EntryFlowConfig} navigation={navigation} route={route}>
    <EntryFlowScreenTemplate.Header />
    <EntryFlowScreenTemplate.StatusBanner />
    <EntryFlowScreenTemplate.AutoContent />
  </EntryFlowScreenTemplate>
);

export default MalaysiaEntryFlowScreen;
