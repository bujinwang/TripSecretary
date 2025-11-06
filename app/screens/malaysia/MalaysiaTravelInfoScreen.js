import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { malaysiaComprehensiveTravelInfoConfig } from '../../config/destinations/malaysia/comprehensiveTravelInfoConfig';

const MalaysiaTravelInfoScreen = ({ navigation, route }) => (
  <EnhancedTravelInfoTemplate
    config={malaysiaComprehensiveTravelInfoConfig}
    navigation={navigation}
    route={route}
  />
);

export default MalaysiaTravelInfoScreen;
