/**
 * Vietnam Entry Pack Preview Screen
 * Refactored to use EntryPackPreviewTemplate.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EntryPackPreviewTemplate } from '../../templates';
import { vietnamEntryPackPreviewConfig } from '../../config/destinations/vietnam/entryPackPreviewConfig';

const VietnamEntryPackPreviewScreen = ({ navigation, route }) => (
  <EntryPackPreviewTemplate
    config={vietnamEntryPackPreviewConfig}
    navigation={navigation}
    route={route}
  >
    <EntryPackPreviewTemplate.AutoContent />
  </EntryPackPreviewTemplate>
);

VietnamEntryPackPreviewScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default VietnamEntryPackPreviewScreen;
