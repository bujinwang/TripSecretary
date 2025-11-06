import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { japanEntryFlowConfig } from '../../config/destinations/japan/entryFlowConfig';

const JapanEntryFlowScreen = ({ navigation, route }) => (
  <EntryFlowScreenTemplate
    config={japanEntryFlowConfig}
    navigation={navigation}
    route={route}
  >
    <EntryFlowScreenTemplate.Header />
    <EntryFlowScreenTemplate.StatusBanner />
    <EntryFlowScreenTemplate.AutoContent />
  </EntryFlowScreenTemplate>
);

export default JapanEntryFlowScreen;
