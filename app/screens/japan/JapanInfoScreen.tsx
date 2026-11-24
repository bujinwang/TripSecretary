import React from 'react';
import { EntryInfoScreenTemplate } from '../../templates';
import { japanInfoScreenConfig } from '../../config/destinations/japan/infoScreenConfig';
import type { InfoScreenConfig } from '../../config/destinations/types';

interface JapanInfoScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const JapanInfoScreen = ({ navigation, route }: JapanInfoScreenProps) => (
  <EntryInfoScreenTemplate config={japanInfoScreenConfig as InfoScreenConfig} navigation={navigation} route={route} />
);

export default JapanInfoScreen;
