import React from 'react';
import { EntryInfoScreenTemplate } from '../../templates';
import { taiwanInfoScreenConfig } from '../../config/destinations/taiwan/infoScreenConfig';
import type { InfoScreenConfig } from '../../config/destinations/types';

interface TaiwanInfoScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const TaiwanInfoScreen = ({ navigation, route }: TaiwanInfoScreenProps) => (
  <EntryInfoScreenTemplate config={taiwanInfoScreenConfig as InfoScreenConfig} navigation={navigation} route={route} />
);

export default TaiwanInfoScreen;
