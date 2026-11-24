import React from 'react';
import { EntryPackPreviewTemplate } from '../../templates';
import { usaEntryPackPreviewConfig } from '../../config/destinations/usa/entryPackPreviewConfig';

interface USEntryPackPreviewScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const USEntryPackPreviewScreen = ({ navigation, route }: USEntryPackPreviewScreenProps) => (
  <EntryPackPreviewTemplate config={usaEntryPackPreviewConfig} navigation={navigation} route={route}>
    <EntryPackPreviewTemplate.AutoContent />
  </EntryPackPreviewTemplate>
);

export default USEntryPackPreviewScreen;
