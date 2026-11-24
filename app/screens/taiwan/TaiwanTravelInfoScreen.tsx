import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { taiwanComprehensiveTravelInfoConfig } from '../../config/destinations/taiwan/comprehensiveTravelInfoConfig';

interface TaiwanTravelInfoScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const TaiwanTravelInfoScreen = ({ navigation, route }: TaiwanTravelInfoScreenProps) => (
  <EnhancedTravelInfoTemplate config={taiwanComprehensiveTravelInfoConfig} navigation={navigation} route={route} />
);

export default TaiwanTravelInfoScreen;
