import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { japanComprehensiveTravelInfoConfig } from '../../config/destinations/japan/comprehensiveTravelInfoConfig';

const JapanTravelInfoScreen = ({ navigation, route }) => (
  <EnhancedTravelInfoTemplate
    config={japanComprehensiveTravelInfoConfig}
    navigation={navigation}
    route={route}
  />
);

export default JapanTravelInfoScreen;
