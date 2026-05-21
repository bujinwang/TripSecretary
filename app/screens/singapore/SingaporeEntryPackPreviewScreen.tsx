/**
 * Singapore Entry Pack Preview Screen
 * Refactored to use the shared EntryPackPreviewTemplate.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EntryPackPreviewTemplate } from '../../templates';
import { singaporeEntryPackPreviewConfig } from '../../config/destinations/singapore/entryPackPreviewConfig';

const SingaporeEntryPackPreviewScreen = ({ navigation, route }) => (
  <EntryPackPreviewTemplate
    config={singaporeEntryPackPreviewConfig}
    navigation={navigation}
    route={route}
  >
    <EntryPackPreviewTemplate.AutoContent />
  </EntryPackPreviewTemplate>
);

SingaporeEntryPackPreviewScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default SingaporeEntryPackPreviewScreen;
