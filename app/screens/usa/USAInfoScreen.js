import React from 'react';
import PropTypes from 'prop-types';
import { EntryInfoScreenTemplate } from '../../templates';
import { usaInfoScreenConfig } from '../../config/destinations/usa/infoScreenConfig';

const USAInfoScreen = ({ navigation, route }) => (
  <EntryInfoScreenTemplate
    config={usaInfoScreenConfig}
    navigation={navigation}
    route={route}
  />
);

USAInfoScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default USAInfoScreen;
