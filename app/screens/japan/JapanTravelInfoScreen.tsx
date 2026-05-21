import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { japanComprehensiveTravelInfoConfig } from '../../config/destinations/japan/comprehensiveTravelInfoConfig';

interface JapanTravelInfoScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const JapanTravelInfoScreen = ({ navigation, route }: JapanTravelInfoScreenProps) => (
  <EnhancedTravelInfoTemplate config={japanComprehensiveTravelInfoConfig} navigation={navigation} route={route} />
);

export default JapanTravelInfoScreen;
