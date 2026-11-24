import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { usaComprehensiveTravelInfoConfig } from '../../config/destinations/usa/comprehensiveTravelInfoConfig';

interface USTravelInfoScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const USTravelInfoScreen = ({ navigation, route }: USTravelInfoScreenProps) => (
  <EnhancedTravelInfoTemplate config={usaComprehensiveTravelInfoConfig} navigation={navigation} route={route} />
);

export default USTravelInfoScreen;
