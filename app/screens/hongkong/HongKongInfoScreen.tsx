import React from 'react';
import { EntryInfoScreenTemplate } from '../../templates';
import { hongkongInfoScreenConfig } from '../../config/destinations/hongkong/infoScreenConfig';
import type { InfoScreenConfig } from '../../config/destinations/types';

interface HongKongInfoScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const HongKongInfoScreen = ({ navigation, route }: HongKongInfoScreenProps) => (
  <EntryInfoScreenTemplate config={hongkongInfoScreenConfig as InfoScreenConfig} navigation={navigation} route={route} />
);

export default HongKongInfoScreen;
