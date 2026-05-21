import React from 'react';
import { EntryPackPreviewTemplate } from '../../templates';
import { koreaEntryPackPreviewConfig } from '../../config/destinations/korea/entryPackPreviewConfig';

interface KoreaEntryPackPreviewScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const KoreaEntryPackPreviewScreen = ({ navigation, route }: KoreaEntryPackPreviewScreenProps) => (
  <EntryPackPreviewTemplate
    config={koreaEntryPackPreviewConfig}
    navigation={navigation}
    route={route}
  >
    <EntryPackPreviewTemplate.AutoContent />
  </EntryPackPreviewTemplate>
);

export default KoreaEntryPackPreviewScreen;
