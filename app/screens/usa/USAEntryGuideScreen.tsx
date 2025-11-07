/**
 * US Entry Guide Screen
 * Provides step-by-step guidance for US entry process
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EntryGuideTemplate } from '../../templates';
import { usaEntryGuide } from '../../config/entryGuide/usa';

const USAEntryGuideScreen = ({ navigation, route }) => (
  <EntryGuideTemplate
    config={usaEntryGuide}
    navigation={navigation}
    route={route}
  >
    <EntryGuideTemplate.Header
      titleEn="US Entry Guide"
      titleZh="美国入境指引"
    />
    <EntryGuideTemplate.AutoContent />
  </EntryGuideTemplate>
);

USAEntryGuideScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default USAEntryGuideScreen;

