import { QwenAIReal, isRealAPIKey } from './qwen-ai-real';

// Qwen AI Service (Alibaba's AI model)
// Automatically uses real API when valid key is provided,
// otherwise falls back to mock data for development
export class QwenAI {
  private apiKey: string;
  private realClient: QwenAIReal | null;
  private useMock: boolean;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.useMock = !isRealAPIKey(apiKey);
    
    if (!this.useMock) {
      this.realClient = new QwenAIReal({
        apiKey,
        model: 'qwen-turbo', // Change to qwen-plus or qwen-max for better quality
      });
      console.log('✅ Using real Qwen AI API');
    } else {
      this.realClient = null;
      console.log('⚠️ Using mock AI data (set real API key to use Qwen)');
    }
  }

  async generateEntryForm(data: any): Promise<any> {
    const { passport, destination, travelInfo } = data;
    
    if (this.realClient) {
      return await this.realClient.generateEntryForm(data);
    }
    
    // Mock AI-generated entry form for development
    return {
      fullName: passport.name,
      passportNumber: passport.passport_no,
      nationality: passport.nationality || '中国',
      dateOfBirth: passport.birth_date,
      flightNumber: travelInfo.flightNumber,
      arrivalDate: travelInfo.arrivalDate,
      accommodation: {
        name: travelInfo.hotelName,
        address: travelInfo.hotelAddress,
        phone: travelInfo.contactPhone,
      },
      stayDuration: travelInfo.stayDuration,
      purposeOfVisit: travelInfo.travelPurpose,
      // Additional fields based on destination
      ...(destination.id === 'us' && {
        customsDeclaration: {
          carryingCash: travelInfo.cashAmount,
          carryingFood: travelInfo.carryingFood,
        }
      }),
      ...(destination.id === 'th' && {
        healthDeclaration: {
          hasFever: travelInfo.hasFever,
          hasSymptoms: '否',
        }
      }),
    };
  }
}
