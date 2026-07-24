import React from 'react';
import { EntryInfoScreenTemplate } from '../../templates';
import { koreaInfoScreenConfig } from '../../config/destinations/korea/infoScreenConfig';
import type { InfoScreenConfig } from '../../config/destinations/types';

interface KoreaInfoScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const KoreaInfoScreen = ({ navigation, route }: KoreaInfoScreenProps) => (
  <EntryInfoScreenTemplate
    config={koreaInfoScreenConfig as InfoScreenConfig}
    navigation={navigation}
    route={route}
  />
);

export default KoreaInfoScreen;
