// TDAC WebView填写助手 - 浮动复制助手
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Clipboard,
  ScrollView,
  Dimensions,
  Modal,
  StatusBar,
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, typography, spacing } from '../../theme';
import { useTranslation } from '../../i18n/LocaleContext';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../../components/BackButton';
import EntryInfoService from '../../services/EntryInfoService';
import PassportDataService from '../../services/data/PassportDataService';
import TDACSubmissionLogger from '../../services/tdac/TDACSubmissionLogger';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const TDACWebViewScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { passport: rawPassport, destination, travelInfo } = route.params || {};
  const passport = PassportDataService.toSerializablePassport(rawPassport);
  const [showHelper, setShowHelper] = useState(false); // 控制浮动助手显示
  const [copiedField, setCopiedField] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCloudflareReminder, setShowCloudflareReminder] = useState(false);
  const [showVisualMask, setShowVisualMask] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null); // 存储QR码数据
  const [showQrCode, setShowQrCode] = useState(false); // 显示QR码模态框

  // Data comparison state for DEV mode
  const [showDataComparison, setShowDataComparison] = useState(__DEV__ ? false : false);
  const [comparisonData, setComparisonData] = useState(null);
  const webViewRef = useRef(null);

  // 解析姓名
  const nameEn = passport?.nameEn || passport?.name || '';
  const nameParts = nameEn.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const copyToClipboard = (text, fieldName) => {
    Clipboard.setString(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 保存QR码到App和相册
  const saveQRCode = async (qrData) => {
    try {
      console.log('📸 开始保存QR码...');
      
      // Generate card number from QR data or timestamp
      const cardNo = qrData.arrCardNo || `WV_${Date.now()}`;
      
      // 1. 保存到AsyncStorage（App内部存储）
      const storageKey = `tdac_qr_${passport?.passportNo}_${Date.now()}`;
      const entryData = {
        ...qrData,
        passportNo: passport?.passportNo,
        name: passport?.nameEn || passport?.name,
        savedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        submissionMethod: 'webview',
        // TDAC submission metadata for EntryPackService
        arrCardNo: cardNo,
        cardNo: cardNo,
        qrUri: qrData.src,
        pdfPath: qrData.src,
        timestamp: Date.now(),
        alreadySubmitted: true
      };
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(entryData));
      console.log('✅ QR码已保存到App');
      
      // Set flag for EntryPackService integration
      await AsyncStorage.setItem('recent_tdac_submission', JSON.stringify(entryData));
      console.log('✅ Recent submission flag set for EntryPackService');
      
      // Create or update digital arrival card with TDAC submission
      try {
        const tdacSubmission = {
          arrCardNo: cardNo,
          qrUri: qrData.src,
          pdfPath: qrData.src,
          submittedAt: new Date().toISOString(),
          submissionMethod: 'webview',
          cardType: 'TDAC',
          status: 'success'
        };

        // Find entry info ID - for now use a placeholder, this should be passed from navigation params
        const entryInfoId = route.params?.entryInfoId || 'thailand_entry_info';

        await EntryInfoService.updateEntryInfo(entryInfoId, {
          documents: JSON.stringify([tdacSubmission]),
          displayStatus: JSON.stringify({ tdacSubmitted: true, submissionMethod: 'webview' })
        });

        console.log('✅ Entry info updated successfully via WebView');
      } catch (entryInfoError) {
        console.error('❌ Failed to update entry info:', entryInfoError);
        // Don't block user flow - continue with QR code saving
      }
      
      // 2. 保存到相册
      const saved = await saveToPhotoAlbum(qrData.src);
      
      if (saved) {
        Alert.alert(
          '🎉 QR码已保存！',
          'QR码已保存到:\n1. App内（可在"我的旅程"查看）\n2. 手机相册\n\n入境时向海关出示即可！',
          [
            { text: '查看QR码', onPress: () => setShowQrCode(true) },
            { text: '好的' }
          ]
        );
      }
      
      // 更新state
      setQrCodeData(qrData);
      
    } catch (error) {
      console.error('保存QR码失败:', error);
      Alert.alert('保存失败', '无法保存QR码，请截图保存');
    }
  };

  // 保存到相册
  const saveToPhotoAlbum = async (base64Data) => {
    try {
      // 请求相册权限
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('需要相册权限', '请在设置中允许访问相册');
        return false;
      }
      
      // 保存base64图片
      const filename = FileSystem.documentDirectory + `tdac_qr_${Date.now()}.png`;
      
      // 去除base64前缀
      const base64Image = base64Data.split(',')[1] || base64Data;
      
      await FileSystem.writeAsStringAsync(filename, base64Image, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // 保存到相册
      const asset = await MediaLibrary.createAssetAsync(filename);
      await MediaLibrary.createAlbumAsync('BorderBuddy', asset, false);
      
      console.log('✅ QR码已保存到相册');
      return true;
      
    } catch (error) {
      console.error('保存到相册失败:', error);
      return false;
    }
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

          // 如果验证成功且在Arrival Card页面，尝试自动点击
          if (hasSuccess && !window.arrivalCardClicked && hasArrivalCard) {
            console.log('✅ Cloudflare验证成功且在Arrival Card页面，尝试自动点击');

            setTimeout(() => {
              // 多种方式查找"Arrival Card"按钮
              let arrivalCardBtn = null;

              // 方式1: 查找所有可点击元素
              const allElements = document.querySelectorAll('button, a, div, span, mat-card, [class*="card"], [class*="Card"]');

              for (let el of allElements) {
                const text = (el.textContent || el.innerText || '').trim();
                if (text.match(/arrival\s*card/i) ||
                    text.includes('Arrival Card') ||
                    text.includes('arrival card')) {
                  const rect = el.getBoundingClientRect();
                  const isVisible = rect.width > 0 && rect.height > 0;
                  if (isVisible) {
                    arrivalCardBtn = el;
                    break;
                  }
                }
              }

              if (arrivalCardBtn) {
                arrivalCardBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                  arrivalCardBtn.click();
                  window.arrivalCardClicked = true;
                  window.needAutoFill = true;

                  window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'arrival_card_clicked'
                  }));
                }, 500);
              }
            }, 1500);
          }

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
    if (!__DEV__ || !debugMode) return;

    try {
      // Get original entry data
      const originalData = {
        passport: passport,
        destination: destination,
        travelInfo: travelInfo,
        formFields: formFields
      };

      // Generate what will be submitted to TDAC
      const tdacSubmissionData = generateTDACSubmissionPayload();

      // Create detailed comparison
      const comparison = {
        timestamp: new Date().toISOString(),
        originalEntryData: originalData,
        tdacSubmissionData: tdacSubmissionData,
        fieldMappings: createFieldMappingReport(originalData, tdacSubmissionData),
        validationResults: validateDataTransformation(originalData, tdacSubmissionData),
        summary: generateComparisonSummary(originalData, tdacSubmissionData)
      };

      setComparisonData(comparison);

      if (debugMode) {
        addDebugLog(
          'validation',
          'Data comparison completed - check comparison modal for details',
          {
            totalFields: Object.keys(comparison.fieldMappings).length,
            validationPassed: comparison.validationResults.overall,
            summary: comparison.summary
          }
        );
      }

      console.log('🔍 Data Comparison Generated:', comparison);
    } catch (error) {
      console.error('❌ Data comparison failed:', error);
      if (debugMode) {
        addDebugLog('error', 'Data comparison failed', { error: error.message });
      }
    }
  }, [passport, destination, travelInfo, formFields, debugMode, addDebugLog]);

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
            personalInfo.gender = value.toUpperCase();
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
          visaNo: '',
          middleName: ''
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

  // 自动填充所有字段 - 智能批量填充（带详细日志和手动确认）
  const autoFillAll = async () => {
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
      
      const allFields = formFields.map(field => ({
        value: field.value,
        searchTerms: field.searchTerms || [field.label]
      }));

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
        '无法执行自动填充，请使用手动复制方式。\n\n错误信息: ' + error.message,
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
            if (data.type === 'cloudflare_detected') {
              setShowCloudflareReminder(data.show);
              setShowVisualMask(data.mask || false);
            } else if (data.type === 'arrival_card_clicked') {
              console.log('✅ 已自动点击Arrival Card按钮');
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
      <Modal
        visible={showHelper}
        animationType="slide"
        onRequestClose={() => setShowHelper(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>复制助手</Text>
            <TouchableOpacity 
              onPress={() => setShowHelper(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕ 关闭</Text>
            </TouchableOpacity>
          </View>

          {/* Copy Helper Content */}
          <ScrollView style={styles.modalContent}>
        {/* Instructions */}
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionIcon}>💡</Text>
          <Text style={styles.instructionText}>
            点击⚡尝试自动填充网页，失败则点"复制"手动粘贴
          </Text>
        </View>

        {/* Step 1: Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.stepBadge}>1</Text>
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          {formFields
            .filter((f) => f.section === 'personal')
            .map((item) => renderCopyField(item))}
        </View>

        {/* Step 2: Trip Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.stepBadge}>2</Text>
            <Text style={styles.sectionTitle}>Trip & Accommodation</Text>
          </View>
          {formFields
            .filter((f) => f.section === 'trip')
            .map((item) => renderCopyField(item))}
        </View>

        {/* Step 3: Accommodation */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.stepBadge}>3</Text>
            <Text style={styles.sectionTitle}>Accommodation</Text>
          </View>
          {formFields
            .filter((f) => f.section === 'accommodation')
            .map((item) => renderCopyField(item))}
        </View>

        {/* Health Declaration Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>⚠️</Text>
          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>Step 4: Health Declaration</Text>
            <Text style={styles.noteText}>
              健康声明部分请根据实际情况在网页中选择 Yes 或 No
            </Text>
          </View>
        </View>

        {/* Final Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 完成后记得：</Text>
          <Text style={styles.tipsText}>
            • 提交后会收到确认邮件{'\n'}
            • 邮件中包含QR码{'\n'}
            • 截图保存QR码{'\n'}
            • 入境时出示QR码和护照
          </Text>
        </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Data Comparison Modal (DEV mode only) */}
      <Modal
        visible={showDataComparison}
        animationType="slide"
        onRequestClose={() => setShowDataComparison(false)}
        statusBarTranslucent={true}
      >
        <SafeAreaView style={styles.comparisonContainer}>
          <View style={styles.comparisonHeader}>
            <View style={styles.comparisonHeaderLeft}>
              <Text style={styles.comparisonTitle}>🔍 Data Comparison</Text>
              <Text style={styles.comparisonSubtitle}>Entry Info vs TDAC Submission</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowDataComparison(false)}
              style={styles.comparisonCloseButton}
              activeOpacity={0.7}
            >
              <Text style={styles.comparisonCloseButtonText}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          {comparisonData && (
            <ScrollView style={styles.comparisonContent} showsVerticalScrollIndicator={true}>
              {/* Summary Section */}
              <View style={styles.comparisonSection}>
                <Text style={styles.comparisonSectionTitle}>📊 Summary</Text>
                <View style={styles.comparisonSummary}>
                  <View style={styles.comparisonSummaryItem}>
                    <Text style={styles.comparisonSummaryLabel}>Total Fields:</Text>
                    <Text style={styles.comparisonSummaryValue}>{comparisonData.summary.totalFields}</Text>
                  </View>
                  <View style={styles.comparisonSummaryItem}>
                    <Text style={styles.comparisonSummaryLabel}>Valid Mappings:</Text>
                    <Text style={[
                      styles.comparisonSummaryValue,
                      { color: comparisonData.summary.accuracy >= 90 ? '#4CAF50' : comparisonData.summary.accuracy >= 70 ? '#FF9800' : '#F44336' }
                    ]}>
                      {comparisonData.summary.validFields}/{comparisonData.summary.totalFields} ({comparisonData.summary.accuracy}%)
                    </Text>
                  </View>
                  <View style={styles.comparisonSummaryItem}>
                    <Text style={styles.comparisonSummaryLabel}>Overall Status:</Text>
                    <Text style={[
                      styles.comparisonSummaryValue,
                      { color: comparisonData.validationResults.overall ? '#4CAF50' : '#F44336' }
                    ]}>
                      {comparisonData.validationResults.overall ? '✅ VALID' : '❌ ISSUES'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Field Mappings */}
              <View style={styles.comparisonSection}>
                <Text style={styles.comparisonSectionTitle}>🔄 Field Mappings</Text>
                {Object.entries(comparisonData.fieldMappings).map(([fieldName, mapping]) => (
                  <View key={fieldName} style={[
                    styles.comparisonFieldItem,
                    mapping.status === 'error' && styles.comparisonFieldItemError,
                    mapping.status === 'transformed' && styles.comparisonFieldItemWarning
                  ]}>
                    <View style={styles.comparisonFieldHeader}>
                      <Text style={styles.comparisonFieldName}>{fieldName}</Text>
                      <Text style={[
                        styles.comparisonFieldStatus,
                        { color: mapping.status === 'mapped' ? '#4CAF50' : mapping.status === 'transformed' ? '#FF9800' : '#F44336' }
                      ]}>
                        {mapping.status === 'mapped' ? '✅' : mapping.status === 'transformed' ? '🔄' : '❌'}
                      </Text>
                    </View>

                    <View style={styles.comparisonFieldRow}>
                      <Text style={styles.comparisonFieldLabel}>Source:</Text>
                      <Text style={styles.comparisonFieldSource}>{mapping.source}</Text>
                    </View>

                    <View style={styles.comparisonFieldRow}>
                      <Text style={styles.comparisonFieldLabel}>Original:</Text>
                      <Text style={styles.comparisonFieldOriginal}>{mapping.original}</Text>
                    </View>

                    <View style={styles.comparisonFieldRow}>
                      <Text style={styles.comparisonFieldLabel}>TDAC:</Text>
                      <Text style={styles.comparisonFieldTdac}>{mapping.tdac}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Validation Results */}
              <View style={styles.comparisonSection}>
                <Text style={styles.comparisonSectionTitle}>✨ Validation Results</Text>

                <Text style={styles.comparisonSubSectionTitle}>Personal Information:</Text>
                {Object.entries(comparisonData.validationResults.personalInfo).map(([field, validation]) => (
                  <View key={field} style={[
                    styles.comparisonValidationItem,
                    !validation.valid && styles.comparisonValidationItemError
                  ]}>
                    <Text style={styles.comparisonValidationField}>{field}</Text>
                    <Text style={[
                      styles.comparisonValidationStatus,
                      { color: validation.valid ? '#4CAF50' : '#F44336' }
                    ]}>
                      {validation.valid ? '✅' : '❌'}
                    </Text>
                    {!validation.valid && (
                      <View style={styles.comparisonValidationDetails}>
                        <Text style={styles.comparisonValidationOriginal}>Original: {validation.original}</Text>
                        <Text style={styles.comparisonValidationTdac}>TDAC: {validation.tdac}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* Complete Payload Preview */}
              <View style={styles.comparisonSection}>
                <Text style={styles.comparisonSectionTitle}>📋 Complete TDAC Payload</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.comparisonPayloadScroll}>
                  <Text style={styles.comparisonPayload}>
                    {JSON.stringify(comparisonData.tdacSubmissionData, null, 2)}
                  </Text>
                </ScrollView>
              </View>

              {/* Actions */}
              <View style={styles.comparisonActions}>
                <TouchableOpacity
                  style={styles.comparisonRefreshButton}
                  onPress={() => {
                    compareEntryDataWithTDAC();
                    addDebugLog('validation', 'Data comparison refreshed');
                  }}
                >
                  <Text style={styles.comparisonRefreshButtonText}>🔄 Refresh Comparison</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.comparisonExportButton}
                  onPress={() => {
                    const exportData = {
                      comparison: comparisonData,
                      exportedAt: new Date().toISOString(),
                      exportVersion: '1.0'
                    };

                    Clipboard.setString(JSON.stringify(exportData, null, 2));
                    Alert.alert('✅ Exported', 'Comparison data copied to clipboard');
                  }}
                >
                  <Text style={styles.comparisonExportButtonText}>📋 Export Data</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={showQrCode}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowQrCode(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContainer}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>🎫 TDAC 入境卡</Text>
              <TouchableOpacity 
                onPress={() => setShowQrCode(false)}
                style={styles.qrCloseButton}
              >
                <Text style={styles.qrCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {qrCodeData && (
              <View style={styles.qrCodeContent}>
                <Image 
                  source={{ uri: qrCodeData.src }}
                  style={styles.qrCodeImage}
                  resizeMode="contain"
                />
                <Text style={styles.qrHint}>
                  向海关出示此QR码即可快速入境
                </Text>
                <Text style={styles.qrSubHint}>
                  Show this QR code to immigration
                </Text>
                
                <View style={styles.qrInfo}>
                  <Text style={styles.qrInfoLabel}>姓名 Name:</Text>
                  <Text style={styles.qrInfoValue}>{passport?.nameEn || passport?.name}</Text>
                  
                  <Text style={styles.qrInfoLabel}>护照号 Passport:</Text>
                  <Text style={styles.qrInfoValue}>{passport?.passportNo}</Text>
                  
                  <Text style={styles.qrInfoLabel}>保存时间 Saved:</Text>
                  <Text style={styles.qrInfoValue}>
                    {qrCodeData.timestamp ? new Date(qrCodeData.timestamp).toLocaleString('zh-CN') : ''}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.qrSaveAgainButton}
                  onPress={() => saveToPhotoAlbum(qrCodeData.src)}
                >
                  <Text style={styles.qrSaveAgainButtonText}>📷 再次保存到相册</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 30,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: 20,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 2,
    borderColor: colors.primary,
    minWidth: 280,
  },
  loadingSpinnerContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  loadingPulse: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 50,
    backgroundColor: colors.primary,
    opacity: 0.2,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  loadingProgress: {
    width: '100%',
  },
  loadingProgressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgressFill: {
    height: '100%',
    width: '60%', // Animated progress
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  floatingButtonsContainer: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    gap: spacing.sm,
    zIndex: 25,
  },
  floatingButtonPrimary: {
    backgroundColor: '#FF9800',
    borderRadius: 16,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    minWidth: 140,
  },
  floatingButtonSecondary: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    minWidth: 140,
  },
  floatingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  floatingButtonTextContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  floatingButtonIcon: {
    fontSize: 24,
  },
  floatingButtonTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  floatingButtonSubtitle: {
    color: colors.white,
    fontSize: 10,
    opacity: 0.9,
    lineHeight: 12,
  },
  floatingButtonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: spacing.md,
    margin: spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  instructionIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
    fontWeight: '500',
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepBadge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 12,
    marginRight: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  fieldLeft: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  fieldLabelCn: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  autoFillButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  autoFillButtonActive: {
    backgroundColor: colors.success,
  },
  autoFillButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  copyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  copyButtonActive: {
    backgroundColor: colors.success,
  },
  copyButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: spacing.md,
    margin: spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  noteIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: spacing.xs,
  },
  noteText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  tipsCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    margin: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tipsText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  bottomPadding: {
    height: spacing.xl,
  },
  // QR Code Modal样式
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  qrModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  qrCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCloseButtonText: {
    fontSize: 20,
    color: colors.text,
  },
  qrCodeContent: {
    alignItems: 'center',
  },
  qrCodeImage: {
    width: 280,
    height: 280,
    marginVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
  },
  qrHint: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  qrSubHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  qrInfo: {
    width: '100%',
    backgroundColor: colors.lightBackground,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  qrInfoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  qrInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  qrSaveAgainButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  qrSaveAgainButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Enhanced Visual Masking System
  visualMaskContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1,
  },
  verificationWindow: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 20,
    borderWidth: 3,
    borderColor: '#4CAF50',
    zIndex: 2,
    minWidth: 320,
    maxWidth: '80%',
    marginBottom: 100, // Space for arrow
  },
  windowHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  windowIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  windowTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  windowSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  verificationContent: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  verificationPrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  verificationPromptEn: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  windowFooter: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    opacity: 0.8,
  },
  focusArrow: {
    position: 'absolute',
    bottom: 100,
    zIndex: 3,
  },
  focusArrowIcon: {
    fontSize: 36,
    color: '#4CAF50',
  },

  // Background blur overlay (fallback)
  backgroundBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  blurOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  // Enhanced Cloudflare提醒样式
  cloudflareReminder: {
    position: 'absolute',
    top: '45%', // 调整位置，给箭头留空间
    left: '50%',
    transform: [{ translateX: -150 }],
    width: 300,
    zIndex: 20,
    elevation: 20,
  },
  cloudflareContent: {
    backgroundColor: '#4CAF50',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 3,
    borderColor: '#fff',
  },
  cloudflareIconContainer: {
    marginBottom: spacing.sm,
  },
  cloudflareIcon: {
    fontSize: 40,
  },
  cloudflareTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  cloudflareTextCn: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  cloudflareTextEn: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.95,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  cloudflareSubtext: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  cloudflareArrow: {
    position: 'absolute',
    bottom: -20,
    left: '50%',
    transform: [{ translateX: -15 }],
  },
  cloudflareArrowIcon: {
    fontSize: 30,
    color: '#4CAF50',
  },
});



/**
 * 🛑 显示WebView自动填充确认对话框
 */
const showWebViewFillConfirmation = () => {
  return new Promise((resolve) => {
    const personalFields = formFields.filter(f => f.section === 'personal');
    const tripFields = formFields.filter(f => f.section === 'trip');
    const accommodationFields = formFields.filter(f => f.section === 'accommodation');
    
    const confirmationMessage = `
🔍 即将自动填充的信息：

👤 个人信息 (${personalFields.length}个字段):
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
};

/**
 * 显示WebView字段详情
 */
const showWebViewFieldDetails = (resolve) => {
  const fieldDetails = `
🔍 TDAC 网站字段映射详情：

📋 字段查找策略：
每个字段将尝试以下方式查找：
1. formcontrolname="${field.field}"
2. ng-reflect-name="${field.field}"
3. name="${field.field}"
4. placeholder包含"${field.label}"
5. label文本包含"${field.labelCn}"

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

export default TDACWebViewScreen;
