import React from 'react';
import PropTypes from 'prop-types';
import { EntryRequirementsTemplate } from '../../templates';
import { japanRequirementsScreenConfig } from '../../config/destinations/japan/requirementsScreenConfig';

const JapanRequirementsScreen = ({ navigation, route }) => (
  <EntryRequirementsTemplate
    config={japanRequirementsScreenConfig}
    navigation={navigation}
    route={route}
  />
);

JapanRequirementsScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default JapanRequirementsScreen;
