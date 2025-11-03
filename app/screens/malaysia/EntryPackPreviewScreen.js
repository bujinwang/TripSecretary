/**
 * Malaysia Entry Pack Preview Screen
 * Refactored to use the shared EntryPackPreviewTemplate.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EntryPackPreviewTemplate } from '../../templates';
import { malaysiaEntryPackPreviewConfig } from '../../config/destinations/malaysia/entryPackPreviewConfig';

const MalaysiaEntryPackPreviewScreen = ({ navigation, route }) => (
  <EntryPackPreviewTemplate
    config={malaysiaEntryPackPreviewConfig}
    navigation={navigation}
    route={route}
  >
    <EntryPackPreviewTemplate.AutoContent />
  </EntryPackPreviewTemplate>
);

MalaysiaEntryPackPreviewScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default MalaysiaEntryPackPreviewScreen;
