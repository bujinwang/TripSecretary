import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { taiwanComprehensiveTravelInfoConfig } from '../../config/destinations/taiwan/comprehensiveTravelInfoConfig';

const TaiwanTravelInfoScreen = ({ navigation, route }) => (
  <EnhancedTravelInfoTemplate
    config={taiwanComprehensiveTravelInfoConfig}
    navigation={navigation}
    route={route}
  />
);

export default TaiwanTravelInfoScreen;
