/**
 * useTDACWebView Hook
 *
 * Manages TDAC WebView state and message handling
 * Consolidates loading state, modals, and WebView communication
 */

import { useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import LanguageSelectorService from '../../services/tdac/LanguageSelectorService';
import ArrivalCardButtonService from '../../services/tdac/ArrivalCardButtonService';
import { getPreferredLanguage } from '../../utils/tdac/languageDetection';
import LoggingService from '../../services/LoggingService';

const logger = LoggingService.for('useTDACWebView');

/**
 * Custom hook for TDAC WebView functionality
 *
 * @param {Object} options - Hook options
 * @param {Object} options.travelerInfo - Traveler information
 * @param {Object} options.passport - Passport information
 * @param {Function} options.onQRCodeDetected - Callback when QR code is detected
 * @returns {Object} WebView state and handlers
 */
const useTDACWebView = ({ travelerInfo, passport, onQRCodeDetected }) => {
  const webViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCloudflareReminder, setShowCloudflareReminder] = useState(false);
  const [showVisualMask, setShowVisualMask] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [languageSelectionTriggered, setLanguageSelectionTriggered] = useState(false);

  /**
   * Handle messages from WebView
   */
  const handleWebViewMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      logger.debug('WebView message received', { type: message.type });

      switch (message.type) {
        case 'debug_log':
          logger.debug('WebView log', { message: message.message });
          break;

        case 'error':
          logger.error('WebView error', { message: message.message });
          break;

        case 'language_selected':
          logger.success('Language selected', { language: message.language });
          setSelectedLanguage(message.language);
          setShowVisualMask(false);

          // Auto-click Arrival Card button after language selection
          setTimeout(() => {
            autoClickArrivalCard();
          }, 1500);
          break;

        case 'arrival_card_clicked':
          logger.success('Arrival Card button clicked');
          setShowVisualMask(false);
          break;

        case 'qr_code_detected':
          logger.success('QR code detected', {
            hasUri: !!message.qrUri,
            hasCardNo: !!message.arrCardNo
          });

          if (onQRCodeDetected) {
            onQRCodeDetected(message);
          }
          break;

        case 'cloudflare_detected':
          logger.warn('Cloudflare challenge detected');
          setShowCloudflareReminder(true);
          setShowVisualMask(true);
          break;

        default:
          logger.debug('Unknown message type', { type: message.type });
      }
    } catch (error) {
      logger.error('Failed to parse WebView message', { error });
    }
  }, [onQRCodeDetected]);

  /**
   * Handle WebView load complete
   */
  const handleLoadEnd = useCallback(() => {
    logger.debug('WebView load complete');
    setIsLoading(false);
    setShowVisualMask(true);

    // Auto-select language after a short delay
    setTimeout(() => {
      if (!languageSelectionTriggered) {
        autoSelectLanguage();
        setLanguageSelectionTriggered(true);
      }
    }, 2000);
  }, [languageSelectionTriggered]);

  /**
   * Auto-select language in WebView
   */
  const autoSelectLanguage = useCallback(() => {
    if (!webViewRef.current) {
      logger.warn('Cannot auto-select language: WebView ref not available');
      return;
    }

    const preferredLanguage = getPreferredLanguage(travelerInfo, passport);
    logger.info('Auto-selecting language', { preferredLanguage });

    const jsCode = LanguageSelectorService.generateLanguageSelectionScript(preferredLanguage);
    webViewRef.current.injectJavaScript(jsCode);
  }, [travelerInfo, passport]);

  /**
   * Auto-click Arrival Card button
   */
  const autoClickArrivalCard = useCallback(() => {
    if (!webViewRef.current) {
      logger.warn('Cannot auto-click Arrival Card: WebView ref not available');
      return;
    }

    logger.info('Auto-clicking Arrival Card button');

    const jsCode = ArrivalCardButtonService.generateArrivalCardClickScript();
    webViewRef.current.injectJavaScript(jsCode);
  }, []);

  /**
   * Handle navigation state change
   */
  const handleNavigationStateChange = useCallback((navState) => {
    logger.debug('Navigation state changed', {
      url: navState.url,
      loading: navState.loading
    });

    // Reset visual mask when navigation starts
    if (navState.loading) {
      setShowVisualMask(true);
    }
  }, []);

  /**
   * Handle WebView error
   */
  const handleError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    logger.error('WebView error', {
      description: nativeEvent.description,
      code: nativeEvent.code
    });

    Alert.alert(
      'WebView Error',
      `Failed to load page: ${nativeEvent.description}`,
      [{ text: 'OK' }]
    );
  }, []);

  /**
   * Reload WebView
   */
  const reload = useCallback(() => {
    if (webViewRef.current) {
      logger.info('Reloading WebView');
      webViewRef.current.reload();
      setLanguageSelectionTriggered(false);
    }
  }, []);

  return {
    // Refs
    webViewRef,

    // State
    isLoading,
    showCloudflareReminder,
    showVisualMask,
    selectedLanguage,
    languageSelectionTriggered,

    // Setters
    setShowCloudflareReminder,
    setShowVisualMask,

    // Handlers
    handleWebViewMessage,
    handleLoadEnd,
    handleNavigationStateChange,
    handleError,

    // Actions
    autoSelectLanguage,
    autoClickArrivalCard,
    reload,
  };
};

export default useTDACWebView;
