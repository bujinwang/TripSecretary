// TDAC API拦截器 - 用于分析和捕获真实API调用
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, spacing } from '../../theme';
import { useTranslation } from '../../i18n/LocaleContext';

const TDACAPIInterceptScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [apiCalls, setApiCalls] = useState([]);
  const [showCloudflareReminder, setShowCloudflareReminder] = useState(false);
  const webViewRef = useRef(null);

  // 拦截网络请求的JavaScript
  const interceptScript = `
    (function() {
      console.log('🔍 API拦截器已注入');
      
      // 拦截 fetch
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options = {}] = args;
        
        console.log('📡 Fetch Request:', {
          url,
          method: options.method || 'GET',
          headers: options.headers,
          body: options.body
        });
        
        // 发送到React Native
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'api_request',
          method: 'fetch',
          url: url,
          requestMethod: options.method || 'GET',
          headers: options.headers,
          body: options.body,
          timestamp: new Date().toISOString()
        }));
        
        // 执行原始请求并拦截响应
        return originalFetch.apply(this, args).then(response => {
          // 克隆响应以便读取
          const clonedResponse = response.clone();
          
          clonedResponse.text().then(responseText => {
            console.log('📥 Fetch Response:', {
              url,
              status: response.status,
              headers: Object.fromEntries(response.headers.entries()),
              body: responseText.substring(0, 500)
            });
            
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'api_response',
              method: 'fetch',
              url: url,
              status: response.status,
              headers: Object.fromEntries(response.headers.entries()),
              body: responseText,
              timestamp: new Date().toISOString()
            }));
          });
          
          return response;
        });
      };
      
      // 拦截 XMLHttpRequest
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;
      const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
      
      XMLHttpRequest.prototype.open = function(method, url) {
        this._interceptData = {
          method: method,
          url: url,
          headers: {}
        };
        return originalOpen.apply(this, arguments);
      };
      
      XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        if (this._interceptData) {
          this._interceptData.headers[header] = value;
        }
        return originalSetRequestHeader.apply(this, arguments);
      };
      
      XMLHttpRequest.prototype.send = function(data) {
        if (this._interceptData) {
          console.log('📡 XHR Request:', {
            method: this._interceptData.method,
            url: this._interceptData.url,
            headers: this._interceptData.headers,
            body: data
          });
          
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'api_request',
            method: 'xhr',
            url: this._interceptData.url,
            requestMethod: this._interceptData.method,
            headers: this._interceptData.headers,
            body: data,
            timestamp: new Date().toISOString()
          }));
          
          // 监听响应
          this.addEventListener('load', function() {
            console.log('📥 XHR Response:', {
              url: this._interceptData.url,
              status: this.status,
              headers: this.getAllResponseHeaders(),
              body: this.responseText.substring(0, 500)
            });
            
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'api_response',
              method: 'xhr',
              url: this._interceptData.url,
              status: this.status,
              headers: this.getAllResponseHeaders(),
              body: this.responseText,
              timestamp: new Date().toISOString()
            }));
          }.bind(this));
        }
        
        return originalSend.apply(this, arguments);
      };
      
      // 检测Cloudflare
      setInterval(() => {
        const hasCloudflare = document.body.innerHTML.includes('Verify you are human');
        const hasSuccess = document.body.innerHTML.includes('Success!');
        
        if (hasCloudflare && !hasSuccess) {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'cloudflare_detected',
            show: true
          }));
        } else if (hasSuccess) {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'cloudflare_detected',
            show: false
          }));
          
          // 提取可能的token
          const cookies = document.cookie;
          const localStorage = JSON.stringify(window.localStorage);
          const sessionStorage = JSON.stringify(window.sessionStorage);
          
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'auth_data',
            cookies: cookies,
            localStorage: localStorage,
            sessionStorage: sessionStorage
          }));
        }
      }, 2000);
    })();
    
    true; // 必须返回true
  `;

  // 处理WebView消息
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      console.log('📨 收到消息:', data.type);
      
      if (data.type === 'api_request' || data.type === 'api_response') {
        setApiCalls(prev => [...prev, data]);
        
        // 如果是关键API调用，高亮显示
        if (data.url?.includes('/submit') || 
            data.url?.includes('/arrival-card') ||
            data.url?.includes('/api/')) {
          console.log('🎯 发现关键API:', data);
        }
      } else if (data.type === 'cloudflare_detected') {
        setShowCloudflareReminder(data.show);
      } else if (data.type === 'auth_data') {
        console.log('🔑 认证数据:', data);
        Alert.alert(
          '认证数据已捕获',
          'Cookies和Storage数据已记录到console',
          [{ text: '查看Console' }]
        );
      }
    } catch (e) {
      console.error('消息解析错误:', e);
    }
  };

  // 复制API调用信息
  const copyAPICall = (call) => {
    const formatted = JSON.stringify(call, null, 2);
    Clipboard.setString(formatted);
    Alert.alert('已复制', 'API调用信息已复制到剪贴板');
  };

  // 导出所有API调用
  const exportAllCalls = () => {
    const formatted = JSON.stringify(apiCalls, null, 2);
    Clipboard.setString(formatted);
    Alert.alert(
      '导出成功',
      `已复制 ${apiCalls.length} 个API调用到剪贴板`,
      [{ text: '好的' }]
    );
  };

  // 注入拦截脚本
  useEffect(() => {
    if (webViewRef.current) {
      setTimeout(() => {
        webViewRef.current.injectJavaScript(interceptScript);
      }, 1000);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>TDAC API分析器</Text>
        <TouchableOpacity onPress={exportAllCalls}>
          <Text style={styles.exportButton}>导出({apiCalls.length})</Text>
        </TouchableOpacity>
      </View>

      {/* WebView */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: 'https://tdac.immigration.go.th' }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onLoadEnd={() => {
            webViewRef.current?.injectJavaScript(interceptScript);
          }}
        />
        
        {/* Cloudflare提醒 */}
        {showCloudflareReminder && (
          <View style={styles.cloudflareReminder}>
            <Text style={styles.cloudflareIcon}>👇</Text>
            <Text style={styles.cloudflareTextCn}>请点击下方的验证框</Text>
            <Text style={styles.cloudflareTextEn}>Please check the box below</Text>
            <Text style={styles.cloudflareHint}>
              验证后系统会自动捕获API调用
            </Text>
          </View>
        )}
      </View>

      {/* API调用列表 */}
      <View style={styles.apiListContainer}>
        <Text style={styles.apiListTitle}>
          拦截的API调用 ({apiCalls.length})
        </Text>
        <ScrollView style={styles.apiList}>
          {apiCalls.map((call, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.apiCallItem,
                call.type === 'api_request' ? styles.requestItem : styles.responseItem
              ]}
              onPress={() => copyAPICall(call)}
            >
              <Text style={styles.apiCallType}>
                {call.type === 'api_request' ? '📤 请求' : '📥 响应'}
              </Text>
              <Text style={styles.apiCallMethod}>
                {call.requestMethod || call.method} {call.url?.substring(0, 50)}...
              </Text>
              <Text style={styles.apiCallTime}>
                {new Date(call.timestamp).toLocaleTimeString('zh-CN')}
              </Text>
              {call.url?.includes('/submit') && (
                <Text style={styles.keyAPIBadge}>🎯 关键API</Text>
              )}
            </TouchableOpacity>
          ))}
          {apiCalls.length === 0 && (
            <Text style={styles.emptyText}>
              等待API调用...
              {'\n\n'}
              请在上方WebView中操作：
              {'\n'}1. 点击Cloudflare验证
              {'\n'}2. 填写并提交表单
              {'\n'}3. 系统会自动记录所有API
            </Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonText: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: '300',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  exportButton: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  cloudflareReminder: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -100 }],
    width: 300,
    backgroundColor: '#FF6B6B',
    padding: spacing.lg,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  cloudflareIcon: {
    fontSize: 50,
    marginBottom: spacing.sm,
  },
  cloudflareTextCn: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  cloudflareTextEn: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  cloudflareHint: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    marginTop: spacing.sm,
    opacity: 0.9,
  },
  apiListContainer: {
    height: 250,
    backgroundColor: colors.white,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  apiListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: spacing.md,
    backgroundColor: colors.lightBackground,
  },
  apiList: {
    flex: 1,
  },
  apiCallItem: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  requestItem: {
    backgroundColor: '#FFF3E0',
  },
  responseItem: {
    backgroundColor: '#E8F5E9',
  },
  apiCallType: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  apiCallMethod: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  apiCallTime: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  keyAPIBadge: {
    fontSize: 12,
    color: colors.success,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  emptyText: {
    padding: spacing.lg,
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 24,
  },
});

export default TDACAPIInterceptScreen;
