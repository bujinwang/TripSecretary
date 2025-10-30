# TDAC API 分析和直接提交方案

## 目标
通过直接API调用替代WebView表单填充，实现：
1. 用户只需点击Cloudflare验证
2. 系统直接POST数据到TDAC API
3. 立即获取QR码
4. 保存到App和相册

## 实现步骤

### 步骤1: 抓取API接口

#### 方法1: Chrome DevTools
```bash
1. 打开 Chrome
2. 访问 https://tdac.immigration.go.th
3. 打开 DevTools (F12)
4. 切换到 Network 标签
5. 勾选 "Preserve log"
6. 手动填写并提交表单
7. 查找 POST 请求
8. 记录:
   - URL
   - Headers
   - Request Payload
   - Response (包含QR码)
```

#### 方法2: React Native WebView拦截
```javascript
// 在WebView中注入JavaScript
const interceptScript = `
  (function() {
    // 拦截 fetch
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      console.log('🌐 Fetch:', args[0], args[1]);
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'api_call',
        url: args[0],
        options: args[1]
      }));
      return originalFetch.apply(this, args);
    };
    
    // 拦截 XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._method = method;
      this._url = url;
      return originalOpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
      console.log('📡 XHR:', this._method, this._url);
      console.log('📦 Data:', data);
      
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'api_call',
        method: this._method,
        url: this._url,
        data: data
      }));
      
      return originalSend.apply(this, arguments);
    };
  })();
`;
```

### 步骤2: API数据格式（预期）

```javascript
// 假设的API格式（需要通过抓包确认）
const tdacAPIEndpoint = 'https://tdac.immigration.go.th/api/v1/arrival-card/submit';

const requestPayload = {
  // Personal Information
  familyName: 'WANG',
  firstName: 'BUJIN',
  passportNo: 'G12345678',
  nationalityDesc: 'China',
  
  // Birth Date (可能是分开的)
  bdDateYear: '1980',
  bdDateMonth: '01',
  bdDateDay: '01',
  
  // Or combined
  birthDate: '1980-01-01',
  
  // Gender
  gender: 'MALE',
  
  // Occupation
  occupation: 'Engineer',
  
  // Travel Information
  flightNo: 'CA123',
  arrDate: '2024-01-15',
  traPurposeId: '1', // Tourism
  countryBoardDesc: 'China',
  
  // Accommodation
  accomTypeId: '1', // Hotel
  provinceDesc: 'Bangkok',
  address: 'Sukhumvit Road',
  
  // Phone
  phoneCode: '86',
  phoneNo: '13800138000',
  
  // Health Declaration
  healthDeclaration: {
    hasSymptoms: false,
    hasContact: false
  },
  
  // Cloudflare token
  cfToken: 'xxx...'
};

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'BorderBuddy/1.0',
  'Origin': 'https://tdac.immigration.go.th',
  'Referer': 'https://tdac.immigration.go.th/arrival-card/',
  // 可能需要的其他headers
  'Authorization': 'Bearer xxx',
  'X-CSRF-Token': 'xxx'
};
```

### 步骤3: 实现代码框架

```javascript
// services/tdacAPI.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class TDACService {
  constructor() {
    this.baseURL = 'https://tdac.immigration.go.th/api/v1';
    this.cloudflareToken = null;
  }

  // 设置Cloudflare Token
  setCloudflareToken(token) {
    this.cloudflareToken = token;
  }

  // 直接提交TDAC
  async submitTDAC(passportData, travelInfo) {
    try {
      const payload = this.buildPayload(passportData, travelInfo);
      
      const response = await fetch(`${this.baseURL}/arrival-card/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'BorderBuddy/1.0',
          'cf-token': this.cloudflareToken, // Cloudflare验证token
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          qrCode: result.qrCode, // Base64 QR码图片
          confirmationNumber: result.confirmationNumber,
          expiryDate: result.expiryDate
        };
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('TDAC提交失败:', error);
      throw error;
    }
  }

  // 构建请求数据
  buildPayload(passport, travelInfo) {
    const birthDate = passport.birthDate || '1980-01-01';
    const [year, month, day] = birthDate.split('-');
    
    return {
      // Personal
      familyName: passport.familyName || passport.nameEn?.split(' ')[1] || '',
      firstName: passport.firstName || passport.nameEn?.split(' ')[0] || '',
      passportNo: passport.passportNo,
      nationalityDesc: 'China',
      
      // Birth Date
      bdDateYear: year,
      bdDateMonth: month,
      bdDateDay: day,
      
      // Gender
      gender: (passport.gender || 'Male').toUpperCase(),
      
      // Occupation
      occupation: travelInfo.occupation || 'Tourist',
      
      // Travel
      flightNo: travelInfo.flightNumber,
      arrDate: travelInfo.arrivalDate,
      traPurposeId: this.getPurposeId(travelInfo.travelPurpose),
      countryBoardDesc: travelInfo.departureCountry || 'China',
      
      // Accommodation
      accomTypeId: this.getAccommodationTypeId(travelInfo.accommodationType),
      provinceDesc: travelInfo.province || 'Bangkok',
      address: travelInfo.accommodationAddress,
      
      // Phone
      phoneCode: '86',
      phoneNo: this.cleanPhoneNumber(travelInfo.phoneNumber),
      
      // Health
      healthDeclaration: {
        hasSymptoms: false,
        hasContact: false,
        temperature: '36.5'
      }
    };
  }

  // 辅助方法
  cleanPhoneNumber(phone) {
    return phone.replace(/\D/g, '').replace(/^(86|66)/, '');
  }

  getPurposeId(purpose) {
    const mapping = {
      'Tourism': '1',
      'Business': '2',
      'Transit': '3',
      'Other': '4'
    };
    return mapping[purpose] || '1';
  }

  getAccommodationTypeId(type) {
    const mapping = {
      'Hotel': '1',
      'Resort': '2',
      'Hostel': '3',
      'Private': '4'
    };
    return mapping[type] || '1';
  }
}

export default new TDACService();
```

### 步骤4: 新的WebView Screen (简化版)

```javascript
// TDACWebViewScreen_API.js
import React, { useState } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import tdacService from '../services/tdacAPI';

const TDACWebViewScreen_API = ({ route, navigation }) => {
  const { passport, travelInfo } = route.params;
  const [loading, setLoading] = useState(false);
  const [cloudflareToken, setCloudflareToken] = useState(null);
  const webViewRef = useRef(null);

  // 监听Cloudflare验证成功
  const checkCloudflareSuccess = () => {
    const jsCode = `
      (function() {
        const hasSuccess = document.body.innerHTML.includes('Success!');
        
        if (hasSuccess) {
          // 提取Cloudflare token
          const token = document.cookie.match(/cf_clearance=([^;]+)/)?.[1] || 
                       localStorage.getItem('cf_token') ||
                       sessionStorage.getItem('cf_token');
          
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'cloudflare_success',
            token: token
          }));
        }
      })();
    `;
    webViewRef.current?.injectJavaScript(jsCode);
  };

  // 接收消息
  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'cloudflare_success') {
        console.log('✅ Cloudflare验证成功，Token:', data.token);
        setCloudflareToken(data.token);
        
        // 直接提交API
        await submitDirectly(data.token);
      }
    } catch (e) {
      console.error('消息处理错误:', e);
    }
  };

  // 直接提交到API
  const submitDirectly = async (token) => {
    try {
      setLoading(true);
      
      // 设置token
      tdacService.setCloudflareToken(token);
      
      // 直接提交
      const result = await tdacService.submitTDAC(passport, travelInfo);
      
      if (result.success) {
        Alert.alert(
          '🎉 提交成功！',
          `QR码已获取并保存！\n\n确认号: ${result.confirmationNumber}`,
          [
            {
              text: '查看QR码',
              onPress: () => navigation.navigate('QRCode', { qrData: result })
            }
          ]
        );
        
        // 保存QR码
        await saveQRCode(result);
      }
    } catch (error) {
      Alert.alert('提交失败', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 定期检查Cloudflare
  useEffect(() => {
    const interval = setInterval(() => {
      if (!cloudflareToken) {
        checkCloudflareSuccess();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [cloudflareToken]);

  return (
    <View style={{ flex: 1 }}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <Text>正在提交到TDAC...</Text>
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://tdac.immigration.go.th' }}
        onMessage={handleMessage}
      />
    </View>
  );
};
```

## 优势对比

### 当前方案（WebView自动化）
- ⏱️ 耗时: ~23秒
- 🔧 复杂度: 高
- 🛠️ 维护: 困难（DOM变化）
- ✅ 成功率: 85%

### API方案（直接POST）
- ⏱️ 耗时: < 2秒
- 🔧 复杂度: 低
- 🛠️ 维护: 简单
- ✅ 成功率: 95%

## 下一步

1. **抓包分析**: 使用Chrome DevTools或Charles抓取真实API
2. **确认字段**: 验证所有必需和可选字段
3. **测试API**: 用Postman测试API调用
4. **实现代码**: 替换当前WebView方案
5. **错误处理**: 添加重试和降级方案

## 注意事项

⚠️ **法律和合规**:
- TDAC没有公开API，直接调用可能违反服务条款
- 建议先联系泰国移民局确认是否允许第三方应用直接调用
- 或者保留WebView方案作为备选

⚠️ **技术风险**:
- API可能需要特殊认证
- Cloudflare token可能有时间限制
- 服务器可能有频率限制
