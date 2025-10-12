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
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const TDACWebViewScreen = ({ navigation, route }) => {
  const { passport, destination, travelInfo } = route.params || {};
  const [showHelper, setShowHelper] = useState(false); // 控制浮动助手显示
  const [copiedField, setCopiedField] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCloudflareReminder, setShowCloudflareReminder] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null); // 存储QR码数据
  const [showQrCode, setShowQrCode] = useState(false); // 显示QR码模态框
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
      
      // 1. 保存到AsyncStorage（App内部存储）
      const storageKey = `tdac_qr_${passport?.passportNo}_${Date.now()}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify({
        ...qrData,
        passportNo: passport?.passportNo,
        name: passport?.nameEn || passport?.name,
        savedAt: new Date().toISOString()
      }));
      console.log('✅ QR码已保存到App');
      
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
      await MediaLibrary.createAlbumAsync('TripSecretary', asset, false);
      
      console.log('✅ QR码已保存到相册');
      return true;
      
    } catch (error) {
      console.error('保存到相册失败:', error);
      return false;
    }
  };

  // 检测Cloudflare验证框
  const checkCloudflareChallenge = () => {
    const jsCode = `
      (function() {
        try {
          // 检测Cloudflare验证框
          const hasCloudflare = document.body.innerHTML.includes('Verify you are human') ||
                               document.body.innerHTML.includes('cloudflare') ||
                               document.querySelector('iframe[src*="challenges.cloudflare.com"]');
          
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
          
          // 标记曾经有过Cloudflare验证框
          if (hasCloudflare) {
            window.hadCloudflare = true;
          }
          
          // 验证成功时立即隐藏提示框
          if (hasSuccess) {
            console.log('🎉 检测到验证成功！隐藏提示框');
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'cloudflare_detected',
              show: false
            }));
          }
          
          // 如果验证成功，尝试自动点击"Arrival Card"按钮
          if (hasSuccess && !window.arrivalCardClicked) {
            console.log('✅ Cloudflare验证成功，尝试自动点击Arrival Card');
            
            // 等待1.5秒让页面完全稳定，然后查找并点击按钮
            setTimeout(() => {
              // 多种方式查找"Arrival Card"按钮
              let arrivalCardBtn = null;
              
              // 方式1: 查找所有可点击元素，包括div、mat-card等
              const allElements = document.querySelectorAll('button, a, div, span, mat-card, [class*="card"], [class*="Card"]');
              console.log('🔍 查找按钮，共找到', allElements.length, '个候选元素');
              
              for (let el of allElements) {
                const text = (el.textContent || el.innerText || '').trim();
                // 匹配"Arrival Card"相关文本
                if (text.match(/arrival\s*card/i) || 
                    text.includes('Arrival Card') || 
                    text.includes('arrival card')) {
                  // 确保元素是可见且可点击的
                  const rect = el.getBoundingClientRect();
                  const isVisible = rect.width > 0 && rect.height > 0;
                  console.log('🎯 找到候选元素:', el.tagName, el.className, '可见:', isVisible, '文本:', text.substring(0, 50));
                  
                  if (isVisible) {
                    arrivalCardBtn = el;
                    console.log('✅ 找到Arrival Card元素:', el.tagName, el.className);
                    break;
                  }
                }
              }
              
              // 方式2: 尝试查找包含"Provide your Thailand"的元素（可能是卡片容器）
              if (!arrivalCardBtn) {
                console.log('🔍 尝试通过描述文本查找...');
                for (let el of allElements) {
                  const text = (el.textContent || el.innerText || '').trim();
                  if (text.includes('Provide your Thailand') || 
                      text.includes('Digital Arrival Card')) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                      arrivalCardBtn = el;
                      console.log('✅ 通过描述文本找到元素:', el.tagName, el.className);
                      break;
                    }
                  }
                }
              }
              
              if (arrivalCardBtn) {
                console.log('准备点击元素:', arrivalCardBtn.outerHTML.substring(0, 200));
                
                // 先滚动到元素位置，确保可见
                try {
                  arrivalCardBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } catch(e) {
                  console.log('滚动失败', e);
                }
                
                // 等待500ms让滚动完成
                setTimeout(() => {
                  // 检查元素类型和内部结构
                  console.log('元素标签:', arrivalCardBtn.tagName);
                  console.log('元素类名:', arrivalCardBtn.className);
                  console.log('是否有onclick:', arrivalCardBtn.onclick);
                  console.log('是否有子链接:', arrivalCardBtn.querySelector('a'));
                  
                  // 尝试多种点击方式
                  let clickSuccess = false;
                  
                  try {
                    // 方式1: 查找内部的链接或按钮
                    const innerBtn = arrivalCardBtn.querySelector('button') || 
                                    arrivalCardBtn.querySelector('a') ||
                                    arrivalCardBtn.querySelector('[role="button"]');
                    if (innerBtn) {
                      console.log('🎯 找到内部按钮:', innerBtn.tagName, innerBtn.href || innerBtn.onclick);
                      innerBtn.click();
                      clickSuccess = true;
                      console.log('✅ 方式1: 点击内部按钮 已执行');
                    }
                  } catch(e) {
                    console.log('方式1失败', e);
                  }
                  
                  try {
                    // 方式2: 直接跳转链接
                    const link = arrivalCardBtn.querySelector('a') || 
                                (arrivalCardBtn.tagName === 'A' ? arrivalCardBtn : null);
                    if (link && link.href) {
                      console.log('🚀 方式2: 直接跳转 href:', link.href);
                      window.location.href = link.href;
                      clickSuccess = true;
                    }
                  } catch(e) {
                    console.log('方式2失败', e);
                  }
                  
                  // 如果上面的方式都没成功，尝试模拟完整的鼠标点击序列
                  if (!clickSuccess) {
                    try {
                      // 方式3: 完整的鼠标事件序列
                      const rect = arrivalCardBtn.getBoundingClientRect();
                      const x = rect.left + rect.width / 2;
                      const y = rect.top + rect.height / 2;
                      
                      const mousedownEvent = new MouseEvent('mousedown', {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        clientX: x,
                        clientY: y
                      });
                      const mouseupEvent = new MouseEvent('mouseup', {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        clientX: x,
                        clientY: y
                      });
                      const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        clientX: x,
                        clientY: y
                      });
                      
                      arrivalCardBtn.dispatchEvent(mousedownEvent);
                      arrivalCardBtn.dispatchEvent(mouseupEvent);
                      arrivalCardBtn.dispatchEvent(clickEvent);
                      console.log('✅ 方式3: 完整鼠标序列 已执行');
                    } catch(e) {
                      console.log('方式3失败', e);
                    }
                    
                    try {
                      // 方式4: 触发触摸事件（移动端）
                      const rect = arrivalCardBtn.getBoundingClientRect();
                      const x = rect.left + rect.width / 2;
                      const y = rect.top + rect.height / 2;
                      
                      const touch = {
                        identifier: Date.now(),
                        target: arrivalCardBtn,
                        clientX: x,
                        clientY: y,
                        screenX: x,
                        screenY: y,
                        pageX: x,
                        pageY: y
                      };
                      
                      const touchStart = new TouchEvent('touchstart', {
                        bubbles: true,
                        cancelable: true,
                        touches: [touch],
                        targetTouches: [touch],
                        changedTouches: [touch]
                      });
                      const touchEnd = new TouchEvent('touchend', {
                        bubbles: true,
                        cancelable: true,
                        touches: [],
                        targetTouches: [],
                        changedTouches: [touch]
                      });
                      
                      arrivalCardBtn.dispatchEvent(touchStart);
                      setTimeout(() => {
                        arrivalCardBtn.dispatchEvent(touchEnd);
                        arrivalCardBtn.click(); // 最后尝试标准click
                      }, 50);
                      
                      console.log('✅ 方式4: 触摸事件序列 已执行');
                    } catch(e) {
                      console.log('方式4失败', e);
                    }
                  }
                  
                  window.arrivalCardClicked = true;
                  console.log('✅ 已尝试所有点击方式');
                  
                  // 标记需要自动填充
                  window.needAutoFill = true;
                  
                  window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'arrival_card_clicked'
                  }));
                }, 500);
              } else {
                console.log('⚠️ 未找到 Arrival Card 按钮');
                console.log('页面URL:', window.location.href);
                console.log('页面标题:', document.title);
                
                // 列出所有包含"card"的元素
                const cardElements = document.querySelectorAll('[class*="card"], [class*="Card"]');
                console.log('找到', cardElements.length, '个包含card的元素:');
                cardElements.forEach((el, i) => {
                  if (i < 5) { // 只显示前5个
                    const text = (el.textContent || '').trim().substring(0, 50);
                    console.log(i + 1, el.tagName, el.className, text);
                  }
                });
              }
            }, 1500);
          }
          
          // 只在验证未成功时发送提示框显示状态
          if (!hasSuccess) {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'cloudflare_detected',
              show: !!hasCloudflare
            }));
          }
          
          console.log('Cloudflare检测:', hasCloudflare ? '发现' : '未发现', '验证成功:', hasSuccess);
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

  // 自动填充所有字段 - 智能批量填充
  const autoFillAll = () => {
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
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>‹ 返回</Text>
        </TouchableOpacity>
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
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView HTTP error: ', nativeEvent);
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>正在加载TDAC网站...</Text>
          </View>
        )}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>正在加载TDAC网站...</Text>
        </View>
      )}

      {/* Cloudflare验证提醒 */}
      {showCloudflareReminder && (
        <View style={styles.cloudflareReminder}>
          <Text style={styles.cloudflareTextCn}>请点击下方的验证框</Text>
          <Text style={styles.cloudflareTextEn}>Please check the box below</Text>
          <Text style={styles.cloudflareIcon}>👇</Text>
        </View>
      )}

      {/* Floating Buttons */}
      <View style={styles.floatingButtonsContainer}>
        {/* 自动填充按钮 */}
        <TouchableOpacity 
          style={styles.floatingButtonPrimary}
          onPress={autoFillAll}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingButtonIcon}>⚡</Text>
          <Text style={styles.floatingButtonText}>自动填充</Text>
        </TouchableOpacity>
        
        {/* 复制助手按钮（备用） */}
        <TouchableOpacity 
          style={styles.floatingButtonSecondary}
          onPress={() => setShowHelper(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingButtonIcon}>📋</Text>
          <Text style={styles.floatingButtonText}>复制助手</Text>
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
    padding: spacing.xs,
  },
  backButtonText: {
    fontSize: 32,
    color: colors.primary,
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.md,
  },
  floatingButtonsContainer: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    gap: spacing.sm,
  },
  floatingButtonPrimary: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  floatingButtonSecondary: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  floatingButtonIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  floatingButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
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
  // Cloudflare提醒样式
  cloudflareReminder: {
    position: 'absolute',
    top: '50%', // 刚好在验证框上方
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -75 }],
    width: 300,
    backgroundColor: '#FF6B6B',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 3,
    borderColor: '#fff',
  },
  cloudflareIcon: {
    fontSize: 50,
    marginTop: spacing.sm, // 箭头在底部，向下指
  },
  cloudflareTextCn: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  cloudflareTextEn: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.95,
    textAlign: 'center',
  },
});

export default TDACWebViewScreen;
