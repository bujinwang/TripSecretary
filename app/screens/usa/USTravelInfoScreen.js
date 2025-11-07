import React from 'react';
import PropTypes from 'prop-types';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { usaComprehensiveTravelInfoConfig } from '../../config/destinations/usa/comprehensiveTravelInfoConfig';

const USTravelInfoScreen = ({ navigation, route }) => (
  <EnhancedTravelInfoTemplate
    config={usaComprehensiveTravelInfoConfig}
    navigation={navigation}
    route={route}
  />
);

USTravelInfoScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,
};

export default USTravelInfoScreen;
