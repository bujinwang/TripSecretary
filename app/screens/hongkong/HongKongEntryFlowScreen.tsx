import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { hongkongEntryFlowConfig } from '../../config/destinations/hongkong/entryFlowConfig';
import type { EntryFlowConfig } from '../../config/destinations/types';

interface HongKongEntryFlowScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const HongKongEntryFlowScreen = ({ navigation, route }: HongKongEntryFlowScreenProps) => (
  <EntryFlowScreenTemplate config={hongkongEntryFlowConfig as EntryFlowConfig} navigation={navigation} route={route}>
    <EntryFlowScreenTemplate.Header />
    <EntryFlowScreenTemplate.StatusBanner />
    <EntryFlowScreenTemplate.AutoContent />
  </EntryFlowScreenTemplate>
);

export default HongKongEntryFlowScreen;
