import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { usaComprehensiveTravelInfoConfig } from '../../config/destinations/usa/comprehensiveTravelInfoConfig';

const USTravelInfoScreen = ({ navigation, route }) => (
  <EnhancedTravelInfoTemplate
    config={usaComprehensiveTravelInfoConfig}
    navigation={navigation}
    route={route}
  />
);

export default USTravelInfoScreen;
