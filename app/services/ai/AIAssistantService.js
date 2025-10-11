// AIAssistantService - High level orchestrator for the TripSecretary AI assistant
import QwenService from './QwenService';

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

class AIAssistantService {
  constructor() {
    this.conversations = new Map();
  }

  /**
   * Create a new conversation session.
   * @param {Object} initialContext
   */
  async startConversation(initialContext = {}) {
    const conversationId = createId();
    const welcome = await this.getWelcomeMessage();

    this.conversations.set(conversationId, {
      context: {
        ...initialContext,
      },
      messages: [welcome],
    });

    return {
      conversationId,
      message: welcome,
    };
  }

  /**
   * Send user message and get assistant reply.
   * @param {string} conversationId
   * @param {string} userMessage
   * @param {Object} options
   */
  async sendMessage(conversationId, userMessage, options = {}) {
    if (!conversationId) {
      throw new Error('conversationId is required');
    }

    if (!userMessage) {
      throw new Error('userMessage is required');
    }

    const session = this.ensureConversation(conversationId);

    const userEntry = {
      id: createId(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    session.messages.push(userEntry);

    const response = await QwenService.generateResponse({
      systemPrompt: this.getSystemPrompt(),
      userMessage,
      context: session.context,
      options,
    });

    const assistantEntry = {
      id: createId(),
      role: 'assistant',
      content: response.text,
      usage: response.usage,
      createdAt: new Date().toISOString(),
    };
    session.messages.push(assistantEntry);

    return {
      message: assistantEntry,
      quickReplies: this.getDefaultQuickReplies(),
      raw: response.raw,
    };
  }

  /**
   * Update per-conversation context (e.g., destination, budget).
   * @param {string} conversationId
   * @param {Object} contextUpdate
   */
  updateContext(conversationId, contextUpdate) {
    const session = this.ensureConversation(conversationId);
    session.context = {
      ...session.context,
      ...contextUpdate,
    };
  }

  ensureConversation(conversationId) {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, {
        context: {},
        messages: [],
      });
    }
    return this.conversations.get(conversationId);
  }

  getSystemPrompt() {
    return `你是TripSecretary的AI旅行助手。
你的职责是帮助用户规划和预订旅行。

特点：
- 友好、热情
- 简洁明了
- 主动提供建议
- 耐心细致

能力：
- 搜索航班和酒店
- 创建行程
- 提供当地建议
- 回答签证/入境问题

限制：
- 不能直接完成付款（引导到合作网站）
- 不提供医疗/法律建议
- 必须核实旅行证件要求`;
  }

  async getWelcomeMessage() {
    return {
      id: createId(),
      role: 'assistant',
      content: `你好！我是你的AI旅行助手 🌍

我可以帮你：
✈️ 搜索航班
🏨 推荐酒店
🗺️ 规划行程
💡 提供旅行建议

你想去哪里旅行？`,
      quickReplies: this.getDefaultQuickReplies(),
      createdAt: new Date().toISOString(),
    };
  }

  getDefaultQuickReplies() {
    return ['查看航班', '推荐酒店', '生成行程', '预算估算'];
  }
}

export default new AIAssistantService();
