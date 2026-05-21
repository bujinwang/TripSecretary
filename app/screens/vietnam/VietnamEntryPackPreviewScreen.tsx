/**
 * Vietnam Entry Pack Preview Screen
 * Refactored to use EntryPackPreviewTemplate.
 */
import React from 'react';
import { EntryPackPreviewTemplate } from '../../templates';
import { vietnamEntryPackPreviewConfig } from '../../config/destinations/vietnam/entryPackPreviewConfig';

interface VietnamEntryPackPreviewScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const VietnamEntryPackPreviewScreen = ({ navigation, route }: VietnamEntryPackPreviewScreenProps) => (
  <EntryPackPreviewTemplate config={vietnamEntryPackPreviewConfig} navigation={navigation} route={route}>
    <EntryPackPreviewTemplate.AutoContent />
  </EntryPackPreviewTemplate>
);

export default VietnamEntryPackPreviewScreen;
