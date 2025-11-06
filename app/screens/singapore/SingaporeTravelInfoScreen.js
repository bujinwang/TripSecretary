import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { singaporeComprehensiveTravelInfoConfig } from '../../config/destinations/singapore/comprehensiveTravelInfoConfig';

const SingaporeTravelInfoScreen = ({ navigation, route }) => (
  <EnhancedTravelInfoTemplate
    config={singaporeComprehensiveTravelInfoConfig}
    navigation={navigation}
    route={route}
  />
);

export default SingaporeTravelInfoScreen;
