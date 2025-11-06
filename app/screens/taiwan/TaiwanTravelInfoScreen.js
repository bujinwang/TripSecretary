import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate.v2';
import { taiwanComprehensiveTravelInfoConfig } from '../../config/destinations/taiwan/comprehensiveTravelInfoConfig';

const TaiwanTravelInfoScreen = ({ navigation, route }) => (
  <EnhancedTravelInfoTemplate
    config={taiwanComprehensiveTravelInfoConfig}
    navigation={navigation}
    route={route}
  />
);

export default TaiwanTravelInfoScreen;
