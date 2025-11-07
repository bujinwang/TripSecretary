/**
 * Japan Entry Guide Screen
 * Now powered by the reusable EntryGuideTemplate.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EntryGuideTemplate } from '../../templates';
import { japanEntryGuide as japanGuideConfig } from '../../config/entryGuide/japan';

const JapanEntryGuideScreen = ({ navigation, route }) => (
  <EntryGuideTemplate
    config={japanGuideConfig}
    navigation={navigation}
    route={route}
  >
    <EntryGuideTemplate.Header
      titleZh="日本入境指引 🇯🇵"
      titleEn="Japan Entry Guide 🇯🇵"
    />
    <EntryGuideTemplate.AutoContent />
  </EntryGuideTemplate>
);

JapanEntryGuideScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default JapanEntryGuideScreen;

