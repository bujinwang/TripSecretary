
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ScreenProps = any;
// TDAC WebView填写助手 - 浮动复制助手
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Clipboard,
  ScrollView,
  Modal,
  StatusBar,
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTranslation } from '../../i18n/LocaleContext';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../../components/BackButton';
import EntryInfoService from '../../services/EntryInfoService';
import UserDataService from '../../services/data/UserDataService';
import TDACSubmissionLogger from '../../services/tdac/TDACSubmissionLogger';
import { parsePassportName } from '../../utils/NameParser';
import { getPreferredLanguage } from '../../utils/tdac/languageDetection';
import useQRCodeHandler from '../../hooks/tdac/useQRCodeHandler';
import HelperModal from '../../components/tdac/HelperModal';
import QRCodeModal from '../../components/tdac/QRCodeModal';
import DataComparisonModal from '../../components/tdac/DataComparisonModal';
import styles from './TDACWebViewScreen.styles';
import colors from '../../theme/colors';

const TDACWebViewScreen = ({ navigation, route }) => {
  const { t } = useTranslation();

  // Support both old format (passport, destination, travelInfo) and new format (travelerInfo)
  const params = route.params || {};
  const travelerInfo = params.travelerInfo || {};

  // Convert travelerInfo to expected format
  const passport = params.passport
    ? UserDataService.toSerializablePassport(params.passport)
    : {
        passportNo: travelerInfo.passportNo,
        nameEn: travelerInfo.familyName && travelerInfo.firstName
          ? `${travelerInfo.firstName} ${travelerInfo.familyName}`.trim()
          : travelerInfo.nameEn || '',
        name: travelerInfo.nameEn || '',
        birthDate: travelerInfo.birthDate || travelerInfo.bdDate || '',
        gender: travelerInfo.gender || 'Male',
        nationality: travelerInfo.nationalityDesc || travelerInfo.nationality || 'China'
      };

  const travelInfo = params.travelInfo || {
    flightNumber: travelerInfo.flightNo || '',
    arrivalDate: travelerInfo.arrDate || travelerInfo.arrivalDate || '',
    travelPurpose: travelerInfo.traPurposeId || travelerInfo.purpose || 'Tourism',
    departureCountry: travelerInfo.countryBoardDesc || 'China',
    occupation: travelerInfo.occupation || 'Tourist',
    province: travelerInfo.accProvinceDesc || 'Bangkok',
    contactPhone: travelerInfo.phoneNo || '13800138000',
    hotelAddress: travelerInfo.accAddress || ''
  };

  const {destination} = params;

  const [showHelper, setShowHelper] = useState(false); // 控制浮动助手显示
  const [copiedField, setCopiedField] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCloudflareReminder, setShowCloudflareReminder] = useState(false);
  const [showVisualMask, setShowVisualMask] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null); // Track selected language
  const [languageSelectionTriggered, setLanguageSelectionTriggered] = useState(false);

  // Data comparison state for DEV mode
  const [showDataComparison, setShowDataComparison] = useState(__DEV__ ? false : false);
  const [comparisonData, setComparisonData] = useState(null);
  const webViewRef = useRef(null);

  // QR code handling hook
  const { qrCodeData, showQrCode, setShowQrCode, saveQRCode, saveToPhotoAlbum } = useQRCodeHandler({ passport, route });

  // Debug: Log received data
  React.useEffect(() => {
    console.log('📦 TDACWebViewScreen received data:', {
      hasTravelerInfo: !!travelerInfo && Object.keys(travelerInfo).length > 0,
      travelerInfo,
      hasPassport: !!passport,
      passport,
      hasTravelInfo: !!travelInfo,
      travelInfo,
      hasDestination: !!destination,
      destination
    });
  }, []);

  // Parse name using utility function
  const nameEn = passport?.nameEn || passport?.name || '';
  const { surname, middleName: parsedMiddleName, givenName } = parsePassportName(nameEn);

  // Fallback to travelerInfo if available
  const firstName = givenName || travelerInfo.firstName || '';
  const lastName = surname || travelerInfo.familyName || '';
  const middleName = parsedMiddleName || travelerInfo.middleName || '';

  const copyToClipboard = (text, fieldName) => {
    Clipboard.setString(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Auto-select language after Cloudflare verification
  const autoSelectLanguage = () => {
    const preferredLanguage = getPreferredLanguage(travelerInfo, passport);

    const jsCode = `
      (function() {
        try {
          // Notify React Native that the script has started
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'debug_log',
            message: '🚀 Language selection script started'
          }));

          if (window.languageSelected) {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug_log',
              message: '⚠️ Language already selected, skipping'
            }));
            return; // Already selected
          }

          const preferredLang = '${preferredLanguage}';
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'debug_log',
            message: '🌐 Auto-selecting language: ' + preferredLang
          }));
          console.log('🌐 Auto-selecting language:', preferredLang);

          // Step 1: Try to find and open the language dropdown first
          // The language dropdown is typically in the top-right corner of the page
          let dropdownOpened = false;

          // Strategy 1: Look for language selector in header/toolbar (most common location)
          const headerLanguageSelectors = document.querySelectorAll(
            'header button, header div[role="button"], ' +
            'mat-toolbar button, mat-toolbar div[role="button"], ' +
            '.toolbar button, .toolbar div[role="button"], ' +
            'nav button, nav div[role="button"]'
          );

          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'debug_log',
            message: '🔍 Found ' + headerLanguageSelectors.length + ' header elements'
          }));
          console.log('🔍 Found', headerLanguageSelectors.length, 'header elements');

          for (let trigger of headerLanguageSelectors) {
            const text = (trigger.textContent || trigger.innerText || '').trim();
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug_log',
              message: '  📝 Checking: ' + text.substring(0, 50)
            }));
            console.log('  📝 Checking header element:', text.substring(0, 50));

            // Check if this is the language selector (contains flag emoji or language name)
            if (text.includes('English') || text.includes('中文') || text.includes('日本語') ||
                text.includes('한국어') || text.includes('Русский')) {

              // Additional check: should be relatively short text (just the language name)
              if (text.length < 30) {
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'debug_log',
                  message: '🔽 Opening dropdown: ' + text
                }));
                console.log('🔽 Opening language dropdown (header):', text);
                trigger.click();
                dropdownOpened = true;
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'debug_log',
                  message: '✅ Clicked dropdown trigger'
                }));
                console.log('✅ Clicked language dropdown trigger');
                break;
              } else {
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'debug_log',
                  message: '⚠️ Text too long (' + text.length + ' chars)'
                }));
                console.log('⚠️ Text too long (', text.length, 'chars), skipping');
              }
            }
          }

          // Strategy 2: If not found in header, search more broadly
          if (!dropdownOpened) {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug_log',
              message: '⚠️ Not found in header, searching broadly...'
            }));
            console.log('⚠️ Not found in header, searching more broadly...');
            const allLanguageSelectors = document.querySelectorAll(
              'button[class*="language"], button[class*="Language"], button[class*="lang"], ' +
              'div[class*="language"], div[class*="Language"], div[class*="lang"], ' +
              '[role="button"][class*="lang"], mat-select, .mat-select'
            );

            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug_log',
              message: '🔍 Found ' + allLanguageSelectors.length + ' language-related elements'
            }));
            console.log('🔍 Found', allLanguageSelectors.length, 'language-related elements');

            for (let trigger of allLanguageSelectors) {
              const text = (trigger.textContent || trigger.innerText || '').trim();
              console.log('  📝 Checking element:', text.substring(0, 50));

              if ((text.includes('English') || text.includes('中文') || text.includes('日本語') ||
                   text.includes('한국어') || text.includes('Русский')) && text.length < 30) {

                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'debug_log',
                  message: '🔽 Opening dropdown (general): ' + text
                }));
                console.log('🔽 Opening language dropdown (general):', text);
                trigger.click();
                dropdownOpened = true;
                console.log('✅ Clicked language dropdown trigger');
                break;
              }
            }
          }

          // Strategy 3: Search ALL elements on the page (most aggressive)
          if (!dropdownOpened) {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug_log',
              message: '⚠️ Still not found, searching ALL elements...'
            }));

            // Get all clickable elements
            const allElements = document.querySelectorAll('button, a, div, span');
            let candidateCount = 0;

            for (let el of allElements) {
              const text = (el.textContent || el.innerText || '').trim();

              // Look for elements that ONLY contain a language name (very specific)
              if (text === 'English' || text === '中文' || text === '日本語' ||
                  text === '한국어' || text === 'Русский' ||
                  text.match(/^🇬🇧\\s*English$/) || text.match(/^🇨🇳\\s*中文$/)) {

                candidateCount++;
                const rect = el.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0;

                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'debug_log',
                  message: '  📍 Candidate #' + candidateCount + ': "' + text + '" (visible: ' + isVisible + ')'
                }));

                if (isVisible) {
                  window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'debug_log',
                    message: '🔽 Clicking element: ' + text
                  }));
                  el.click();
                  dropdownOpened = true;
                  break;
                }
              }
            }

            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug_log',
              message: '📊 Found ' + candidateCount + ' candidate elements total'
            }));
          }

          if (!dropdownOpened) {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug_log',
              message: '❌ Could not find language dropdown trigger!'
            }));
            console.error('❌ Could not find language dropdown trigger!');
          }

          // Step 2: After opening dropdown (or if no dropdown needed), select the language
          setTimeout(() => {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug_log',
              message: '🎯 Looking for language option: ' + preferredLang
            }));
            console.log('🎯 Looking for language option:', preferredLang);

            // Look for language options in the dropdown or page
            const languageButtons = document.querySelectorAll(
              'button, a, div[role="button"], .language-option, mat-option, .mat-option, ' +
              '[class*="lang"], [class*="Language"]'
            );

            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug_log',
              message: '🔍 Found ' + languageButtons.length + ' potential language buttons'
            }));
            console.log('🔍 Found', languageButtons.length, 'potential language buttons');
            let foundCount = 0;

            for (let btn of languageButtons) {
              const text = (btn.textContent || btn.innerText || '').trim();

              // Skip if text is too long (likely a container with all options)
              // Individual language options should be short (< 20 chars)
              if (text.length > 20) {
                continue;
              }

              // Match the preferred language - EXACT or with flag emoji
              let isMatch = false;
              if (preferredLang === 'English' && (text === 'English' || text.match(/^🇬🇧\\s*English$/))) {
                isMatch = true;
              } else if (preferredLang === '中文' && (text === '中文' || text.match(/^🇨🇳\\s*中文$/))) {
                isMatch = true;
              } else if (preferredLang === '日本語' && (text === '日本語' || text.match(/^🇯🇵\\s*日本語$/))) {
                isMatch = true;
              } else if (preferredLang === '한국어' && (text === '한국어' || text.match(/^🇰🇷\\s*한국어$/))) {
                isMatch = true;
              } else if (preferredLang === 'Русский' && (text === 'Русский' || text.match(/^🇷🇺\\s*Русский$/))) {
                isMatch = true;
              } else if (text === preferredLang) {
                isMatch = true;
              }

              if (isMatch) {
                foundCount++;
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'debug_log',
                  message: '✅ Match #' + foundCount + ': "' + text + '"'
                }));
                console.log('✅ Found matching language option #' + foundCount + ':', text);

                // Check if button is visible and not the dropdown trigger itself
                const rect = btn.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0;
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'debug_log',
                  message: '  📏 Visible: ' + isVisible + ' (w:' + rect.width + ' h:' + rect.height + ')'
                }));
                console.log('  📏 Visibility:', isVisible, '(width:', rect.width, 'height:', rect.height + ')');

                if (isVisible) {
                  window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'debug_log',
                    message: '  ✅ Visible! Selecting it...'
                  }));
                  console.log('  ✅ This option is visible, selecting it!');
                  btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

                  setTimeout(() => {
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                      type: 'debug_log',
                      message: '  🖱️ Clicking: ' + text
                    }));
                    console.log('  🖱️ Clicking language option...');
                    btn.click();
                    window.languageSelected = true;

                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                      type: 'language_selected',
                      language: preferredLang
                    }));

                    console.log('✅ Language selected:', preferredLang);

                    // After language selection, trigger Arrival Card click
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                      type: 'trigger_arrival_card_click'
                    }));
                  }, 500);

                  break;
                } else {
                  window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'debug_log',
                    message: '  ⚠️ Not visible, continuing...'
                  }));
                  console.log('  ⚠️ This option is not visible, continuing search...');
                }
              }
            }

            if (foundCount === 0) {
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'debug_log',
                message: '❌ No match found for: ' + preferredLang
              }));
              console.error('❌ Could not find any language option matching:', preferredLang);
            } else {
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'debug_log',
                message: '📊 Total matches found: ' + foundCount
              }));
            }
          }, dropdownOpened ? 800 : 200); // Wait longer if we opened a dropdown

        } catch(e) {
          console.error('Language selection error:', e);
        }
      })();
    `;

    webViewRef.current?.injectJavaScript(jsCode);
  };

  // Auto-click Arrival Card button
  const autoClickArrivalCard = () => {
    const jsCode = `
      (function() {
        try {
          if (window.arrivalCardClicked) {
            console.log('⚠️ Arrival Card already clicked, skipping');
            return;
          }

          console.log('🔍 Looking for Arrival Card button...');
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'debug_log',
            message: '🔍 Looking for Arrival Card button...'
          }));

          // Wait for page to load after language selection
          setTimeout(() => {
            // Multiple strategies to find Arrival Card button
            let arrivalCardBtn = null;

            // Strategy 1: Look for all clickable elements
            const allElements = document.querySelectorAll('button, a, div, span, mat-card, [class*="card"], [class*="Card"], [role="button"]');

            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug_log',
              message: '🔍 Scanning ' + allElements.length + ' elements for Arrival Card...'
            }));

            let candidateCount = 0;
            let bestMatch = null;
            let bestMatchScore = 0;

            for (let el of allElements) {
              const text = (el.textContent || el.innerText || '').trim();

              // Skip large containers (likely containing entire page content)
              // Individual buttons should have very concise text (< 80 chars)
              if (text.length > 80) {
                continue;
              }

              // Match arrival card in multiple languages
              let isArrivalCard = false;
              let matchScore = 0;

              // English patterns - prioritize exact matches
              if (text === 'Arrival Card') {
                isArrivalCard = true;
                matchScore = 100; // Exact match
              } else if (text.match(/^Arrival\\s*Card$/i)) {
                isArrivalCard = true;
                matchScore = 90;
              } else if (text.includes('Arrival Card')) {
                isArrivalCard = true;
                matchScore = 50;
              }

              // Chinese patterns (中文) - prioritize exact matches
              if (text === '入境卡') {
                isArrivalCard = true;
                matchScore = 100; // Exact match
              } else if (text.match(/^入境卡$/)) {
                isArrivalCard = true;
                matchScore = 90;
              } else if (text.includes('入境卡') && !text.includes('更新')) {
                // Include if it contains "入境卡" but NOT "更新" (update)
                isArrivalCard = true;
                matchScore = 60;
              } else if (text.includes('入境卡')) {
                isArrivalCard = true;
                matchScore = 40;
              }

              // Japanese patterns (日本語)
              if (text === 'アライバルカード' || text === '入国カード') {
                isArrivalCard = true;
                matchScore = 100;
              } else if (text.includes('アライバルカード') || text.includes('入国カード')) {
                isArrivalCard = true;
                matchScore = 50;
              }

              // Korean patterns (한국어)
              if (text === '입국카드' || text === '도착카드') {
                isArrivalCard = true;
                matchScore = 100;
              } else if (text.includes('입국카드') || text.includes('도착카드')) {
                isArrivalCard = true;
                matchScore = 50;
              }

              // Russian patterns (Русский)
              if (text === 'Карта прибытия') {
                isArrivalCard = true;
                matchScore = 100;
              } else if (text.includes('Карта прибытия')) {
                isArrivalCard = true;
                matchScore = 50;
              }

              if (isArrivalCard) {
                candidateCount++;
                const rect = el.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0;

                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'debug_log',
                  message: '  📍 Candidate #' + candidateCount + ': "' + text.substring(0, 50) + '..." (score: ' + matchScore + ', visible: ' + isVisible + ')'
                }));

                // Keep track of the best match (highest score + visible)
                if (isVisible && matchScore > bestMatchScore) {
                  bestMatch = el;
                  bestMatchScore = matchScore;
                  window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'debug_log',
                    message: '    🎯 New best match! Score: ' + matchScore
                  }));
                }
              }
            }

            // Use the best match found
            if (bestMatch) {
              arrivalCardBtn = bestMatch;
              const text = (bestMatch.textContent || bestMatch.innerText || '').trim();
              console.log('✅ Found Arrival Card button:', text);
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'debug_log',
                message: '✅ Best match (score ' + bestMatchScore + '): ' + text.substring(0, 80)
              }));
            }

            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug_log',
              message: '📊 Found ' + candidateCount + ' arrival card candidates'
            }));

            if (arrivalCardBtn) {
              console.log('📍 Scrolling to Arrival Card button');
              arrivalCardBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

              setTimeout(() => {
                console.log('🖱️ Clicking Arrival Card button');
                arrivalCardBtn.click();
                window.arrivalCardClicked = true;
                window.needAutoFill = true;

                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'arrival_card_clicked'
                }));

                console.log('✅ Arrival Card clicked successfully');
              }, 800);
            } else {
              console.warn('⚠️ Could not find Arrival Card button');
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'debug_log',
                message: '❌ Could not find Arrival Card button'
              }));
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'arrival_card_not_found'
              }));
            }
          }, 2000); // Wait 2 seconds for page to fully load after language selection
        } catch(e) {
          console.error('❌ Arrival Card click error:', e);
        }
      })();
    `;

    webViewRef.current?.injectJavaScript(jsCode);
  };

  // 检测Cloudflare验证框 - 增强版，支持视觉遮罩
  const checkCloudflareChallenge = () => {
    const jsCode = `
      (function() {
        try {
          // 增强检测Cloudflare验证框
          const hasCloudflare = document.body.innerHTML.includes('Verify you are human') ||
                               document.body.innerHTML.includes('cloudflare') ||
                               document.body.innerHTML.includes('Just a moment') ||
                               document.body.innerHTML.includes('Checking your browser') ||
                               document.querySelector('iframe[src*="challenges.cloudflare.com"]') ||
                               document.querySelector('iframe[src*="hcaptcha.com"]') ||
                               document.querySelector('.cf-browser-verification');

          // 检测是否验证成功（多种方式）
          const hasSuccess = document.body.innerHTML.includes('Success!') ||
                            document.querySelector('.success') ||
                            document.querySelector('[class*="success"]') ||
                            document.querySelector('svg[class*="success"]') ||
                            document.querySelector('[aria-label*="success"]') ||
                            // 检测绿色勾号图标
                            document.querySelector('svg circle[fill*="green"]') ||
                            // 检测Cloudflare验证框消失
                            (!document.body.innerHTML.includes('Verify you are human') &&
                             window.hadCloudflare === true);

          // 检测是否在语言选择页面
          const hasLanguageSelection = document.body.innerHTML.includes('English') &&
                                       document.body.innerHTML.includes('日本語') &&
                                       (document.body.innerHTML.includes('中文') || document.body.innerHTML.includes('한국어'));

          // 检测是否在Arrival Card选择页面
          const hasArrivalCard = document.body.innerHTML.includes('Arrival Card') &&
                                (document.body.innerHTML.includes('Provide your Thailand') ||
                                 document.body.innerHTML.includes('Digital Arrival Card'));

          // 标记曾经有过Cloudflare验证框
          if (hasCloudflare) {
            window.hadCloudflare = true;
          }

          // 验证成功时立即隐藏提示框和遮罩
          if (hasSuccess) {
            console.log('🎉 检测到验证成功！隐藏提示框和遮罩');
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'cloudflare_detected',
              show: false,
              mask: false
            }));

            // Trigger language selection after verification
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'trigger_language_selection'
            }));
          }

          // 如果在语言选择页面，触发自动选择
          if (hasLanguageSelection && !window.languageSelected) {
            console.log('🌐 检测到语言选择页面');
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'trigger_language_selection'
            }));
          }

          // 如果在Arrival Card页面但没有Cloudflare，说明验证成功
          if (hasArrivalCard && !hasCloudflare && window.hadCloudflare) {
            console.log('✅ 到达Arrival Card页面，验证成功');
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'cloudflare_detected',
              show: false,
              mask: false
            }));
          }

          // NOTE: Removed duplicate arrival card auto-click logic
          // Arrival card should only be clicked AFTER language selection completes
          // The proper flow is: Cloudflare → Language Selection → Arrival Card Click

          // 只在验证未成功时发送提示框显示状态
          if (!hasSuccess && !hasArrivalCard) {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'cloudflare_detected',
              show: !!hasCloudflare,
              mask: !!hasCloudflare // 启用遮罩
            }));
          }

          console.log('Cloudflare检测:', hasCloudflare ? '发现' : '未发现', '验证成功:', hasSuccess, 'Arrival Card页面:', hasArrivalCard);
        } catch(e) {
          console.error('Cloudflare检测错误:', e);
        }
      })();
    `;
    webViewRef.current?.injectJavaScript(jsCode);
  };

  // 定期检查Cloudflare、自动填充和QR码
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        checkCloudflareChallenge();
        checkAndAutoFill(); // 检查是否需要自动填充
        checkForQRCode(); // 检查QR码
      }
    }, 2000); // 每2秒检查一次

    return () => clearInterval(interval);
  }, [isLoading]);

  // 检查并执行自动填充
  const checkAndAutoFill = () => {
    const jsCode = `
      (function() {
        try {
          // 如果标记了需要自动填充，并且还没有执行过
          if (window.needAutoFill && !window.autoFillExecuted) {
            // 检查是否在表单页面（有输入框）
            const hasInputs = document.querySelectorAll('input[formcontrolname]').length > 0;
            
            if (hasInputs) {
              console.log('🤖 检测到表单页面，开始自动填充...');
              window.autoFillExecuted = true;
              window.needAutoFill = false;
              
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'trigger_auto_fill'
              }));
            }
          }
        } catch(e) {
          console.error('自动填充检测错误:', e);
        }
      })();
    `;
    webViewRef.current?.injectJavaScript(jsCode);
  };

  // Compare entry data with TDAC submission data
  const compareEntryDataWithTDAC = React.useCallback(() => {
    if (!__DEV__) {
return;
}

    try {
      // Get original entry data
      const originalData = {
        passport,
        destination,
        travelInfo,
        formFields
      };

      // Generate what will be submitted to TDAC
      const tdacSubmissionData = generateTDACSubmissionPayload();

      // Create detailed comparison
      const comparison = {
        timestamp: new Date().toISOString(),
        originalEntryData: originalData,
        tdacSubmissionData,
        fieldMappings: createFieldMappingReport(originalData, tdacSubmissionData),
        validationResults: validateDataTransformation(originalData, tdacSubmissionData),
        summary: generateComparisonSummary(originalData, tdacSubmissionData)
      };

      setComparisonData(comparison);

      console.log('🔍 Data Comparison Generated:', comparison);
    } catch (error) {
      console.error('❌ Data comparison failed:', error);
    }
  }, [passport, destination, travelInfo, formFields]);

  // Generate what would be submitted to TDAC API
  const generateTDACSubmissionPayload = React.useCallback(() => {
    try {
      // Parse form fields into TDAC format
      const personalInfo = {};
      const tripInfo = {};

      formFields.forEach(field => {
        const { field: fieldName, value } = field;

        // Map fields to TDAC format
        switch (fieldName) {
          case 'firstName':
            personalInfo.firstName = value.toUpperCase();
            break;
          case 'middleName':
            personalInfo.middleName = value ? value.toUpperCase() : '';
            break;
          case 'lastName':
            personalInfo.familyName = value.toUpperCase();
            break;
          case 'passportNo':
            personalInfo.passportNo = value.toUpperCase();
            break;
          case 'nationality':
            personalInfo.nationalityDesc = value;
            break;
          case 'bdDateYear':
            personalInfo.bdDateYear = value;
            break;
          case 'bdDateMonth':
            personalInfo.bdDateMonth = value.padStart(2, '0');
            break;
          case 'bdDateDay':
            personalInfo.bdDateDay = value.padStart(2, '0');
            break;
          case 'gender':
            // NOTE: gender removed from personalInfo - stored in passport only
            // personalInfo.gender = value.toUpperCase();
            break;
          case 'occupation':
            personalInfo.occupation = value.toUpperCase();
            break;
          case 'flightNumber':
            tripInfo.flightNo = value ? value.toUpperCase() : '';
            break;
          case 'arrivalDate':
            tripInfo.arrDate = value;
            break;
          case 'purpose':
            tripInfo.traPurposeId = value;
            break;
          case 'boardedCountry':
            tripInfo.countryBoardDesc = value;
            break;
          case 'phoneCode':
            personalInfo.phoneCode = value;
            break;
          case 'phoneNo':
            personalInfo.phoneNo = value;
            break;
          case 'address':
            tripInfo.accAddress = value ? value.toUpperCase() : '';
            break;
          case 'province':
            tripInfo.accProvinceDesc = value;
            break;
        }
      });

      // Add default values for missing fields
      const payload = {
        personalInfo: {
          ...personalInfo,
          countryResDesc: 'CHINA',
          cityRes: 'BEIJING',
          visaNo: ''
          // middleName is now handled in the switch statement above
        },
        tripInfo: {
          ...tripInfo,
          deptDate: null,
          countryBoardCode: 'CHN',
          traModeId: 'AIR',
          tranModeId: 'COMMERCIAL FLIGHT',
          accTypeId: 'HOTEL',
          accProvinceId: 'BANGKOK',
          accDistrictId: 'BANG BON',
          accSubDistrictId: 'BANG BON NUEA',
          accPostCode: '',
          notStayInTh: false
        },
        healthInfo: {
          ddcCountryCodes: ''
        }
      };

      return payload;
    } catch (error) {
      console.error('❌ Failed to generate TDAC payload:', error);
      return null;
    }
  }, [formFields]);

  // Create detailed field mapping report
  const createFieldMappingReport = React.useCallback((originalData, tdacData) => {
    const mappings = {};

    // Personal info mappings
    if (originalData.passport) {
      mappings.firstName = {
        source: 'passport.nameEn (first part)',
        original: originalData.passport.nameEn?.split(' ')[0] || '',
        tdac: tdacData.personalInfo?.firstName || '',
        status: 'mapped'
      };

      mappings.lastName = {
        source: 'passport.nameEn (remaining parts)',
        original: originalData.passport.nameEn?.split(' ').slice(1).join(' ') || '',
        tdac: tdacData.personalInfo?.familyName || '',
        status: 'mapped'
      };

      mappings.passportNo = {
        source: 'passport.passportNo',
        original: originalData.passport.passportNo || '',
        tdac: tdacData.personalInfo?.passportNo || '',
        status: 'mapped'
      };

      mappings.birthDate = {
        source: 'passport.birthDate',
        original: originalData.passport.birthDate || '',
        tdac: `${tdacData.personalInfo?.bdDateYear || ''}-${tdacData.personalInfo?.bdDateMonth || ''}-${tdacData.personalInfo?.bdDateDay || ''}`,
        status: 'transformed'
      };
    }

    // Travel info mappings
    if (originalData.travelInfo) {
      mappings.flightNumber = {
        source: 'travelInfo.flightNumber',
        original: originalData.travelInfo.flightNumber || '',
        tdac: tdacData.tripInfo?.flightNo || '',
        status: 'mapped'
      };

      mappings.arrivalDate = {
        source: 'travelInfo.arrivalDate',
        original: originalData.travelInfo.arrivalDate || '',
        tdac: tdacData.tripInfo?.arrDate || '',
        status: 'mapped'
      };
    }

    return mappings;
  }, []);

  // Validate data transformation
  const validateDataTransformation = React.useCallback((originalData, tdacData) => {
    const validations = {
      personalInfo: {},
      tripInfo: {},
      overall: true
    };

    // Validate personal info
    if (originalData.passport) {
      validations.personalInfo.firstName = {
        valid: tdacData.personalInfo?.firstName === (originalData.passport.nameEn?.split(' ')[0] || '').toUpperCase(),
        original: originalData.passport.nameEn?.split(' ')[0] || '',
        tdac: tdacData.personalInfo?.firstName || ''
      };

      validations.personalInfo.lastName = {
        valid: tdacData.personalInfo?.familyName === (originalData.passport.nameEn?.split(' ').slice(1).join(' ') || '').toUpperCase(),
        original: originalData.passport.nameEn?.split(' ').slice(1).join(' ') || '',
        tdac: tdacData.personalInfo?.familyName || ''
      };

      validations.personalInfo.passportNo = {
        valid: tdacData.personalInfo?.passportNo === (originalData.passport.passportNo || '').toUpperCase(),
        original: originalData.passport.passportNo || '',
        tdac: tdacData.personalInfo?.passportNo || ''
      };
    }

    // Check overall validity
    validations.overall = Object.values(validations.personalInfo).every(v => v.valid) &&
                         Object.values(validations.tripInfo).every(v => v.valid);

    return validations;
  }, []);

  // Generate comparison summary
  const generateComparisonSummary = React.useCallback((originalData, tdacData) => {
    const totalFields = Object.keys(createFieldMappingReport(originalData, tdacData)).length;
    const validationResults = validateDataTransformation(originalData, tdacData);
    const validFields = Object.values(validationResults.personalInfo).filter(v => v.valid).length +
                       Object.values(validationResults.tripInfo).filter(v => v.valid).length;

    return {
      totalFields,
      validFields,
      accuracy: totalFields > 0 ? Math.round((validFields / totalFields) * 100) : 0,
      transformationType: 'WebView to TDAC API',
      timestamp: new Date().toISOString()
    };
  }, [createFieldMappingReport, validateDataTransformation]);

  // 检测QR码
  const checkForQRCode = () => {
    const jsCode = `
      (function() {
        try {
          // 如果已经提取过，跳过
          if (window.qrCodeExtracted) {
            return;
          }
          
          // 查找QR码图片的多种方式
          let qrCodeImg = null;
          
          // 方式1: 查找包含QR字样的img
          const allImages = document.querySelectorAll('img');
          for (let img of allImages) {
            const src = img.src || '';
            const alt = img.alt || '';
            const className = img.className || '';
            
            if (src.includes('qr') || src.includes('QR') ||
                alt.toLowerCase().includes('qr') ||
                className.toLowerCase().includes('qr') ||
                src.startsWith('data:image')) {
              // 检查图片是否足够大（QR码通常>100px）
              const rect = img.getBoundingClientRect();
              if (rect.width > 100 && rect.height > 100) {
                qrCodeImg = img;
                console.log('✅ 找到QR码图片:', img.src.substring(0, 100));
                break;
              }
            }
          }
          
          // 方式2: 查找canvas元素（有些QR码用canvas渲染）
          if (!qrCodeImg) {
            const canvases = document.querySelectorAll('canvas');
            for (let canvas of canvases) {
              const rect = canvas.getBoundingClientRect();
              if (rect.width > 100 && rect.height > 100) {
                try {
                  // 尝试转换为图片
                  const dataUrl = canvas.toDataURL('image/png');
                  qrCodeImg = { src: dataUrl, isCanvas: true };
                  console.log('✅ 找到QR码Canvas');
                  break;
                } catch(e) {
                  console.log('Canvas转换失败:', e);
                }
              }
            }
          }
          
          // 方式3: 查找包含"Success"或"Confirmation"的页面
          const hasSuccess = document.body.innerHTML.includes('Success') ||
                            document.body.innerHTML.includes('Confirmation') ||
                            document.body.innerHTML.includes('Thank you') ||
                            document.body.innerHTML.includes('completed');
          
          if (qrCodeImg && hasSuccess) {
            window.qrCodeExtracted = true;
            
            const qrData = {
              src: qrCodeImg.isCanvas ? qrCodeImg.src : qrCodeImg.src,
              timestamp: new Date().toISOString(),
              pageUrl: window.location.href
            };
            
            console.log('🎉 QR码提取成功！');
            
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'qr_code_found',
              data: qrData
            }));
          }
        } catch(e) {
          console.error('QR码检测错误:', e);
        }
      })();
    `;
    webViewRef.current?.injectJavaScript(jsCode);
  };

  // 智能查找并填充字段 - 针对Angular动态表单优化
  const autoFillField = (value, searchTerms) => {
    const safeValue = value.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
    
    const jsCode = `
      (function() {
        try {
          const value = '${safeValue}';
          const searchTerms = ${JSON.stringify(searchTerms)};
          
          function findAndFill(attempts = 0) {
            if (attempts > 15) {
              console.log('⚠️ 未找到匹配字段, searchTerms:', JSON.stringify(searchTerms));
              return false;
            }
            
            if (attempts === 0) {
              console.log('🔍 开始查找字段, value:', value, 'searchTerms:', JSON.stringify(searchTerms));
            }
            
            let filled = false;
            
            // 策略1: Angular表单属性 (formcontrolname - 注意是小写)
            for (let term of searchTerms) {
              // 尝试精确匹配
              let input = document.querySelector('input[formcontrolname="' + term + '"]');
              
              // 如果没找到，尝试小写
              if (!input) {
                input = document.querySelector('input[formcontrolname="' + term.toLowerCase() + '"]');
              }
              
              // 尝试其他属性
              if (!input) {
                input = document.querySelector('input[ng-reflect-name="' + term + '"]') ||
                        document.querySelector('input[ng-reflect-name="' + term.toLowerCase() + '"]') ||
                        document.querySelector('input[name="' + term + '"]') ||
                        document.querySelector('input[id*="' + term.toLowerCase() + '"]');
              }
              
              if (input && !input.disabled) {
                // 设置值
                input.value = value;
                input.focus();
                
                // 触发所有可能的事件
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
                input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
                input.dispatchEvent(new Event('blur', { bubbles: true }));
                
                // Angular特定事件
                input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                
                filled = true;
                console.log('✅ 填充成功:', term, '=', value);
                break;
              }
            }
            
            // 策略2: placeholder查找
            if (!filled) {
              for (let term of searchTerms) {
                const input = document.querySelector('input[placeholder*="' + term + '"]') ||
                             document.querySelector('input[placeholder*="' + term.toLowerCase() + '"]');
                if (input) {
                  input.value = value;
                  input.focus();
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                  input.dispatchEvent(new Event('blur', { bubbles: true }));
                  filled = true;
                  console.log('✅ 找到字段:', term, '(placeholder)');
                  break;
                }
              }
            }
            
            // 策略2.5: 单选按钮 (radio buttons)
            if (!filled) {
              for (let term of searchTerms) {
                // 查找单选按钮组
                const radioGroup = document.querySelector('mat-radio-group[formcontrolname="' + term + '"]') ||
                                  document.querySelector('mat-radio-group[formcontrolname="' + term.toLowerCase() + '"]');
                if (radioGroup) {
                  // 查找对应值的单选按钮
                  const radioButtons = radioGroup.querySelectorAll('input[type="radio"]');
                  for (let radio of radioButtons) {
                    const label = radio.closest('.mat-mdc-radio-button')?.querySelector('label');
                    if (label && label.textContent.toUpperCase().includes(value.toUpperCase())) {
                      radio.click();
                      filled = true;
                      console.log('✅ 选中单选按钮:', term, '=', value);
                      break;
                    }
                  }
                  if (filled) break;
                }
              }
            }
            
            // 策略3: Material/Angular label查找
            if (!filled) {
              for (let term of searchTerms) {
                const labels = document.querySelectorAll('label, mat-label, .mat-form-field-label');
                for (let label of labels) {
                  const text = label.textContent.toLowerCase().trim();
                  if (text.includes(term.toLowerCase())) {
                    const parent = label.closest('mat-form-field') || label.closest('.mat-form-field') || label.parentElement;
                    const input = parent?.querySelector('input');
                    if (input) {
                      input.value = value;
                      input.focus();
                      input.dispatchEvent(new Event('input', { bubbles: true }));
                      input.dispatchEvent(new Event('change', { bubbles: true }));
                      input.dispatchEvent(new Event('blur', { bubbles: true }));
                      filled = true;
                      console.log('✅ 找到字段:', term, '(label)');
                      break;
                    }
                  }
                }
                if (filled) break;
              }
            }
            
            // 如果还没找到，等待Angular渲染后重试
            if (!filled && attempts < 15) {
              console.log('🔄 第', attempts + 1, '次尝试失败，300ms后重试...');
              setTimeout(() => findAndFill(attempts + 1), 300);
            } else if (!filled) {
              console.log('❌ 所有尝试都失败了');
            }
            
            return filled;
          }
          
          findAndFill();
        } catch(e) {
          console.error('❌ 自动填充错误:', e);
        }
      })();
    `;
    
    webViewRef.current?.injectJavaScript(jsCode);
  };

  // 🛑 显示WebView自动填充确认对话框
  const showWebViewFillConfirmation = () => new Promise((resolve) => {
      const personalFields = formFields.filter(f => f.section === 'personal');
      const tripFields = formFields.filter(f => f.section === 'trip');
      const accommodationFields = formFields.filter(f => f.section === 'accommodation');

      const confirmationMessage = `
🔍 即将自动填充的信息：

👤 护照信息 (${personalFields.length}个字段):
${personalFields.map(f => `• ${f.labelCn}: ${f.value}`).join('\n')}

✈️ 旅行信息 (${tripFields.length}个字段):
${tripFields.map(f => `• ${f.labelCn}: ${f.value}`).join('\n')}

🏨 住宿信息 (${accommodationFields.length}个字段):
${accommodationFields.map(f => `• ${f.labelCn}: ${f.value}`).join('\n')}

⚠️ 重要提醒：
• 信息将自动填入TDAC网站
• 填充后请仔细检查准确性
• 确认无误后再提交
• 避免多次提交被封禁
      `.trim();

      Alert.alert(
        '🛑 确认自动填充',
        confirmationMessage,
        [
          {
            text: '❌ 取消',
            style: 'cancel',
            onPress: () => {
              console.log('🛑 用户取消了自动填充');
              resolve(false);
            }
          },
          {
            text: '📋 查看字段详情',
            onPress: () => {
              showWebViewFieldDetails(resolve);
            }
          },
          {
            text: '✅ 开始填充',
            style: 'default',
            onPress: () => {
              console.log('✅ 用户确认开始自动填充');
              resolve(true);
            }
          }
        ],
        { cancelable: false }
      );
    });

  // 显示WebView字段详情
  const showWebViewFieldDetails = (resolve) => {
    const fieldDetails = `
🔍 TDAC 网站字段映射详情：

📋 字段查找策略：
每个字段将尝试以下方式查找：
1. formcontrolname="字段名"
2. ng-reflect-name="字段名"
3. name="字段名"
4. placeholder包含"字段标签"
5. label文本包含"字段中文名"

📊 具体字段映射：
${formFields.map((field, index) => `
${index + 1}. ${field.labelCn} (${field.label})
   值: "${field.value}"
   搜索: [${field.searchTerms.join(', ')}]
   目标: ${field.field}`).join('\n')}

🔧 填充机制：
• 智能重试：最多15次尝试
• 事件触发：input, change, blur等
• Angular支持：兼容Angular表单
• 单选按钮：自动选择匹配项

⚠️ 填充完成后会自动：
• 滚动到页面底部
• 查找Continue按钮
• 提示用户检查并提交
    `.trim();

    Alert.alert(
      '📋 字段映射详情',
      fieldDetails,
      [
        {
          text: '❌ 取消填充',
          style: 'cancel',
          onPress: () => {
            console.log('🛑 用户在查看详情后取消了填充');
            resolve(false);
          }
        },
        {
          text: '✅ 确认无误，开始填充',
          style: 'default',
          onPress: () => {
            console.log('✅ 用户在查看详情后确认填充');
            resolve(true);
          }
        }
      ],
      { cancelable: false }
    );
  };

  // 自动填充所有字段 - 智能批量填充（带详细日志和手动确认）
  const autoFillAll = async () => {
    try {
      // 验证必要数据是否存在
      if (!passport || !passport.passportNo) {
        Alert.alert(
          '❌ 缺少护照数据',
          '无法自动填充，护照信息不完整。\n\n请返回上一页面确认护照数据已正确加载。',
          [{ text: '好的' }]
        );
        return;
      }

      if (!travelInfo) {
        Alert.alert(
          '⚠️ 缺少旅行信息',
          '部分字段可能无法填充，因为旅行信息不完整。\n\n是否继续？',
          [
            { text: '取消', style: 'cancel' },
            { text: '继续', onPress: () => proceedWithAutoFill() }
          ]
        );
        return;
      }

      await proceedWithAutoFill();
    } catch (error) {
      console.error('❌ 自动填充失败:', error);
      Alert.alert(
        '❌ 自动填充失败',
        `无法执行自动填充，请使用手动复制方式。\n\n错误信息: ${  error.message}`,
        [{ text: '好的' }]
      );
    }
  };

  const proceedWithAutoFill = async () => {
    try {
      // 🔍 记录详细的填充信息
      await TDACSubmissionLogger.logWebViewFill(formFields);

      // 🛑 显示手动确认对话框
      const shouldProceed = await showWebViewFillConfirmation();

      if (!shouldProceed) {
        console.log('❌ 用户取消了自动填充');
        return;
      }

      console.log('✅ 用户确认自动填充，开始执行...');

      // Filter out fields with undefined or empty values
      const allFields = formFields
        .filter(field => {
          const hasValue = field.value !== undefined && field.value !== null && field.value !== '';
          if (!hasValue) {
            console.warn(`⚠️ Skipping field ${field.label} - value is ${field.value}`);
          }
          return hasValue;
        })
        .map(field => ({
          value: String(field.value), // Ensure value is string
          searchTerms: field.searchTerms || [field.label]
        }));

      if (allFields.length === 0) {
        Alert.alert(
          '❌ 没有可填充的数据',
          '所有字段的值都为空，无法执行自动填充。\n\n请检查护照和旅行信息是否正确加载。',
          [{ text: '好的' }]
        );
        return;
      }

      console.log(`📝 准备填充 ${allFields.length} 个字段`);

    const jsCode = `
      (function() {
        try {
          const allFields = ${JSON.stringify(allFields)};
          let totalFilled = 0;
          
          function fillAllFields(attempts = 0) {
            if (attempts > 10) {
              console.log('🏁 完成填充，共填充', totalFilled, '个字段');
              alert('自动填充完成！\\n已填充 ' + totalFilled + ' 个字段\\n请检查并确认');
              return;
            }
            
            let filledThisRound = 0;
            
            allFields.forEach(field => {
              const value = field.value;
              const searchTerms = field.searchTerms;
              let filled = false;
              
              for (let term of searchTerms) {
                // 策略1: 查找单选按钮
                const radioGroup = document.querySelector('mat-radio-group[formcontrolname="' + term + '"]') ||
                                  document.querySelector('mat-radio-group[formcontrolname="' + term.toLowerCase() + '"]');
                if (radioGroup) {
                  const radioButtons = radioGroup.querySelectorAll('input[type="radio"]');
                  for (let radio of radioButtons) {
                    const label = radio.closest('.mat-mdc-radio-button')?.querySelector('label');
                    if (label && label.textContent.toUpperCase().includes(value.toUpperCase())) {
                      radio.click();
                      filledThisRound++;
                      totalFilled++;
                      filled = true;
                      console.log('✅ 选中单选按钮:', term, '=', value);
                      break;
                    }
                  }
                  if (filled) break;
                }
                
                // 策略2: 文本输入框和autocomplete
                let input = document.querySelector('input[formcontrolname="' + term + '"]');
                
                if (!input) {
                  input = document.querySelector('input[formcontrolname="' + term.toLowerCase() + '"]');
                }
                
                if (!input) {
                  input = document.querySelector('input[ng-reflect-name="' + term + '"]') ||
                          document.querySelector('input[name="' + term + '"]') ||
                          document.querySelector('input[placeholder*="' + term + '"]') ||
                          document.querySelector('textarea[formcontrolname="' + term + '"]') ||
                          document.querySelector('textarea[formcontrolname="' + term.toLowerCase() + '"]');
                }
                
                if (input && !input.disabled && !input.value) {
                  input.value = value;
                  input.focus();
                  
                  // 触发多个事件以支持autocomplete
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                  input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
                  input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
                  input.dispatchEvent(new Event('blur', { bubbles: true }));
                  
                  filledThisRound++;
                  totalFilled++;
                  filled = true;
                  console.log('✅ 已填充:', term, '=', value);
                  break;
                }
              }
            });
            
            // 如果这轮填充了字段，说明页面可能变化了，继续尝试
            if (filledThisRound > 0) {
              console.log('📝 本轮填充', filledThisRound, '个字段，继续...');
              setTimeout(() => fillAllFields(attempts + 1), 500);
            } else if (attempts < 3) {
              // 前几轮即使没填充也继续等待（可能页面还在加载）
              setTimeout(() => fillAllFields(attempts + 1), 500);
            } else {
              console.log('🏁 完成填充，共填充', totalFilled, '个字段');
              
              // 填充完成后，滚动到底部并点击Continue按钮
              setTimeout(() => {
                console.log('📜 滚动到页面底部...');
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: 'smooth'
                });
                
                // 等待滚动完成后查找并点击Continue按钮
                setTimeout(() => {
                  console.log('🔍 查找Continue按钮...');
                  
                  // 多种方式查找Continue按钮
                  let continueBtn = null;
                  
                  // 方式1: 查找包含"Continue"文本的按钮
                  const allButtons = document.querySelectorAll('button, a, [role="button"]');
                  for (let btn of allButtons) {
                    const text = (btn.textContent || btn.innerText || '').trim().toLowerCase();
                    if (text === 'continue' || text === 'next' || text === 'submit' || 
                        text.includes('continue') || text.includes('下一步')) {
                      const rect = btn.getBoundingClientRect();
                      if (rect.width > 0 && rect.height > 0) {
                        continueBtn = btn;
                        console.log('✅ 找到Continue按钮:', btn.textContent.trim());
                        break;
                      }
                    }
                  }
                  
                  if (continueBtn) {
                    console.log('🚀 点击Continue按钮...');
                    continueBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    setTimeout(() => {
                      // 尝试多种点击方式
                      continueBtn.click();
                      
                      const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                      });
                      continueBtn.dispatchEvent(clickEvent);
                      
                      console.log('✅ 已点击Continue按钮');
                    }, 500);
                  } else {
                    console.log('⚠️ 未找到Continue按钮，请手动点击');
                    alert('自动填充完成！\\n已填充 ' + totalFilled + ' 个字段\\n请检查并手动点击Continue');
                  }
                }, 1000);
              }, 500);
            }
          }
          
          fillAllFields();
        } catch(e) {
          console.error('❌ 批量填充错误:', e);
        }
      })();
    `;
    
    webViewRef.current?.injectJavaScript(jsCode);
    
    } catch (error) {
      console.error('❌ 自动填充失败:', error);
      Alert.alert(
        '❌ 自动填充失败',
        `无法执行自动填充，请使用手动复制方式。\n\n错误信息: ${  error.message}`,
        [{ text: '好的' }]
      );
    }
  };

  // 字段数据 - 带多个搜索词提高匹配率
  const formFields = [
    // Step 1: Personal Information
    { 
      section: 'personal', 
      label: 'Family Name', 
      labelCn: '姓', 
      value: lastName, 
      field: 'lastName',
      searchTerms: ['familyName', 'lastName', 'surname', 'Family Name', 'family_name', 'last_name']
    },
    {
      section: 'personal',
      label: 'First Name',
      labelCn: '名',
      value: firstName,
      field: 'firstName',
      searchTerms: ['firstName', 'givenName', 'First Name', 'first_name', 'given_name']
    },
    {
      section: 'personal',
      label: 'Middle Name',
      labelCn: '中间名',
      value: middleName,
      field: 'middleName',
      searchTerms: ['middleName', 'Middle Name', 'middle_name', 'secondName']
    },
    {
      section: 'personal',
      label: 'Passport Number',
      labelCn: '护照号', 
      value: passport?.passportNo, 
      field: 'passportNo',
      searchTerms: ['passportNo', 'passportNumber', 'Passport No', 'passport', 'passport_number']
    },
    { 
      section: 'personal', 
      label: 'Nationality', 
      labelCn: '国籍', 
      value: 'China', 
      field: 'nationality',
      searchTerms: ['nationalityDesc', 'nationality', 'Nationality', 'country', 'citizenship']
    },
    { 
      section: 'personal', 
      label: 'Birth Year', 
      labelCn: '出生年份', 
      value: (passport?.birthDate || '1980-01-01').split('-')[0], 
      field: 'bdDateYear',
      searchTerms: ['bdDateYear', 'birthYear', 'year']
    },
    { 
      section: 'personal', 
      label: 'Birth Month', 
      labelCn: '出生月份', 
      value: (passport?.birthDate || '1980-01-01').split('-')[1], 
      field: 'bdDateMonth',
      searchTerms: ['bdDateMonth', 'birthMonth', 'month']
    },
    { 
      section: 'personal', 
      label: 'Birth Day', 
      labelCn: '出生日', 
      value: (passport?.birthDate || '1980-01-01').split('-')[2], 
      field: 'bdDateDay',
      searchTerms: ['bdDateDay', 'birthDay', 'day']
    },
    { 
      section: 'personal', 
      label: 'Gender', 
      labelCn: '性别', 
      value: (passport?.gender || 'Male').toUpperCase(), // MALE 或 FEMALE
      field: 'gender',
      searchTerms: ['gender', 'Gender', 'sex']
    },
    { 
      section: 'personal', 
      label: 'Occupation', 
      labelCn: '职业', 
      value: travelInfo?.occupation || 'Tourist', 
      field: 'occupation',
      searchTerms: ['occupation', 'Occupation', 'job', 'profession']
    },
    
    // Step 2: Trip Information
    { 
      section: 'trip', 
      label: 'Flight Number', 
      labelCn: '航班号', 
      value: travelInfo?.flightNumber, 
      field: 'flightNumber',
      searchTerms: ['flightNo', 'flightNumber', 'Flight No', 'Vehicle No', 'flight']
    },
    { 
      section: 'trip', 
      label: 'Arrival Date', 
      labelCn: '到达日期', 
      value: travelInfo?.arrivalDate, 
      field: 'arrivalDate',
      searchTerms: ['arrDate', 'arrivalDate', 'Date of Arrival', 'arrival_date', 'arrival']
    },
    { 
      section: 'trip', 
      label: 'Purpose of Visit', 
      labelCn: '旅行目的', 
      value: travelInfo?.travelPurpose || 'Tourism', 
      field: 'purpose',
      searchTerms: ['traPurposeId', 'purpose', 'Purpose of Travel', 'purposeOfVisit', 'travel_purpose']
    },
    { 
      section: 'trip', 
      label: 'Country where you Boarded', 
      labelCn: '出发国家', 
      value: travelInfo?.departureCountry || 'China', 
      field: 'boardedCountry',
      searchTerms: ['countryBoardDesc', 'boardedCountry', 'Country where you Boarded', 'departure_country']
    },
    
    // Step 3: Accommodation
    { 
      section: 'accommodation', 
      label: 'Type of Accommodation', 
      labelCn: '住宿类型', 
      value: 'Hotel', 
      field: 'accType',
      searchTerms: ['accTypeId', 'accType', 'Type of Accommodation', 'accommodation_type']
    },
    { 
      section: 'accommodation', 
      label: 'Province', 
      labelCn: '省份', 
      value: travelInfo?.province || 'Bangkok', 
      field: 'province',
      searchTerms: ['accProvinceDesc', 'province', 'Province']
    },
    { 
      section: 'accommodation', 
      label: 'Phone Code', 
      labelCn: '区号', 
      value: '86', 
      field: 'phoneCode',
      searchTerms: ['phoneCode', 'code', 'areaCode', 'countryCode']
    },
    { 
      section: 'accommodation', 
      label: 'Phone Number', 
      labelCn: '电话号码', 
      value: (() => {
        const phone = travelInfo?.contactPhone || '13800138000';
        // 移除所有非数字字符，然后移除开头的国家代码
        return phone
          .replace(/\D/g, '')  // 只保留数字
          .replace(/^(86|66)/, '');  // 移除开头的86或66
      })(), 
      field: 'phoneNo',
      searchTerms: ['phoneNo', 'phone', 'Phone No', 'telephone', 'phoneNumber']
    },
    { 
      section: 'accommodation', 
      label: 'Address', 
      labelCn: '详细地址', 
      value: travelInfo?.hotelAddress, 
      field: 'address',
      searchTerms: ['accAddress', 'address', 'Address']
    },
  ];

  const renderCopyField = (item) => (
    <View key={item.field} style={styles.fieldRow}>
      <View style={styles.fieldLeft}>
        <Text style={styles.fieldLabel}>{item.label}</Text>
        <Text style={styles.fieldLabelCn}>{item.labelCn}</Text>
        <Text style={styles.fieldValue} numberOfLines={1}>{item.value}</Text>
      </View>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.autoFillButton,
            copiedField === item.field && styles.autoFillButtonActive,
          ]}
          onPress={() => {
            autoFillField(item.value, item.searchTerms);
            setCopiedField(item.field);
            setTimeout(() => {
              setCopiedField(null);
              setShowHelper(false); // 自动关闭助手
            }, 1500);
          }}
        >
          <Text style={styles.autoFillButtonText}>⚡</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.copyButton,
            copiedField === item.field && styles.copyButtonActive,
          ]}
          onPress={() => copyToClipboard(item.value, item.label)}
        >
          <Text style={styles.copyButtonText}>
            {copiedField === item.field ? '✓' : '复制'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          showLabel={false}
          style={styles.backButton}
        />
        <Text style={styles.title}>TDAC 填写</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Full Screen WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://tdac.immigration.go.th' }}
        style={styles.webView}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'debug_log') {
              console.log('[WebView]', data.message);
            } else if (data.type === 'cloudflare_detected') {
              setShowCloudflareReminder(data.show);
              setShowVisualMask(data.mask || false);
            } else if (data.type === 'trigger_language_selection' && !languageSelectionTriggered) {
              console.log('🌐 触发语言自动选择');
              setLanguageSelectionTriggered(true);
              // Delay to let page render language options
              setTimeout(() => {
                autoSelectLanguage();
              }, 1000);
            } else if (data.type === 'language_selected') {
              console.log('✅ 语言已选择:', data.language);
              setSelectedLanguage(data.language);
              // Auto-hide after 3 seconds
              setTimeout(() => {
                setSelectedLanguage(null);
              }, 3000);
            } else if (data.type === 'trigger_arrival_card_click') {
              console.log('🎯 触发Arrival Card自动点击');
              // Delay to let language selection page transition complete
              setTimeout(() => {
                autoClickArrivalCard();
              }, 1500);
            } else if (data.type === 'arrival_card_clicked') {
              console.log('✅ 已自动点击Arrival Card按钮');
            } else if (data.type === 'arrival_card_not_found') {
              console.warn('⚠️ 未找到Arrival Card按钮');
            } else if (data.type === 'trigger_auto_fill') {
              console.log('🤖 触发自动填充');
              // 延迟1秒让页面完全加载后再填充
              setTimeout(() => {
                autoFillAll();
              }, 1000);
            } else if (data.type === 'qr_code_found') {
              console.log('🎉 检测到QR码');
              saveQRCode(data.data);
            }
          } catch (e) {
            // Ignore non-JSON messages
          }
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          setIsLoading(false);

          // Show user-friendly error message
          setTimeout(() => {
            Alert.alert(
              '🌐 网络连接问题',
              '无法加载泰国入境卡网站，请检查网络连接后重试。',
              [
                { text: '重试', onPress: () => webViewRef.current?.reload() },
                { text: '返回', onPress: () => navigation.goBack() }
              ]
            );
          }, 1000);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView HTTP error: ', nativeEvent);

          // Show specific HTTP error handling
          if (nativeEvent.statusCode >= 500) {
            Alert.alert(
              '🛠️ 服务器维护中',
              '泰国入境卡系统正在维护，请稍后重试。',
              [
                { text: '稍后重试', onPress: () => setTimeout(() => webViewRef.current?.reload(), 30000) },
                { text: '使用备用方案', onPress: () => navigation.navigate('TDACSelection') }
              ]
            );
          }
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>正在加载TDAC网站...</Text>
          </View>
        )}
      />

      {/* Enhanced Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinnerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <View style={styles.loadingPulse} />
            </View>
            <Text style={styles.loadingTitle}>正在加载泰国入境卡</Text>
            <Text style={styles.loadingSubtitle}>Thailand Digital Arrival Card</Text>
            <View style={styles.loadingProgress}>
              <View style={styles.loadingProgressBar}>
                <View style={styles.loadingProgressFill} />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Enhanced Visual Masking System */}
      {showVisualMask && (
        <View style={styles.visualMaskContainer}>
          {/* Full screen backdrop */}
          <View style={styles.maskBackdrop} />

          {/* Clean verification window */}
          <View style={styles.verificationWindow}>
            <View style={styles.windowHeader}>
              <Text style={styles.windowIcon}>🔒</Text>
              <Text style={styles.windowTitle}>安全验证</Text>
              <Text style={styles.windowSubtitle}>Security Verification</Text>
            </View>

            {/* Verification content area - transparent center */}
            <View style={styles.verificationContent}>
              <Text style={styles.verificationPrompt}>请在下方完成验证</Text>
              <Text style={styles.verificationPromptEn}>Please complete verification below</Text>
            </View>

            <View style={styles.windowFooter}>
              <Text style={styles.footerText}>验证完成后将自动继续</Text>
            </View>
          </View>

          {/* Focus arrow pointing to verification area */}
          <View style={styles.focusArrow}>
            <Text style={styles.focusArrowIcon}>👇</Text>
          </View>
        </View>
      )}

      {/* Background Blur when Cloudflare is active (fallback) */}
      {showCloudflareReminder && !showVisualMask && (
        <View style={styles.backgroundBlur}>
          <View style={styles.blurOverlay} />
        </View>
      )}

      {/* Language Selection Notification */}
      {selectedLanguage && (
        <View style={styles.languageNotification}>
          <View style={styles.languageNotificationContent}>
            <Text style={styles.languageNotificationIcon}>🌐</Text>
            <View style={styles.languageNotificationTextContainer}>
              <Text style={styles.languageNotificationTitle}>语言已自动选择</Text>
              <Text style={styles.languageNotificationLanguage}>{selectedLanguage}</Text>
            </View>
            <Text style={styles.languageNotificationCheck}>✓</Text>
          </View>
        </View>
      )}

      {/* Cloudflare验证提醒 */}
      {showCloudflareReminder && (
        <View style={styles.cloudflareReminder}>
          <View style={styles.cloudflareContent}>
            <View style={styles.cloudflareIconContainer}>
              <Text style={styles.cloudflareIcon}>🔒</Text>
            </View>
            <Text style={styles.cloudflareTitle}>安全验证</Text>
            <Text style={styles.cloudflareTextCn}>请在下方网页中点击</Text>
            <Text style={styles.cloudflareTextEn}>"我不是机器人" ✓</Text>
            <Text style={styles.cloudflareSubtext}>验证完成后将自动提交</Text>
            <View style={styles.cloudflareArrow}>
              <Text style={styles.cloudflareArrowIcon}>👇</Text>
            </View>
          </View>
        </View>
      )}

      {/* Enhanced Floating Buttons */}
      <View style={styles.floatingButtonsContainer}>
        {/* 自动填充按钮 */}
        <TouchableOpacity
          style={styles.floatingButtonPrimary}
          onPress={autoFillAll}
          activeOpacity={0.8}
        >
          <View style={styles.floatingButtonContent}>
            <Text style={styles.floatingButtonIcon}>⚡</Text>
            <View style={styles.floatingButtonTextContainer}>
              <Text style={styles.floatingButtonTitle}>自动填充</Text>
              <Text style={styles.floatingButtonSubtitle}>Auto Fill</Text>
            </View>
          </View>
          <View style={styles.floatingButtonGlow} />
        </TouchableOpacity>

        {/* 复制助手按钮（备用） */}
        <TouchableOpacity
          style={styles.floatingButtonSecondary}
          onPress={() => setShowHelper(true)}
          activeOpacity={0.8}
        >
          <View style={styles.floatingButtonContent}>
            <Text style={styles.floatingButtonIcon}>📋</Text>
            <View style={styles.floatingButtonTextContainer}>
              <Text style={styles.floatingButtonTitle}>复制助手</Text>
              <Text style={styles.floatingButtonSubtitle}>Copy Helper</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Helper Modal */}
      <HelperModal
        visible={showHelper}
        onClose={() => setShowHelper(false)}
        formFields={formFields}
        renderCopyField={renderCopyField}
      />

      {/* Data Comparison Modal (DEV mode only) */}
      <DataComparisonModal
        visible={showDataComparison}
        onClose={() => setShowDataComparison(false)}
        comparisonData={comparisonData}
        onRefresh={compareEntryDataWithTDAC}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        visible={showQrCode}
        onClose={() => setShowQrCode(false)}
        qrCodeData={qrCodeData}
        passport={passport}
        saveToPhotoAlbum={saveToPhotoAlbum}
      />
    </SafeAreaView>
  );
};

export default TDACWebViewScreen;
