import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { koreaEntryFlowConfig } from '../../config/destinations/korea/entryFlowConfig';
import type { EntryFlowConfig } from '../../config/destinations/types';

interface KoreaEntryFlowScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const KoreaEntryFlowScreen = ({ navigation, route }: KoreaEntryFlowScreenProps) => (
  <EntryFlowScreenTemplate
    config={koreaEntryFlowConfig as EntryFlowConfig}
    navigation={navigation}
    route={route}
  >
    <EntryFlowScreenTemplate.Header />
    <EntryFlowScreenTemplate.StatusBanner />
    <EntryFlowScreenTemplate.AutoContent />
  </EntryFlowScreenTemplate>
);

export default KoreaEntryFlowScreen;
