import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { malaysiaEntryFlowConfig } from '../../config/destinations/malaysia/entryFlowConfig';

const MalaysiaEntryFlowScreen = ({ navigation, route }) => (
  <EntryFlowScreenTemplate
    config={malaysiaEntryFlowConfig}
    navigation={navigation}
    route={route}
  >
    <EntryFlowScreenTemplate.Header />
    <EntryFlowScreenTemplate.StatusBanner />
    <EntryFlowScreenTemplate.AutoContent />
  </EntryFlowScreenTemplate>
);

export default MalaysiaEntryFlowScreen;
