import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { taiwanEntryFlowConfig } from '../../config/destinations/taiwan/entryFlowConfig';
import type { EntryFlowConfig } from '../../config/destinations/types';

interface TaiwanEntryFlowScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const TaiwanEntryFlowScreen = ({ navigation, route }: TaiwanEntryFlowScreenProps) => (
  <EntryFlowScreenTemplate config={taiwanEntryFlowConfig as EntryFlowConfig} navigation={navigation} route={route}>
    <EntryFlowScreenTemplate.Header />
    <EntryFlowScreenTemplate.StatusBanner />
    <EntryFlowScreenTemplate.AutoContent />
  </EntryFlowScreenTemplate>
);

export default TaiwanEntryFlowScreen;
