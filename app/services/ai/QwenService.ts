import SecureTokenService from '../security/SecureTokenService';

const DEFAULT_MODEL = 'qwen-turbo';
const DASH_SCOPE_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

type AIContext = {
  destination?: string;
  dates?: {
    start?: string;
    end?: string;
  };
  travelers?: number;
  budget?: string;
  preferences?: string[];
  [key: string]: unknown;
};

type GenerationOptions = {
  systemPrompt?: string;
  userMessage: string;
  context?: AIContext;
  options?: Partial<{
    temperature: number;
    top_p: number;
    max_tokens: number;
    enable_search: boolean;
    [key: string]: unknown;
  }>;
};

type QwenMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type QwenAPIResponse = {
  output?: {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };
  usage?: unknown;
  code?: string;
  message?: string;
  detail?: string;
};

type GenerationResult = {
  text: string;
  usage?: unknown;
  raw: QwenAPIResponse | null;
};

type FlightSummary = {
  airline?: string;
  flightNo?: string;
  departure?: { time?: string };
  arrival?: { time?: string };
  price?: number;
  stops?: number;
};

type HotelSummary = {
  name?: string;
  location?: string;
  rating?: number;
  reviews?: number;
  pricePerNight?: number;
};

class QwenService {
  private apiKey: string | null = null;

  private model: string = DEFAULT_MODEL;

  private readonly baseURL: string = DASH_SCOPE_URL;

  private initialized = false;

  private initSuccess = false;

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return this.initSuccess;
    }

    try {
      const migrated = await SecureTokenService.migrateFromAsyncStorage(
        'qwen_api_key',
        SecureTokenService.QWEN_API_KEY
      );

      if (migrated) {
        console.log('✅ Qwen API key migrated from AsyncStorage to SecureStore');
      }

      this.apiKey = await SecureTokenService.getQwenAPIKey();
      this.initialized = true;
      this.initSuccess = true;
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('QwenService: failed to load stored API key', message);
      this.initialized = true;
      this.initSuccess = false;
      return false;
    }
  }

  async setApiKey(apiKey: string | null): Promise<void> {
    this.apiKey = apiKey;

    try {
      if (apiKey) {
        await SecureTokenService.saveQwenAPIKey(apiKey);
      } else {
        await SecureTokenService.deleteQwenAPIKey();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('QwenService: failed to persist API key', message);
    }
  }

  async clearApiKey(): Promise<void> {
    await this.setApiKey(null);
  }

  setModel(model: string): void {
    if (model) {
      this.model = model;
    }
  }

  async generateResponse({
    systemPrompt,
    userMessage,
    context = {},
    options = {}
  }: GenerationOptions): Promise<GenerationResult> {
    await this.initialize();

    if (!this.apiKey) {
      throw new Error('未配置 Qwen API Key，请在设置中填写后重试。');
    }

    if (!userMessage) {
      throw new Error('缺少用户输入');
    }

    const messages: QwenMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push(...this.buildContextMessages(context));
    messages.push({ role: 'user', content: userMessage });

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'disable'
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
            ...options
          }
        })
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
        raw: data
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('QwenService: generateResponse error', message);
      throw error;
    }
  }

  buildContextMessages(context: AIContext = {}): QwenMessage[] {
    const messages: QwenMessage[] = [];

    if (context.destination) {
      messages.push({
        role: 'system',
        content: `用户正在规划前往 ${context.destination} 的旅行。`
      });
    }

    if (context.dates?.start && context.dates?.end) {
      messages.push({
        role: 'system',
        content: `旅行日期：${context.dates.start} 至 ${context.dates.end}`
      });
    }

    if (typeof context.travelers === 'number') {
      messages.push({
        role: 'system',
        content: `出行人数：${context.travelers} 人`
      });
    }

    if (context.budget) {
      messages.push({
        role: 'system',
        content: `预算：${context.budget}`
      });
    }

    if (Array.isArray(context.preferences) && context.preferences.length) {
      messages.push({
        role: 'system',
        content: `偏好：${context.preferences.join('、')}`
      });
    }

    return messages;
  }

  async summarizeFlights(flights: FlightSummary[] = []): Promise<string> {
    if (!flights.length) {
      return '暂时没有可用的航班信息。';
    }

    const flightList = flights
      .slice(0, 5)
      .map((flight, index) => {
        const stopsText =
          flight.stops === 0
            ? '直飞'
            : `${flight.stops ?? 0} 次转机`;

        return `${index + 1}. ${flight.airline ?? '未知航空公司'} ${flight.flightNo ?? ''}
起飞：${flight?.departure?.time ?? '未知'} - 到达：${flight?.arrival?.time ?? '未知'}
价格：¥${flight.price ?? '未知'}
${stopsText}`;
      })
      .join('\n\n');

    const prompt = `总结以下航班选项，突出最佳选择：\n\n${flightList}`;

    const response = await this.generateResponse({
      systemPrompt: '你是航班搜索助手，用简洁的语言总结航班选项。',
      userMessage: prompt,
      context: {},
      options: { max_tokens: 400 }
    });

    return response.text;
  }

  async summarizeHotels(hotels: HotelSummary[] = []): Promise<string> {
    if (!hotels.length) {
      return '暂时没有可用的酒店信息。';
    }

    const hotelList = hotels
      .slice(0, 5)
      .map((hotel, index) => {
        return `${index + 1}. ${hotel.name ?? '未知酒店'}
位置：${hotel.location ?? '未知'}
评分：${hotel.rating ?? '未知'}/5 (${hotel.reviews ?? 0} 条评价)
价格：¥${hotel.pricePerNight ?? '未知'}/晚`;
      })
      .join('\n\n');

    const prompt = `总结以下酒店选项，突出性价比最好的：\n\n${hotelList}`;

    const response = await this.generateResponse({
      systemPrompt: '你是酒店推荐助手，用简洁的语言总结酒店选项。',
      userMessage: prompt,
      context: {},
      options: { max_tokens: 400 }
    });

    return response.text;
  }

  private async parseJSON(response: Response): Promise<QwenAPIResponse | null> {
    try {
      return (await response.json()) as QwenAPIResponse;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('QwenService: failed to parse JSON response', message);
      return null;
    }
  }
}

const qwenService = new QwenService();

export default qwenService;
