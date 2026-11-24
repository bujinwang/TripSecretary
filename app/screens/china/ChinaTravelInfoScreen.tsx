import React, { useEffect } from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { chinaComprehensiveTravelInfoConfig } from '../../config/destinations/china/comprehensiveTravelInfoConfig';
import { useLocale } from '../../i18n/LocaleContext';

interface ChinaTravelInfoScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const ChinaTravelInfoScreen = ({ navigation, route }: ChinaTravelInfoScreenProps) => {
  const { language, setLanguage } = useLocale();
  useEffect(() => {
    const prev = language;
    setLanguage('zh-CN');
    return () => setLanguage(prev);
  }, []);
  return (
    <EnhancedTravelInfoTemplate config={chinaComprehensiveTravelInfoConfig} navigation={navigation} route={route} />
  );
};

export default ChinaTravelInfoScreen;
