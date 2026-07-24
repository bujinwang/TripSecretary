import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { japanEntryFlowConfig } from '../../config/destinations/japan/entryFlowConfig';
import type { EntryFlowConfig } from '../../config/destinations/types';

interface JapanEntryFlowScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const JapanEntryFlowScreen = ({ navigation, route }: JapanEntryFlowScreenProps) => (
  <EntryFlowScreenTemplate config={japanEntryFlowConfig as EntryFlowConfig} navigation={navigation} route={route}>
    <EntryFlowScreenTemplate.Header />
    <EntryFlowScreenTemplate.StatusBanner />
    <EntryFlowScreenTemplate.AutoContent />
  </EntryFlowScreenTemplate>
);

export default JapanEntryFlowScreen;
