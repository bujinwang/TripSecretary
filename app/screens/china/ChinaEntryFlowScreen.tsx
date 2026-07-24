import React, { useEffect } from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { chinaEntryFlowConfig } from '../../config/destinations/china/entryFlowConfig';
import type { EntryFlowConfig } from '../../config/destinations/types';
import { useLocale } from '../../i18n/LocaleContext';

interface ChinaEntryFlowScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const ChinaEntryFlowScreen = ({ navigation, route }: ChinaEntryFlowScreenProps) => {
  const { language, setLanguage } = useLocale();
  useEffect(() => {
    const prev = language;
    setLanguage('zh-CN');
    return () => setLanguage(prev);
  }, []);
  return (
    <EntryFlowScreenTemplate config={chinaEntryFlowConfig as EntryFlowConfig} route={route} navigation={navigation}>
      <EntryFlowScreenTemplate.Header />
      <EntryFlowScreenTemplate.StatusBanner />
      <EntryFlowScreenTemplate.AutoContent />
    </EntryFlowScreenTemplate>
  );
};

export default ChinaEntryFlowScreen;
