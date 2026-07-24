import React from 'react';
import { EntryInfoScreenTemplate } from '../../templates';
import { malaysiaInfoScreenConfig } from '../../config/destinations/malaysia/infoScreenConfig';
import type { InfoScreenConfig } from '../../config/destinations/types';

interface MalaysiaInfoScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const MalaysiaInfoScreen = ({ navigation, route }: MalaysiaInfoScreenProps) => (
  <EntryInfoScreenTemplate config={malaysiaInfoScreenConfig as InfoScreenConfig} navigation={navigation} route={route} />
);

export default MalaysiaInfoScreen;
