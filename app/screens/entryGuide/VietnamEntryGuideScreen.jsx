/**
 * Vietnam Entry Guide Screen
 * Now powered by the reusable EntryGuideTemplate.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EntryGuideTemplate } from '../../templates';
import { vietnamEntryGuide as vietnamGuideConfig } from '../../config/entryGuide/vietnam';

const VietnamEntryGuideScreen = ({ navigation, route }) => (
  <EntryGuideTemplate
    config={vietnamGuideConfig}
    navigation={navigation}
    route={route}
  >
    <EntryGuideTemplate.Header
      titleZh="越南入境指引 🇻🇳"
      titleEn="Vietnam Entry Guide 🇻🇳"
    />
    <EntryGuideTemplate.AutoContent />
  </EntryGuideTemplate>
);

VietnamEntryGuideScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default VietnamEntryGuideScreen;
