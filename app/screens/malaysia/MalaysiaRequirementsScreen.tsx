import React from 'react';
import PropTypes from 'prop-types';
import { EntryRequirementsTemplate } from '../../templates';
import { malaysiaRequirementsScreenConfig } from '../../config/destinations/malaysia/requirementsScreenConfig';

const MalaysiaRequirementsScreen = ({ navigation, route }) => (
  <EntryRequirementsTemplate
    config={malaysiaRequirementsScreenConfig}
    navigation={navigation}
    route={route}
  />
);

MalaysiaRequirementsScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default MalaysiaRequirementsScreen;
