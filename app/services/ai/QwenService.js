// QwenService - Alibaba DashScope integration for the BorderBuddy AI assistant
import SecureTokenService from '../security/SecureTokenService';

const DEFAULT_MODEL = 'qwen-turbo';
const DASH_SCOPE_URL =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

class QwenService {
  constructor() {
    this.apiKey = null;
    this.model = DEFAULT_MODEL;
    this.baseURL = DASH_SCOPE_URL;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // SECURITY MIGRATION: Migrate from AsyncStorage to SecureStore (one-time)
      const migrated = await SecureTokenService.migrateFromAsyncStorage(
        'qwen_api_key',
        SecureTokenService.QWEN_API_KEY
      );

      if (migrated) {
        console.log('✅ Qwen API key migrated from AsyncStorage to SecureStore');
      }

      // Load API key from secure storage
      this.apiKey = await SecureTokenService.getQwenAPIKey();
    } catch (error) {
      console.warn('QwenService: failed to load stored API key', error);
    } finally {
      this.initialized = true;
    }
  }

  async setApiKey(apiKey) {
    this.apiKey = apiKey;

    try {
      if (apiKey) {
        // SECURITY: Use SecureStore instead of AsyncStorage for API keys
        await SecureTokenService.saveQwenAPIKey(apiKey);
      } else {
        await SecureTokenService.deleteQwenAPIKey();
      }
    } catch (error) {
      console.warn('QwenService: failed to persist API key', error);
    }
  }

  async clearApiKey() {
    await this.setApiKey(null);
  }

  setModel(model) {
    if (model) {
      this.model = model;
    }
  }

  /**
   * Generate a response from Qwen.
   *
   * @param {Object} params
   * @param {string} params.systemPrompt - System role instructions.
   * @param {string} params.userMessage - User message content.
   * @param {Object} [params.context] - Optional structured context for the conversation.
   * @param {Object} [params.options] - Override request parameters (temperature/top_p/max_tokens).
   */
  async generateResponse({
    systemPrompt,
    userMessage,
    context = {},
    options = {},
  }) {
    await this.initialize();

    if (!this.apiKey) {
      throw new Error('未配置 Qwen API Key，请在设置中填写后重试。');
    }

    if (!userMessage) {
      throw new Error('缺少用户输入');
    }

    const messages = [
      systemPrompt && { role: 'system', content: systemPrompt },
      ...this.buildContextMessages(context),
      { role: 'user', content: userMessage },
    ].filter(Boolean);

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'disable',
        },
        body: JSON.stringify({
          model: this.model,
          input: { messages },
          parameters: {
            result_format: 'message',
            temperature: 0.7,
            top_p: 0.8,
            max_tokens: 800,
            enable_search: false,
            ...options,
          },
        }),
      });

      const data = await this.parseJSON(response);

      if (!response.ok) {
        const message = data?.message || data?.detail || response.statusText;
        throw new Error(`Qwen API 请求失败：${message}`);
      }

      if (data?.code) {
        throw new Error(`Qwen API 错误：${data.message || data.code}`);
      }

      const text =
        data?.output?.choices?.[0]?.message?.content?.trim() ||
        '抱歉，我暂时无法回答，请稍后再试。';

      return {
        text,
        usage: data?.usage,
        raw: data,
      };
    } catch (error) {
      console.error('QwenService: generateResponse error', error);
      throw error;
    }
  }

  buildContextMessages(context = {}) {
    const messages = [];

    if (context.destination) {
      messages.push({
        role: 'system',
        content: `用户正在规划前往 ${context.destination} 的旅行。`,
      });
    }

    if (context.dates?.start && context.dates?.end) {
      messages.push({
        role: 'system',
        content: `旅行日期：${context.dates.start} 至 ${context.dates.end}`,
      });
    }

    if (context.travelers) {
      messages.push({
        role: 'system',
        content: `出行人数：${context.travelers} 人`,
      });
    }

    if (context.budget) {
      messages.push({
        role: 'system',
        content: `预算：${context.budget}`,
      });
    }

    if (Array.isArray(context.preferences) && context.preferences.length) {
      messages.push({
        role: 'system',
        content: `偏好：${context.preferences.join('、')}`,
      });
    }

    return messages;
  }

  async summarizeFlights(flights = []) {
    if (!flights.length) {
      return '暂时没有可用的航班信息。';
    }

    const flightList = flights
      .slice(0, 5)
      .map((flight, index) => {
        const stopsText =
          flight.stops === 0
            ? '直飞'
            : `${flight.stops} 次转机`;

        return `${index + 1}. ${flight.airline} ${flight.flightNo}
起飞：${flight?.departure?.time || '未知'} - 到达：${flight?.arrival?.time || '未知'}
价格：¥${flight.price || '未知'}
${stopsText}`;
      })
      .join('\n\n');

    const prompt = `总结以下航班选项，突出最佳选择：\n\n${flightList}`;

    const response = await this.generateResponse({
      systemPrompt: '你是航班搜索助手，用简洁的语言总结航班选项。',
      userMessage: prompt,
      context: {},
      options: { max_tokens: 400 },
    });

    return response.text;
  }

  async summarizeHotels(hotels = []) {
    if (!hotels.length) {
      return '暂时没有可用的酒店信息。';
    }

    const hotelList = hotels
      .slice(0, 5)
      .map((hotel, index) => {
        return `${index + 1}. ${hotel.name}
位置：${hotel.location || '未知'}
评分：${hotel.rating || '未知'}/5 (${hotel.reviews || 0} 条评价)
价格：¥${hotel.pricePerNight || '未知'}/晚`;
      })
      .join('\n\n');

    const prompt = `总结以下酒店选项，突出性价比最好的：\n\n${hotelList}`;

    const response = await this.generateResponse({
      systemPrompt: '你是酒店推荐助手，用简洁的语言总结酒店选项。',
      userMessage: prompt,
      context: {},
      options: { max_tokens: 400 },
    });

    return response.text;
  }

  async parseJSON(response) {
    try {
      return await response.json();
    } catch (error) {
      console.warn('QwenService: failed to parse JSON response', error);
      return null;
    }
  }
}

export default new QwenService();
