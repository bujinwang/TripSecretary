import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { singaporeEntryFlowConfig } from '../../config/destinations/singapore/entryFlowConfig';

const SingaporeEntryFlowScreen = ({ navigation, route }) => (
  <EntryFlowScreenTemplate
    config={singaporeEntryFlowConfig}
    navigation={navigation}
    route={route}
  >
    <EntryFlowScreenTemplate.Header />
    <EntryFlowScreenTemplate.StatusBanner />
    <EntryFlowScreenTemplate.AutoContent />
  </EntryFlowScreenTemplate>
);

export default SingaporeEntryFlowScreen;
