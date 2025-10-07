/**
 * Real Qwen AI Service Implementation (通义千问)
 * 
 * Documentation: https://help.aliyun.com/zh/dashscope/
 * 
 * Supports:
 * - Entry form generation with structured output
 * - Destination-specific prompts
 * - JSON mode for reliable parsing
 */

interface QwenConfig {
  apiKey: string;
  model?: string; // Default: qwen-turbo
  baseURL?: string;
}

interface GenerationInput {
  passport: any;
  destination: any;
  travelInfo: any;
}

export class QwenAIReal {
  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(config: QwenConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'qwen-turbo';
    this.baseURL = config.baseURL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
  }

  /**
   * Generate entry form data using Qwen AI
   */
  async generateEntryForm(data: GenerationInput): Promise<any> {
    const { passport, destination, travelInfo } = data;
    
    // Build the prompt
    const prompt = this.buildPrompt(passport, destination, travelInfo);
    
    // Call Qwen API
    const response = await this.callQwenAPI(prompt);
    
    // Parse and validate response
    const entryForm = this.parseResponse(response, destination);
    
    return entryForm;
  }

  /**
   * Build destination-specific prompt
   */
  private buildPrompt(passport: any, destination: any, travelInfo: any): string {
    const basePrompt = `
你是一个专业的出境旅行助手。请根据以下信息，生成目的地入境表格的填写内容。

## 护照信息：
- 姓名：${passport.name}
- 英文名：${passport.name_en || passport.nameEn}
- 护照号：${passport.passport_no || passport.passportNo}
- 性别：${passport.gender}
- 出生日期：${passport.birth_date || passport.birthDate}
- 国籍：${passport.nationality}
- 护照签发日期：${passport.issue_date || passport.issueDate}
- 护照到期日期：${passport.expiry_date || passport.expiryDate}

## 旅行信息：
- 目的地：${destination.name} (${destination.nameEn || destination.id.toUpperCase()})
- 航班号：${travelInfo.flightNumber}
- 抵达日期：${travelInfo.arrivalDate}
- 酒店名称：${travelInfo.hotelName}
- 酒店地址：${travelInfo.hotelAddress || ''}
- 联系电话：${travelInfo.contactPhone || ''}
- 停留时长：${travelInfo.stayDuration || ''}天
- 旅行目的：${travelInfo.travelPurpose || '旅游'}
`;

    // Add destination-specific requirements
    const destinationPrompt = this.getDestinationPrompt(destination.id);
    
    const outputFormat = `
## 输出要求：
请以JSON格式输出，包含以下字段：
{
  "fullName": "护照上的英文全名",
  "passportNumber": "护照号",
  "nationality": "国籍（英文）",
  "dateOfBirth": "出生日期（YYYY-MM-DD）",
  "flightNumber": "航班号",
  "arrivalDate": "抵达日期（YYYY-MM-DD）",
  "accommodation": {
    "name": "酒店名称",
    "address": "酒店地址（英文）",
    "phone": "联系电话"
  },
  "stayDuration": "停留天数",
  "purposeOfVisit": "旅行目的（英文简称）"${destinationPrompt}
}

注意：
1. 所有英文字段必须全部大写（如护照要求）
2. 日期格式统一为 YYYY-MM-DD
3. 酒店地址需翻译成英文
4. 旅行目的使用英文：Tourism, Business, Visit Family, Transit 等
5. 确保所有字段都有值，没有的用 "N/A" 填充
`;

    return basePrompt + outputFormat;
  }

  /**
   * Get destination-specific prompt additions
   */
  private getDestinationPrompt(destinationId: string): string {
    const prompts: Record<string, string> = {
      'th': `,
  "healthDeclaration": {
    "hasFever": "是否有发热症状（是/否）",
    "hasSymptoms": "是否有其他症状（是/否）"
  }`,
      'us': `,
  "customsDeclaration": {
    "carryingCash": "携带现金金额（USD）",
    "carryingFood": "是否携带食品（是/否）",
    "carryingMedicine": "是否携带药品（是/否）"
  },
  "usAddress": {
    "street": "在美地址街道",
    "city": "城市",
    "state": "州",
    "zipCode": "邮编"
  }`,
      'hk': `,
  "occupation": "职业（英文）",
  "lastDeparture": "上次离境日期（YYYY-MM-DD，首次入境填N/A）"`,
      'tw': `,
  "contactInTaiwan": {
    "name": "在台联系人姓名",
    "phone": "在台联系人电话",
    "address": "在台联系人地址"
  }`,
      'sg': `,
  "sgAddress": "在新加坡的地址",
  "employmentStatus": "就业状态（Employed/Self-employed/Student等）"`,
      'jp': `,
  "jpAddress": "在日本的地址（日文或英文）",
  "occupation": "职业（英文）",
  "sponsorInJapan": "在日担保人（如有）"`,
    };

    return prompts[destinationId] || '';
  }

  /**
   * Call Qwen API
   */
  private async callQwenAPI(prompt: string): Promise<any> {
    const requestBody = {
      model: this.model,
      input: {
        messages: [
          {
            role: 'system',
            content: '你是一个专业的出境旅行助手，擅长根据护照和旅行信息生成准确的入境表格内容。你的回复必须是有效的JSON格式。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      parameters: {
        result_format: 'message', // Get structured output
        temperature: 0.3, // Lower temperature for more consistent output
        top_p: 0.8,
        max_tokens: 2000,
        enable_search: false, // Don't need web search
      },
    };

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Qwen API Error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    if (result.code) {
      throw new Error(`Qwen API Error: ${result.code} - ${result.message}`);
    }

    return result;
  }

  /**
   * Parse AI response and extract JSON
   */
  private parseResponse(response: any, destination: any): any {
    const output = response.output;
    const message = output.choices[0].message.content;
    
    // Extract JSON from response (might be wrapped in markdown code blocks)
    let jsonStr = message;
    
    // Remove markdown code blocks if present
    const jsonMatch = message.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    // Parse JSON
    try {
      const entryForm = JSON.parse(jsonStr);
      
      // Add metadata
      entryForm.destination = destination;
      entryForm.generatedAt = new Date().toISOString();
      entryForm.model = this.model;
      entryForm.usage = output.usage; // Token usage info
      
      return entryForm;
    } catch (error) {
      throw new Error(`Failed to parse AI response as JSON: ${error.message}\nResponse: ${message}`);
    }
  }

  /**
   * Stream generation (for real-time updates)
   * TODO: Implement streaming for better UX
   */
  async generateEntryFormStream(data: GenerationInput, onChunk: (chunk: string) => void): Promise<any> {
    // Similar to generateEntryForm but with streaming
    // Will implement when needed for better UX
    throw new Error('Streaming not implemented yet');
  }
}

/**
 * Helper function to determine if API key is real or mock
 */
export function isRealAPIKey(apiKey: string): boolean {
  return apiKey !== 'mock-key' && !apiKey.startsWith('mock');
}

/**
 * Calculate approximate cost of API call
 */
export function calculateCost(usage: any, model: string): number {
  if (!usage) return 0;
  
  const costs: Record<string, { input: number; output: number }> = {
    'qwen-turbo': { input: 0.002, output: 0.006 }, // CNY per 1K tokens
    'qwen-plus': { input: 0.004, output: 0.012 },
    'qwen-max': { input: 0.04, output: 0.12 },
  };
  
  const pricing = costs[model] || costs['qwen-turbo'];
  const inputCost = (usage.input_tokens / 1000) * pricing.input;
  const outputCost = (usage.output_tokens / 1000) * pricing.output;
  
  return inputCost + outputCost; // In CNY
}
