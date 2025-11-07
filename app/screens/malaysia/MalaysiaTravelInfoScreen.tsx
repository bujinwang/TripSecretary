import React from 'react';
import PropTypes from 'prop-types';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { malaysiaComprehensiveTravelInfoConfig } from '../../config/destinations/malaysia/comprehensiveTravelInfoConfig';

const MalaysiaTravelInfoScreen = ({ navigation, route }) => (
  <EnhancedTravelInfoTemplate
    config={malaysiaComprehensiveTravelInfoConfig}
    navigation={navigation}
    route={route}
  />
);

MalaysiaTravelInfoScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,
};

export default MalaysiaTravelInfoScreen;
