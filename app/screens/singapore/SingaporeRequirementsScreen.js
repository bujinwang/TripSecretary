import React from 'react';
import PropTypes from 'prop-types';
import { EntryRequirementsTemplate } from '../../templates';
import { singaporeRequirementsScreenConfig } from '../../config/destinations/singapore/requirementsScreenConfig';

const SingaporeRequirementsScreen = ({ navigation, route }) => (
  <EntryRequirementsTemplate
    config={singaporeRequirementsScreenConfig}
    navigation={navigation}
    route={route}
  />
);

SingaporeRequirementsScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default SingaporeRequirementsScreen;
