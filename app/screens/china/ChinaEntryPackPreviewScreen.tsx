// @ts-nocheck
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { EntryPackPreviewTemplate } from '../../templates';
import chinaEntryPackPreviewConfig from '../../config/destinations/china/entryPackPreviewConfig';
import { useLocale } from '../../i18n/LocaleContext';

const ChinaEntryPackPreviewScreen = ({ navigation, route }) => {
  const { language, setLanguage } = useLocale();
  useEffect(() => {
    const prev = language;
    setLanguage('zh-CN');
    return () => setLanguage(prev);
  }, [language, setLanguage]);
  return (
    <EntryPackPreviewTemplate config={chinaEntryPackPreviewConfig} navigation={navigation} route={route}>
      <EntryPackPreviewTemplate.AutoContent />
    </EntryPackPreviewTemplate>
  );
};

ChinaEntryPackPreviewScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default ChinaEntryPackPreviewScreen;
