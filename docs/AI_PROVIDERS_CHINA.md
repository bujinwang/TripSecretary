# AI Providers for China Market

## Overview

Since OpenAI (ChatGPT) is not accessible in mainland China, we need to use Chinese AI providers or create a hybrid approach. This document outlines the best options for the TripSecretary AI Trip Assistant.

## Top Chinese AI Providers

### 1. 通义千问 (Tongyi Qianwen) - Alibaba ⭐ RECOMMENDED

**Provider**: Alibaba Cloud (阿里云)
**Model**: 通义千问 (Qwen)
**Website**: https://tongyi.aliyun.com

#### Pros
- ✅ Excellent Chinese language understanding
- ✅ Fast response time in China
- ✅ Well-documented API
- ✅ Good pricing (cheaper than OpenAI)
- ✅ Strong in travel/commerce domain
- ✅ Alibaba ecosystem integration
- ✅ Enterprise support available

#### Cons
- ❌ English performance not as good as GPT-4
- ❌ Requires Chinese company/ID for API access
- ❌ Less flexibility in prompting

#### Pricing
- Free tier: 100,000 tokens/day
- Pay-as-you-go: ¥0.008/1K tokens (much cheaper than OpenAI)
- Monthly subscription available

#### API Example
```javascript
// Tongyi Qianwen API
const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'qwen-turbo',
    input: {
      messages: [
        { role: 'system', content: '你是旅行助手' },
        { role: 'user', content: '我想去日本' }
      ]
    },
    parameters: {
      result_format: 'message'
    }
  })
});
```

### 2. 文心一言 (ERNIE Bot) - Baidu

**Provider**: Baidu (百度)
**Model**: 文心一言 (ERNIE)
**Website**: https://yiyan.baidu.com

#### Pros
- ✅ Strong Chinese language capability
- ✅ Baidu search integration potential
- ✅ Good for Q&A and recommendations
- ✅ Enterprise-ready
- ✅ Reliable infrastructure

#### Cons
- ❌ API access requires approval
- ❌ More expensive than Alibaba
- ❌ Slower innovation cycle

#### Pricing
- Requires enterprise contract
- Estimated: ¥0.012/1K tokens

#### API Example
```javascript
// ERNIE Bot API
const response = await fetch('https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: '我想去日本旅游' }
    ]
  })
});
```

### 3. 智谱AI (ChatGLM) - Zhipu AI

**Provider**: 智谱AI
**Model**: ChatGLM-3
**Website**: https://open.bigmodel.cn

#### Pros
- ✅ Open-source roots (more transparent)
- ✅ Good Chinese and English balance
- ✅ Developer-friendly API
- ✅ Free tier available
- ✅ Fast iteration

#### Cons
- ❌ Smaller company (reliability concern)
- ❌ Less ecosystem support
- ❌ Newer in market

#### Pricing
- Free tier: 100 requests/day
- Standard: ¥0.005/1K tokens

#### API Example
```javascript
// ChatGLM API
const response = await fetch('https://open.bigmodel.cn/api/paas/v3/model-api/chatglm_turbo/sse-invoke', {
  method: 'POST',
  headers: {
    'Authorization': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: [
      { role: 'user', content: '帮我规划日本旅行' }
    ]
  })
});
```

### 4. 讯飞星火 (iFlytek Spark) - iFlytek

**Provider**: 科大讯飞
**Model**: 讯飞星火
**Website**: https://xinghuo.xfyun.cn

#### Pros
- ✅ Strong in voice/speech (potential for voice assistant)
- ✅ Good Chinese understanding
- ✅ Multi-modal capabilities
- ✅ Healthcare/education focus

#### Cons
- ❌ Travel domain not their strength
- ❌ More expensive
- ❌ Complex API

#### Pricing
- Pay-as-you-go: ¥0.018/1K tokens

### 5. Moonshot AI (月之暗面)

**Provider**: Moonshot AI
**Model**: Kimi
**Website**: https://www.moonshot.cn

#### Pros
- ✅ Long context window (200K tokens)
- ✅ Good for document processing
- ✅ Modern API design
- ✅ Fast response

#### Cons
- ❌ Newer company
- ❌ Limited track record
- ❌ Higher pricing

#### Pricing
- ¥0.012/1K tokens

## Recommended Solution: Hybrid Approach

### Strategy 1: Primary + Fallback (RECOMMENDED)

```
┌─────────────────────────────────────┐
│  TripSecretary AI Service           │
├─────────────────────────────────────┤
│                                     │
│  User Location Detection            │
│         │                           │
│    ┌────▼────┐                      │
│    │ China?  │                      │
│    └────┬────┘                      │
│         │                           │
│    ┌────▼─────────────┐             │
│    │                  │             │
│  Yes│               No│             │
│    │                  │             │
│    ▼                  ▼             │
│ 通义千问          OpenAI GPT-4       │
│ (Qwen)           (via proxy)        │
│                                     │
│  Both with fallback to each other   │
└─────────────────────────────────────┘
```

#### Implementation
```javascript
// services/ai/AIProviderManager.js
class AIProviderManager {
  constructor() {
    this.providers = {
      qwen: new QwenService(),      // Alibaba - China
      openai: new OpenAIService(),  // OpenAI - International
      ernie: new ErnieService()     // Baidu - Backup
    };
    this.primaryProvider = null;
  }

  async initialize() {
    // Detect user location
    const location = await this.detectLocation();
    
    if (location.country === 'CN') {
      this.primaryProvider = 'qwen';
      console.log('Using Tongyi Qianwen for China users');
    } else {
      this.primaryProvider = 'openai';
      console.log('Using OpenAI for international users');
    }
  }

  async generateResponse(prompt, context) {
    try {
      // Try primary provider
      return await this.providers[this.primaryProvider].generate(
        prompt, 
        context
      );
    } catch (error) {
      console.warn(`Primary provider ${this.primaryProvider} failed, trying fallback`);
      
      // Fallback to alternative
      const fallback = this.primaryProvider === 'qwen' ? 'ernie' : 'qwen';
      return await this.providers[fallback].generate(prompt, context);
    }
  }

  async detectLocation() {
    // Use IP geolocation or user's phone locale
    const locale = await AsyncStorage.getItem('user_locale');
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // China timezones
    if (timezone === 'Asia/Shanghai' || 
        timezone === 'Asia/Chongqing' ||
        locale?.startsWith('zh-CN')) {
      return { country: 'CN', region: 'Asia' };
    }
    
    return { country: 'OTHER', region: 'International' };
  }
}
```

### Strategy 2: Multi-Provider with Quality Check

```javascript
// Use multiple providers and compare responses
class MultiProviderService {
  async generateResponse(prompt, context) {
    // Send to both providers in parallel
    const [qwenResponse, openaiResponse] = await Promise.allSettled([
      this.qwen.generate(prompt, context),
      this.openai.generate(prompt, context)
    ]);

    // Return the best response based on criteria
    return this.selectBestResponse(qwenResponse, openaiResponse);
  }

  selectBestResponse(response1, response2) {
    // Logic to select better response
    // - Check confidence scores
    // - Validate format
    // - Check for errors
    return response1.status === 'fulfilled' ? response1.value : response2.value;
  }
}
```

## Recommended Architecture for TripSecretary

### Option A: Tongyi Qianwen Primary (Best for China Market)

```javascript
// services/ai/QwenService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class QwenService {
  constructor() {
    this.apiKey = null;
    this.baseURL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
    this.model = 'qwen-turbo'; // or 'qwen-plus' for better quality
  }

  async initialize() {
    this.apiKey = await AsyncStorage.getItem('qwen_api_key');
  }

  async generateResponse({ systemPrompt, userMessage, context }) {
    await this.initialize();

    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.buildContextMessages(context),
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'disable' // Disable streaming for simplicity
        },
        body: JSON.stringify({
          model: this.model,
          input: { messages },
          parameters: {
            result_format: 'message',
            temperature: 0.7,
            top_p: 0.8,
            max_tokens: 500
          }
        })
      });

      const data = await response.json();
      
      if (data.code) {
        throw new Error(`Qwen API error: ${data.message}`);
      }

      return {
        text: data.output.choices[0].message.content,
        usage: data.usage
      };
    } catch (error) {
      console.error('Qwen error:', error);
      throw error;
    }
  }

  buildContextMessages(context) {
    const messages = [];
    
    if (context.destination) {
      messages.push({
        role: 'system',
        content: `用户正在计划前往${context.destination}的旅行。`
      });
    }
    
    return messages;
  }
}

export default QwenService;
```

### Option B: Self-hosted Open Source Model

For maximum control and no censorship concerns:

**Models to Consider:**
- **ChatGLM-3-6B**: Can run on moderate hardware
- **Qwen-7B**: Open source version
- **Baichuan-13B**: Good Chinese performance

**Infrastructure:**
- Alibaba Cloud ECS (China)
- AWS China regions
- Hugging Face Inference API

```javascript
// Self-hosted model via API
class SelfHostedAIService {
  constructor() {
    this.baseURL = 'https://your-server.com/api/generate';
  }

  async generateResponse({ prompt, context }) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        context,
        max_length: 500,
        temperature: 0.7
      })
    });

    return await response.json();
  }
}
```

## Comparison Table

| Provider | Access in China | Price (¥/1K tokens) | Quality | API Ease | Recommendation |
|----------|----------------|---------------------|---------|----------|----------------|
| 通义千问 (Qwen) | ✅ Excellent | 0.008 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Primary** |
| 文心一言 (ERNIE) | ✅ Excellent | 0.012 | ⭐⭐⭐⭐ | ⭐⭐⭐ | Backup |
| 智谱AI (ChatGLM) | ✅ Good | 0.005 | ⭐⭐⭐ | ⭐⭐⭐⭐ | Budget option |
| Moonshot (Kimi) | ✅ Good | 0.012 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Alternative |
| OpenAI (GPT-4) | ❌ Blocked | 0.21 (est) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | International only |

## Updated Implementation Plan

### Phase 1: Tongyi Qianwen Integration

1. **Set up Alibaba Cloud Account**
   ```
   - Register at https://www.aliyun.com
   - Enable 通义千问 API
   - Get API key from DashScope console
   ```

2. **Update AIAssistantService**
   ```javascript
   // Use QwenService instead of OpenAIService
   import QwenService from './QwenService';
   
   class AIAssistantService {
     constructor() {
       this.aiProvider = new QwenService();
       // ... rest of code
     }
   }
   ```

3. **Test API Integration**
   - Verify API calls work
   - Test response quality
   - Measure latency
   - Monitor token usage

### Phase 2: Add Fallback Provider

1. **Implement ERNIE Bot** (Baidu) as backup
2. **Add automatic failover** logic
3. **Log provider usage** for analytics

### Phase 3: International Support

1. **Detect user location**
2. **Route to OpenAI** for non-China users
3. **Handle both providers** seamlessly

## Code Changes Required

### Update AI Service Selection

```javascript
// services/ai/AIAssistantService.js
import QwenService from './QwenService';
import OpenAIService from './OpenAIService';
import ErnieService from './ErnieService';

class AIAssistantService {
  static instance = null;
  
  static getInstance() {
    if (!AIAssistantService.instance) {
      AIAssistantService.instance = new AIAssistantService();
    }
    return AIAssistantService.instance;
  }

  constructor() {
    this.initializeProvider();
    // ... rest of existing code
  }

  async initializeProvider() {
    // Detect location and select provider
    const inChina = await this.isInChina();
    
    if (inChina) {
      this.aiProvider = new QwenService();
      this.fallbackProvider = new ErnieService();
      console.log('Using Tongyi Qianwen (China)');
    } else {
      this.aiProvider = new OpenAIService();
      this.fallbackProvider = new QwenService();
      console.log('Using OpenAI (International)');
    }
  }

  async isInChina() {
    const locale = await AsyncStorage.getItem('user_locale');
    return locale?.startsWith('zh-CN');
  }

  async generateResponse(params) {
    try {
      return await this.aiProvider.generateResponse(params);
    } catch (error) {
      console.warn('Primary AI provider failed, trying fallback');
      return await this.fallbackProvider.generateResponse(params);
    }
  }
}
```

## Cost Comparison

### Monthly Cost Estimates (10,000 active users)

**Scenario**: Average 10 messages per user per month, 300 tokens per message

- **Total tokens**: 10,000 users × 10 messages × 300 tokens = 30M tokens
- **Tongyi Qianwen**: ¥240 (~$33 USD)
- **ERNIE Bot**: ¥360 (~$50 USD)
- **OpenAI GPT-4**: ~$6,300 USD
- **Self-hosted**: Server costs ~$200-500/month

**Recommendation**: Use Tongyi Qianwen for 95% cost savings!

## Next Steps

1. **Register Alibaba Cloud Account** ✓
2. **Enable Tongyi Qianwen API** ✓
3. **Update codebase** to use QwenService
4. **Test thoroughly** with Chinese queries
5. **Monitor performance** and costs
6. **Add fallback provider** for reliability

## Additional Resources

- **Tongyi Qianwen Docs**: https://help.aliyun.com/zh/dashscope/
- **ERNIE Bot Docs**: https://cloud.baidu.com/doc/WENXINWORKSHOP/
- **ChatGLM Docs**: https://open.bigmodel.cn/dev/api
- **Comparison Guide**: https://github.com/chinese-llm-comparison

---

**Recommendation**: Use **通义千问 (Tongyi Qianwen)** as primary provider for China market with **ERNIE Bot** as fallback. This provides:
- ✅ Reliable access in China
- ✅ 95% cost savings vs OpenAI
- ✅ Good Chinese language performance
- ✅ Fast response times
- ✅ Enterprise support

**Status**: Ready to update implementation
**Action Required**: Approve provider change and proceed with integration
