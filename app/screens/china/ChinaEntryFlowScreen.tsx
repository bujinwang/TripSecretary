import React, { useEffect } from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { chinaEntryFlowConfig } from '../../config/destinations/china/entryFlowConfig';
import { useLocale } from '../../i18n/LocaleContext';

const ChinaEntryFlowScreen = ({ navigation, route }) => {
  const { language, setLanguage } = useLocale();
  useEffect(() => {
    const prev = language;
    setLanguage('zh-CN');
    return () => setLanguage(prev);
  }, []);
  return (
    <EntryFlowScreenTemplate config={chinaEntryFlowConfig} route={route} navigation={navigation}>
      <EntryFlowScreenTemplate.Header />
      <EntryFlowScreenTemplate.StatusBanner />
      <EntryFlowScreenTemplate.AutoContent />
    </EntryFlowScreenTemplate>
  );
};

export default ChinaEntryFlowScreen;