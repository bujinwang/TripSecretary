import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate.v2';
import { malaysiaComprehensiveTravelInfoConfig } from '../../config/destinations/malaysia/comprehensiveTravelInfoConfig';

const MalaysiaTravelInfoScreen = ({ navigation, route }) => (
  <EnhancedTravelInfoTemplate
    config={malaysiaComprehensiveTravelInfoConfig}
    navigation={navigation}
    route={route}
  />
);

export default MalaysiaTravelInfoScreen;
