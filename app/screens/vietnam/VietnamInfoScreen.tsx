import React from 'react';
import { EntryInfoScreenTemplate } from '../../templates';
import { vietnamInfoScreenConfig } from '../../config/destinations/vietnam/infoScreenConfig';
import type { InfoScreenConfig } from '../../config/destinations/types';

interface VietnamInfoScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const VietnamInfoScreen = ({ navigation, route }: VietnamInfoScreenProps) => (
  <EntryInfoScreenTemplate config={vietnamInfoScreenConfig as InfoScreenConfig} navigation={navigation} route={route} />
);

export default VietnamInfoScreen;
