// TDAC API 拦截器 - 在浏览器Console运行此脚本
// 使用方法:
// 1. 打开 https://tdac.immigration.go.th
// 2. 打开 DevTools Console (F12)
// 3. 复制粘贴此脚本并回车
// 4. 填写并提交表单
// 5. 查看拦截到的API信息

(function() {
  console.log('%c🔍 TDAC API拦截器已启动', 'color: #00ff00; font-size: 20px; font-weight: bold;');
  console.log('%c请填写并提交表单，所有API调用将被记录', 'color: #00aaff; font-size: 14px;');
  
  // 存储所有API调用
  window.TDAC_API_CALLS = [];
  
  // 拦截 fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options = {}] = args;
    
    console.group('%c📤 Fetch Request', 'color: #ff9800; font-weight: bold;');
    console.log('URL:', url);
    console.log('Method:', options.method || 'GET');
    console.log('Headers:', options.headers);
    console.log('Body:', options.body);
    console.groupEnd();
    
    // 记录请求
    const requestData = {
      type: 'fetch',
      method: options.method || 'GET',
      url: url,
      headers: options.headers,
      body: options.body,
      timestamp: new Date().toISOString()
    };
    
    window.TDAC_API_CALLS.push(requestData);
    
    // 执行原始请求并拦截响应
    return originalFetch.apply(this, args).then(response => {
      const clonedResponse = response.clone();
      
      clonedResponse.json().then(data => {
        console.group('%c📥 Fetch Response', 'color: #4caf50; font-weight: bold;');
        console.log('URL:', url);
        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        console.log('Body:', data);
        console.groupEnd();
        
        // 记录响应
        const responseData = {
          type: 'fetch_response',
          url: url,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: data,
          timestamp: new Date().toISOString()
        };
        
        window.TDAC_API_CALLS.push(responseData);
        
        // 如果是提交API，高亮显示
        if (url.includes('submit') || url.includes('arrival-card') || data.qrCode || data.confirmationNumber) {
          console.log('%c🎯 找到关键API！', 'color: #ff0000; font-size: 18px; font-weight: bold;');
          console.log('请求:', requestData);
          console.log('响应:', responseData);
          
          // 显示通知
          alert('🎉 API已捕获！\n请查看Console获取详细信息');
        }
      }).catch(e => {
        // 如果不是JSON，尝试text
        clonedResponse.text().then(text => {
          console.group('%c📥 Fetch Response (Text)', 'color: #4caf50; font-weight: bold;');
          console.log('URL:', url);
          console.log('Status:', response.status);
          console.log('Body:', text.substring(0, 500));
          console.groupEnd();
        });
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
      console.group('%c📤 XHR Request', 'color: #ff9800; font-weight: bold;');
      console.log('Method:', this._interceptData.method);
      console.log('URL:', this._interceptData.url);
      console.log('Headers:', this._interceptData.headers);
      console.log('Body:', data);
      console.groupEnd();
      
      // 记录请求
      const requestData = {
        type: 'xhr',
        method: this._interceptData.method,
        url: this._interceptData.url,
        headers: this._interceptData.headers,
        body: data,
        timestamp: new Date().toISOString()
      };
      
      window.TDAC_API_CALLS.push(requestData);
      
      // 监听响应
      this.addEventListener('load', function() {
        let responseData;
        try {
          responseData = JSON.parse(this.responseText);
        } catch (e) {
          responseData = this.responseText;
        }
        
        console.group('%c📥 XHR Response', 'color: #4caf50; font-weight: bold;');
        console.log('URL:', this._interceptData.url);
        console.log('Status:', this.status);
        console.log('Headers:', this.getAllResponseHeaders());
        console.log('Body:', responseData);
        console.groupEnd();
        
        // 记录响应
        const response = {
          type: 'xhr_response',
          url: this._interceptData.url,
          status: this.status,
          headers: this.getAllResponseHeaders(),
          body: responseData,
          timestamp: new Date().toISOString()
        };
        
        window.TDAC_API_CALLS.push(response);
        
        // 检查是否是关键API
        const urlLower = this._interceptData.url.toLowerCase();
        const hasQR = typeof responseData === 'object' && 
                     (responseData.qrCode || responseData.confirmationNumber);
        
        if (urlLower.includes('submit') || urlLower.includes('arrival') || hasQR) {
          console.log('%c🎯 找到关键API！', 'color: #ff0000; font-size: 18px; font-weight: bold;');
          console.log('请求:', requestData);
          console.log('响应:', response);
          
          alert('🎉 API已捕获！\n请查看Console获取详细信息');
        }
      }.bind(this));
    }
    
    return originalSend.apply(this, arguments);
  };
  
  // 添加导出功能
  window.exportTDACAPI = function() {
    const data = JSON.stringify(window.TDAC_API_CALLS, null, 2);
    
    // 复制到剪贴板
    const textarea = document.createElement('textarea');
    textarea.value = data;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    console.log('%c✅ API数据已复制到剪贴板！', 'color: #00ff00; font-size: 16px;');
    console.log('共', window.TDAC_API_CALLS.length, '条记录');
    
    // 下载文件
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tdac_api_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ API数据已复制到剪贴板并下载！\n共 ' + window.TDAC_API_CALLS.length + ' 条记录');
  };
  
  // 添加快捷导出按钮
  const exportButton = document.createElement('button');
  exportButton.innerHTML = '📤 导出API数据';
  exportButton.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 999999;
    padding: 15px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    transition: transform 0.2s;
  `;
  exportButton.onmouseover = function() {
    this.style.transform = 'scale(1.05)';
  };
  exportButton.onmouseout = function() {
    this.style.transform = 'scale(1)';
  };
  exportButton.onclick = window.exportTDACAPI;
  document.body.appendChild(exportButton);
  
  // 显示计数器
  const counter = document.createElement('div');
  counter.id = 'tdac-api-counter';
  counter.style.cssText = `
    position: fixed;
    top: 60px;
    right: 10px;
    z-index: 999999;
    padding: 10px 15px;
    background: rgba(0,0,0,0.8);
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
  `;
  counter.innerHTML = '🔍 拦截: 0 个API';
  document.body.appendChild(counter);
  
  // 更新计数器
  setInterval(() => {
    const count = window.TDAC_API_CALLS.filter(c => c.type.includes('request')).length;
    counter.innerHTML = `🔍 拦截: ${count} 个API`;
    
    if (count > 0) {
      counter.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
    }
  }, 500);
  
  // 提取Cloudflare token
  window.getCloudflareToken = function() {
    const cookie = document.cookie.match(/cf_clearance=([^;]+)/);
    const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]')?.value;
    const localStorage = window.localStorage.getItem('cf_token');
    const sessionStorage = window.sessionStorage.getItem('cf_token');
    
    console.group('%c🔑 Cloudflare Token', 'color: #ff9800; font-weight: bold;');
    console.log('cf_clearance (Cookie):', cookie?.[1] || '未找到');
    console.log('turnstile-response:', turnstileResponse || '未找到');
    console.log('localStorage:', localStorage || '未找到');
    console.log('sessionStorage:', sessionStorage || '未找到');
    console.log('所有Cookies:', document.cookie);
    console.groupEnd();
    
    return {
      cf_clearance: cookie?.[1],
      turnstile: turnstileResponse,
      localStorage: localStorage,
      sessionStorage: sessionStorage,
      allCookies: document.cookie
    };
  };
  
  // 使用说明
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');
  console.log('%c使用方法:', 'color: #00aaff; font-size: 16px; font-weight: bold;');
  console.log('1. 填写并提交TDAC表单');
  console.log('2. 所有API调用会自动记录');
  console.log('3. 点击右上角"📤 导出API数据"按钮');
  console.log('4. 数据会复制到剪贴板并下载');
  console.log('');
  console.log('%c快捷命令:', 'color: #00aaff; font-size: 16px; font-weight: bold;');
  console.log('exportTDACAPI()      - 导出所有API数据');
  console.log('getCloudflareToken() - 获取Cloudflare Token');
  console.log('TDAC_API_CALLS       - 查看所有拦截的API');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');
  
})();
