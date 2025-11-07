import React from 'react';
import PropTypes from 'prop-types';
import { EntryRequirementsTemplate } from '../../templates';
import { usaRequirementsScreenConfig } from '../../config/destinations/usa/requirementsScreenConfig';

const USARequirementsScreen = ({ navigation, route }) => (
  <EntryRequirementsTemplate
    config={usaRequirementsScreenConfig}
    navigation={navigation}
    route={route}
  />
);

USARequirementsScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default USARequirementsScreen;
