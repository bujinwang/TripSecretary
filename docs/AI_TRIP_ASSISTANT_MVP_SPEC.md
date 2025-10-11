# AI Trip Assistant - MVP Technical Specification

## MVP Scope

For the MVP (Minimum Viable Product), we'll focus on core features that provide immediate value:

1. **Conversational Chat Interface** ✓
2. **Basic Trip Planning** ✓
3. **Flight Search (Read-only)** ✓
4. **Hotel Recommendations** ✓
5. **Simple Itinerary Generation** ✓

**Excluded from MVP** (Phase 2):
- Direct booking functionality
- Payment processing
- Transportation booking
- Activity reservations
- Price tracking/alerts

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           React Native App              │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌─────────────────┐│
│  │ Chat Screen  │  │ Planning Screen ││
│  └──────┬───────┘  └────────┬────────┘│
│         │                   │          │
│  ┌──────▼──────────────────▼────────┐ │
│  │   AIAssistantService.js          │ │
│  │   - Manage conversations         │ │
│  │   - Intent recognition           │ │
│  │   - Context management           │ │
│  └──────┬──────────────────┬────────┘ │
│         │                  │           │
│  ┌──────▼─────┐    ┌──────▼─────────┐│
│  │  OpenAI    │    │  Booking APIs  ││
│  │  Service   │    │  - Flights     ││
│  └────────────┘    │  - Hotels      ││
│                    └────────────────┘ │
└─────────────────────────────────────────┘
```

## File Structure

```
app/
├── screens/
│   ├── AITripChatScreen.js          # Main chat interface
│   ├── TripPlanningDashboard.js     # Trip overview
│   ├── FlightResultsScreen.js       # Flight search results
│   └── HotelRecommendationsScreen.js # Hotel listings
│
├── components/
│   ├── chat/
│   │   ├── MessageBubble.js         # Chat message bubble
│   │   ├── MessageList.js           # Scrollable message list
│   │   ├── InputBar.js              # Message input
│   │   ├── QuickReplies.js          # Suggestion buttons
│   │   ├── TypingIndicator.js       # "AI is thinking..."
│   │   └── BookingCard.js           # Inline booking preview
│   │
│   └── planning/
│       ├── TripCard.js              # Trip summary card
│       ├── ItineraryTimeline.js     # Day-by-day view
│       ├── BudgetSummary.js         # Cost breakdown
│       └── ChecklistItem.js         # Todo items
│
├── services/
│   ├── ai/
│   │   ├── AIAssistantService.js    # Main orchestrator
│   │   ├── OpenAIService.js         # OpenAI API wrapper
│   │   ├── ConversationManager.js   # State management
│   │   ├── IntentRecognizer.js      # Parse user intents
│   │   └── PromptTemplates.js       # AI prompt templates
│   │
│   └── booking/
│       ├── FlightSearchService.js   # Flight search API
│       ├── HotelSearchService.js    # Hotel search API
│       └── ItineraryGenerator.js    # AI itinerary creation
│
├── models/
│   ├── Conversation.js              # Chat data model
│   ├── TripPlan.js                  # Trip plan model
│   └── Message.js                   # Message model
│
└── utils/
    ├── aiHelpers.js                 # AI utility functions
    └── travelDataParser.js          # Parse travel data
```

## Core Components Specification

### 1. AITripChatScreen.js

```javascript
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import AIAssistantService from '../services/ai/AIAssistantService';
import MessageBubble from '../components/chat/MessageBubble';
import InputBar from '../components/chat/InputBar';
import TypingIndicator from '../components/chat/TypingIndicator';
import QuickReplies from '../components/chat/QuickReplies';

const AITripChatScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const flatListRef = useRef(null);
  
  const aiService = AIAssistantService.getInstance();

  useEffect(() => {
    initializeConversation();
  }, []);

  const initializeConversation = async () => {
    // Load or create conversation
    const convId = await aiService.startConversation();
    setConversationId(convId);
    
    // Send welcome message
    const welcomeMsg = await aiService.getWelcomeMessage();
    addMessage(welcomeMsg);
  };

  const sendMessage = async (text) => {
    // Add user message
    addMessage({ role: 'user', content: text });
    
    setIsTyping(true);
    
    try {
      // Get AI response
      const response = await aiService.sendMessage(
        conversationId,
        text
      );
      
      // Add AI message
      addMessage(response);
      
      // Update quick replies if provided
      if (response.quickReplies) {
        setQuickReplies(response.quickReplies);
      }
      
      // Handle actions (e.g., flight search)
      if (response.action) {
        handleAction(response.action);
      }
    } catch (error) {
      console.error('AI error:', error);
      addMessage({
        role: 'assistant',
        content: '抱歉，我遇到了一个问题。请稍后再试。'
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleAction = async (action) => {
    switch (action.type) {
      case 'search_flights':
        // Navigate to flight search
        navigation.navigate('FlightResults', {
          params: action.params
        });
        break;
      case 'search_hotels':
        navigation.navigate('HotelRecommendations', {
          params: action.params
        });
        break;
      case 'create_itinerary':
        navigation.navigate('TripPlanningDashboard', {
          tripPlan: action.tripPlan
        });
        break;
    }
  };

  const addMessage = (message) => {
    setMessages(prev => [...prev, {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }]);
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={item => item.id}
      />
      
      {isTyping && <TypingIndicator />}
      
      {quickReplies.length > 0 && (
        <QuickReplies
          options={quickReplies}
          onPress={sendMessage}
        />
      )}
      
      <InputBar onSend={sendMessage} />
    </KeyboardAvoidingView>
  );
};

export default AITripChatScreen;
```

### 2. AIAssistantService.js

```javascript
import OpenAIService from './OpenAIService';
import ConversationManager from './ConversationManager';
import IntentRecognizer from './IntentRecognizer';
import FlightSearchService from '../booking/FlightSearchService';
import HotelSearchService from '../booking/HotelSearchService';
import ItineraryGenerator from '../booking/ItineraryGenerator';

class AIAssistantService {
  static instance = null;
  
  static getInstance() {
    if (!AIAssistantService.instance) {
      AIAssistantService.instance = new AIAssistantService();
    }
    return AIAssistantService.instance;
  }

  constructor() {
    this.openAI = new OpenAIService();
    this.conversationManager = new ConversationManager();
    this.intentRecognizer = new IntentRecognizer();
    this.flightSearch = new FlightSearchService();
    this.hotelSearch = new HotelSearchService();
    this.itineraryGen = new ItineraryGenerator();
  }

  async startConversation(userId = 'default') {
    return await this.conversationManager.create(userId);
  }

  async sendMessage(conversationId, userMessage) {
    // Store user message
    await this.conversationManager.addMessage(
      conversationId,
      'user',
      userMessage
    );

    // Get conversation context
    const context = await this.conversationManager.getContext(
      conversationId
    );

    // Recognize intent
    const intent = await this.intentRecognizer.recognize(
      userMessage,
      context
    );

    // Handle based on intent
    let response;
    switch (intent.type) {
      case 'trip_planning':
        response = await this.handleTripPlanning(intent, context);
        break;
      case 'flight_search':
        response = await this.handleFlightSearch(intent, context);
        break;
      case 'hotel_search':
        response = await this.handleHotelSearch(intent, context);
        break;
      case 'itinerary_create':
        response = await this.handleItineraryCreate(intent, context);
        break;
      case 'general_question':
        response = await this.handleGeneralQuestion(intent, context);
        break;
      default:
        response = await this.handleDefault(userMessage, context);
    }

    // Store assistant response
    await this.conversationManager.addMessage(
      conversationId,
      'assistant',
      response.content
    );

    // Update context if needed
    if (response.contextUpdate) {
      await this.conversationManager.updateContext(
        conversationId,
        response.contextUpdate
      );
    }

    return response;
  }

  async handleTripPlanning(intent, context) {
    const { destination, dates, travelers } = intent.params;

    // Generate planning response
    const aiResponse = await this.openAI.generateResponse({
      systemPrompt: this.getSystemPrompt(),
      userMessage: intent.originalMessage,
      context,
      action: 'trip_planning'
    });

    return {
      role: 'assistant',
      content: aiResponse.text,
      quickReplies: [
        '查看航班',
        '推荐酒店',
        '生成行程',
        '预算估算'
      ],
      contextUpdate: {
        destination,
        dates,
        travelers
      }
    };
  }

  async handleFlightSearch(intent, context) {
    const { origin, destination, date, passengers } = intent.params;

    try {
      // Search flights
      const flights = await this.flightSearch.search({
        origin: origin || context.userLocation,
        destination,
        date,
        passengers
      });

      // Generate AI summary
      const summary = await this.openAI.summarizeFlights(flights);

      return {
        role: 'assistant',
        content: summary,
        action: {
          type: 'search_flights',
          params: { flights }
        },
        contextUpdate: {
          searchedFlights: true,
          flightResults: flights.slice(0, 3) // Top 3
        }
      };
    } catch (error) {
      return {
        role: 'assistant',
        content: '抱歉，暂时无法搜索航班。请稍后再试。',
        quickReplies: ['重试', '人工客服']
      };
    }
  }

  async handleHotelSearch(intent, context) {
    const { destination, checkIn, checkOut, guests } = intent.params;

    try {
      const hotels = await this.hotelSearch.search({
        destination: destination || context.destination,
        checkIn,
        checkOut,
        guests
      });

      const summary = await this.openAI.summarizeHotels(hotels);

      return {
        role: 'assistant',
        content: summary,
        action: {
          type: 'search_hotels',
          params: { hotels }
        }
      };
    } catch (error) {
      return {
        role: 'assistant',
        content: '抱歉，暂时无法搜索酒店。请稍后再试。'
      };
    }
  }

  async handleItineraryCreate(intent, context) {
    const { destination, days } = intent.params;

    try {
      const itinerary = await this.itineraryGen.generate({
        destination: destination || context.destination,
        days,
        interests: context.userPreferences?.interests || []
      });

      return {
        role: 'assistant',
        content: `我为您生成了${days}天的行程规划 📋`,
        action: {
          type: 'create_itinerary',
          tripPlan: itinerary
        },
        quickReplies: ['查看详情', '修改行程', '保存行程']
      };
    } catch (error) {
      return {
        role: 'assistant',
        content: '生成行程时出错，请重试。'
      };
    }
  }

  async handleGeneralQuestion(intent, context) {
    // Use OpenAI for general Q&A
    const response = await this.openAI.generateResponse({
      systemPrompt: this.getSystemPrompt(),
      userMessage: intent.originalMessage,
      context
    });

    return {
      role: 'assistant',
      content: response.text
    };
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
      role: 'assistant',
      content: `你好！我是你的AI旅行助手 🌍

我可以帮你：
✈️ 搜索航班
🏨 推荐酒店
🗺️ 规划行程
💡 提供旅行建议

你想去哪里旅行？`,
      quickReplies: [
        '日本',
        '泰国',
        '韩国',
        '其他目的地'
      ]
    };
  }
}

export default AIAssistantService;
```

### 3. OpenAIService.js

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class OpenAIService {
  constructor() {
    this.apiKey = null;
    this.baseURL = 'https://api.openai.com/v1';
    this.model = 'gpt-4';
  }

  async initialize() {
    // Get API key from secure storage
    this.apiKey = await AsyncStorage.getItem('openai_api_key');
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
  }

  async generateResponse({ systemPrompt, userMessage, context, action }) {
    await this.initialize();

    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.buildContextMessages(context),
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'OpenAI API error');
      }

      return {
        text: data.choices[0].message.content,
        usage: data.usage
      };
    } catch (error) {
      console.error('OpenAI error:', error);
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
    
    if (context.dates) {
      messages.push({
        role: 'system',
        content: `旅行日期：${context.dates.start} 至 ${context.dates.end}`
      });
    }
    
    return messages;
  }

  async summarizeFlights(flights) {
    const flightList = flights.slice(0, 5).map((f, i) => 
      `${i + 1}. ${f.airline} ${f.flightNo}
      起飞：${f.departure.time} - 到达：${f.arrival.time}
      价格：¥${f.price}
      ${f.stops === 0 ? '直飞' : `${f.stops}次转机`}`
    ).join('\n\n');

    const prompt = `总结以下航班选项，突出最佳选择：\n\n${flightList}`;
    
    const response = await this.generateResponse({
      systemPrompt: '你是航班搜索助手，用简洁的语言总结航班选项。',
      userMessage: prompt,
      context: {}
    });

    return response.text;
  }

  async summarizeHotels(hotels) {
    const hotelList = hotels.slice(0, 5).map((h, i) =>
      `${i + 1}. ${h.name}
      位置：${h.location}
      评分：${h.rating}/5 (${h.reviews}条评价)
      价格：¥${h.pricePerNight}/晚`
    ).join('\n\n');

    const prompt = `总结以下酒店选项，突出性价比最好的：\n\n${hotelList}`;
    
    const response = await this.generateResponse({
      systemPrompt: '你是酒店推荐助手，用简洁的语言总结酒店选项。',
      userMessage: prompt,
      context: {}
    });

    return response.text;
  }
}

export default OpenAIService;
```

### 4. IntentRecognizer.js

```javascript
class IntentRecognizer {
  constructor() {
    // Intent patterns (can be replaced with ML model later)
    this.patterns = {
      trip_planning: [
        /我想去(.+)/,
        /计划.*旅行/,
        /去(.+)旅游/,
        /想.*去(.+)/
      ],
      flight_search: [
        /搜索.*航班/,
        /查.*机票/,
        /飞(.+)/,
        /(.+)到(.+).*航班/
      ],
      hotel_search: [
        /酒店/,
        /住宿/,
        /宾馆/,
        /找.*酒店/
      ],
      itinerary_create: [
        /行程/,
        /规划.*天/,
        /安排/,
        /怎么玩/
      ]
    };
  }

  async recognize(message, context) {
    // Try to match patterns
    for (const [intentType, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
          return {
            type: intentType,
            confidence: 0.9,
            params: this.extractParams(intentType, match, context),
            originalMessage: message
          };
        }
      }
    }

    // Default to general question
    return {
      type: 'general_question',
      confidence: 0.5,
      params: {},
      originalMessage: message
    };
  }

  extractParams(intentType, match, context) {
    switch (intentType) {
      case 'trip_planning':
        return {
          destination: match[1],
          dates: context.dates,
          travelers: context.travelers || 1
        };
      
      case 'flight_search':
        return {
          origin: context.userLocation,
          destination: match[1] || context.destination,
          date: context.dates?.start,
          passengers: context.travelers || 1
        };
      
      case 'hotel_search':
        return {
          destination: context.destination,
          checkIn: context.dates?.start,
          checkOut: context.dates?.end,
          guests: context.travelers || 1
        };
      
      case 'itinerary_create':
        return {
          destination: context.destination,
          days: this.extractDays(match[0]) || 7
        };
      
      default:
        return {};
    }
  }

  extractDays(text) {
    const match = text.match(/(\d+)天/);
    return match ? parseInt(match[1]) : null;
  }
}

export default IntentRecognizer;
```

## API Integration

### Mock APIs for MVP

For MVP, we'll use mock data instead of real APIs to avoid costs and complexity:

```javascript
// services/booking/FlightSearchService.js
class FlightSearchService {
  async search({ origin, destination, date, passengers }) {
    // Mock flight data
    return [
      {
        airline: '中国东方航空',
        flightNo: 'MU537',
        departure: { airport: 'PVG', time: '09:30' },
        arrival: { airport: 'NRT', time: '13:45' },
        duration: '3h 15m',
        stops: 0,
        price: 1280,
        available: true
      },
      {
        airline: 'ANA',
        flightNo: 'NH920',
        departure: { airport: 'PVG', time: '08:00' },
        arrival: { airport: 'HND', time: '12:05' },
        duration: '3h 5m',
        stops: 0,
        price: 1850,
        available: true
      },
      // More mock flights...
    ];
  }
}
```

### Real API Integration (Phase 2)

For production, we'll integrate:
- **Amadeus API** for flights
- **Booking.com API** for hotels
- **Google Places API** for locations

## Data Models

### Conversation Model
```javascript
class Conversation {
  constructor() {
    this.id = null;
    this.userId = null;
    this.messages = [];
    this.context = {
      destination: null,
      dates: { start: null, end: null },
      travelers: 1,
      budget: null,
      userLocation: null,
      userPreferences: {}
    };
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
```

### TripPlan Model
```javascript
class TripPlan {
  constructor() {
    this.id = null;
    this.userId = null;
    this.destination = null;
    this.startDate = null;
    this.endDate = null;
    this.travelers = 1;
    this.budget = {
      estimated: 0,
      actual: 0,
      currency: 'CNY'
    };
    this.itinerary = [];
    this.bookings = {
      flights: [],
      hotels: [],
      activities: []
    };
    this.status = 'planning'; // planning | booked | completed
    this.createdAt = new Date();
  }
}
```

## UI Components

### MessageBubble Component
```javascript
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <View style={[
      styles.bubble,
      isUser ? styles.userBubble : styles.aiBubble
    ]}>
      {!isUser && <Text style={styles.aiIcon}>🤖</Text>}
      <Text style={styles.messageText}>{message.content}</Text>
      <Text style={styles.timestamp}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
};
```

### QuickReplies Component
```javascript
const QuickReplies = ({ options, onPress }) => {
  return (
    <ScrollView horizontal style={styles.quickReplies}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={styles.quickReplyButton}
          onPress={() => onPress(option)}
        >
          <Text style={styles.quickReplyText}>{option}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};
```

## Testing Strategy

### Unit Tests
- AIAssistantService message handling
- IntentRecognizer pattern matching
- ConversationManager state management

### Integration Tests
- OpenAI API integration
- Booking API integration
- Navigation flow

### User Testing
- Conversation flow
- Response quality
- UI/UX feedback

## Deployment

### Environment Configuration
```javascript
// config/ai.config.js
export const AI_CONFIG = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    maxTokens: 500
  },
  features: {
    flightSearch: __DEV__, // Only in dev for MVP
    hotelSearch: __DEV__,
    realBooking: false // Phase 2
  }
};
```

### Performance Monitoring
- Track API response times
- Monitor token usage
- Log error rates
- Measure user satisfaction

## Next Steps

1. [ ] Set up OpenAI API account
2. [ ] Implement basic chat UI
3. [ ] Create mock booking services
4. [ ] Test conversation flows
5. [ ] User testing feedback
6. [ ] Iterate and improve

---

**Document Version**: 1.0
**Last Updated**: 2025-10-11
