import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { hongkongComprehensiveTravelInfoConfig } from '../../config/destinations/hongkong/comprehensiveTravelInfoConfig';

interface HongKongTravelInfoScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const HongKongTravelInfoScreen = ({ navigation, route }: HongKongTravelInfoScreenProps) => (
  <EnhancedTravelInfoTemplate config={hongkongComprehensiveTravelInfoConfig} navigation={navigation} route={route} />
);

export default HongKongTravelInfoScreen;
