import React from 'react';
import { EntryInfoScreenTemplate } from '../../templates';
import { usaInfoScreenConfig } from '../../config/destinations/usa/infoScreenConfig';
import type { InfoScreenConfig } from '../../config/destinations/types';

interface USAInfoScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const USAInfoScreen = ({ navigation, route }: USAInfoScreenProps) => (
  <EntryInfoScreenTemplate config={usaInfoScreenConfig as InfoScreenConfig} navigation={navigation} route={route} />
);

export default USAInfoScreen;
