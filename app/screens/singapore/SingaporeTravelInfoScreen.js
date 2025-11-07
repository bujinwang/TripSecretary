import React from 'react';
import PropTypes from 'prop-types';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { singaporeComprehensiveTravelInfoConfig } from '../../config/destinations/singapore/comprehensiveTravelInfoConfig';

const SingaporeTravelInfoScreen = ({ navigation, route }) => (
  <EnhancedTravelInfoTemplate
    config={singaporeComprehensiveTravelInfoConfig}
    navigation={navigation}
    route={route}
  />
);

SingaporeTravelInfoScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,
};

export default SingaporeTravelInfoScreen;
