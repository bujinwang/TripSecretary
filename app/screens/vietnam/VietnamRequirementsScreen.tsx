import React from 'react';
import PropTypes from 'prop-types';
import { EntryRequirementsTemplate } from '../../templates';
import { vietnamRequirementsScreenConfig } from '../../config/destinations/vietnam/requirementsScreenConfig';

const VietnamRequirementsScreen = ({ navigation, route }) => (
  <EntryRequirementsTemplate
    config={vietnamRequirementsScreenConfig}
    navigation={navigation}
    route={route}
  />
);

VietnamRequirementsScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default VietnamRequirementsScreen;
