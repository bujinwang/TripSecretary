import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate'
import { chinaComprehensiveTravelInfoConfig } from '../../config/destinations/china/comprehensiveTravelInfoConfig'
import { useLocale } from '../../i18n/LocaleContext'

const ChinaTravelInfoScreen = ({ navigation, route }) => {
  const { language, setLanguage } = useLocale()
  useEffect(() => {
    const prev = language
    setLanguage('zh-CN')
    return () => setLanguage(prev)
  }, [])
  return (
    <EnhancedTravelInfoTemplate
      config={chinaComprehensiveTravelInfoConfig}
      navigation={navigation}
      route={route}
    />
  )
}

ChinaTravelInfoScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,
}

export default ChinaTravelInfoScreen