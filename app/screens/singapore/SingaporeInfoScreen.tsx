import React from 'react';
import { EntryInfoScreenTemplate } from '../../templates';
import { singaporeInfoScreenConfig } from '../../config/destinations/singapore/infoScreenConfig';
import type { InfoScreenConfig } from '../../config/destinations/types';

interface SingaporeInfoScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const SingaporeInfoScreen = ({ navigation, route }: SingaporeInfoScreenProps) => (
  <EntryInfoScreenTemplate config={singaporeInfoScreenConfig as InfoScreenConfig} navigation={navigation} route={route} />
);

export default SingaporeInfoScreen;
