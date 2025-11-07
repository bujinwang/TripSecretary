import React from 'react';
import PropTypes from 'prop-types';
import { EntryInfoScreenTemplate } from '../../templates';
import { singaporeInfoScreenConfig } from '../../config/destinations/singapore/infoScreenConfig';

const SingaporeInfoScreen = ({ navigation, route }) => (
  <EntryInfoScreenTemplate
    config={singaporeInfoScreenConfig}
    navigation={navigation}
    route={route}
  />
);

SingaporeInfoScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default SingaporeInfoScreen;
