import QwenService from './QwenService';

const createId = (): string => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

type ConversationRole = 'user' | 'assistant';

type ConversationMessage = {
  id: string;
  role: ConversationRole;
  content: string;
  createdAt: string;
  usage?: unknown;
  quickReplies?: string[];
};

type ConversationSession = {
  context: Record<string, unknown>;
  messages: ConversationMessage[];
};

type SendMessageOptions = GenerationOptions['options'];

type StartConversationResult = {
  conversationId: string;
  message: ConversationMessage;
};

type SendMessageResult = {
  message: ConversationMessage;
  quickReplies: string[];
  raw: QwenAPIResponse | null;
};

type GenerationOptions = Parameters<typeof QwenService.generateResponse>[0];
type QwenAPIResponse = ReturnType<typeof QwenService.generateResponse> extends Promise<infer R>
  ? R extends { raw: infer Raw }
    ? Raw
    : null
  : null;

class AIAssistantService {
  private readonly conversations: Map<string, ConversationSession> = new Map();

  async startConversation(initialContext: Record<string, unknown> = {}): Promise<StartConversationResult> {
    const conversationId = createId();
    const welcome = await this.getWelcomeMessage();

    this.conversations.set(conversationId, {
      context: { ...initialContext },
      messages: [welcome]
    });

    return {
      conversationId,
      message: welcome
    };
  }

  async sendMessage(
    conversationId: string,
    userMessage: string,
    options: SendMessageOptions = {}
  ): Promise<SendMessageResult> {
    if (!conversationId) {
      throw new Error('conversationId is required');
    }

    if (!userMessage) {
      throw new Error('userMessage is required');
    }

    const session = this.ensureConversation(conversationId);

    const userEntry: ConversationMessage = {
      id: createId(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString()
    };
    session.messages.push(userEntry);

    const response = await QwenService.generateResponse({
      systemPrompt: this.getSystemPrompt(),
      userMessage,
      context: session.context,
      options
    });

    const assistantEntry: ConversationMessage = {
      id: createId(),
      role: 'assistant',
      content: response.text,
      usage: response.usage,
      createdAt: new Date().toISOString()
    };
    session.messages.push(assistantEntry);

    const quickReplies = this.getDefaultQuickReplies();

    return {
      message: assistantEntry,
      quickReplies,
      raw: response.raw
    };
  }

  updateContext(conversationId: string, contextUpdate: Record<string, unknown>): void {
    const session = this.ensureConversation(conversationId);
    session.context = {
      ...session.context,
      ...contextUpdate
    };
  }

  private ensureConversation(conversationId: string): ConversationSession {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, {
        context: {},
        messages: []
      });
    }
    return this.conversations.get(conversationId) as ConversationSession;
  }

  private getSystemPrompt(): string {
    return `你是BorderBuddy的AI旅行助手。
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

  private async getWelcomeMessage(): Promise<ConversationMessage> {
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
      createdAt: new Date().toISOString()
    };
  }

  private getDefaultQuickReplies(): string[] {
    return ['查看航班', '推荐酒店', '生成行程', '预算估算'];
  }
}

const aiAssistantService = new AIAssistantService();

export default aiAssistantService;
