// API Client Service for BorderBuddy
import SecureTokenService from './security/SecureTokenService';
import logger from './LoggingService';

declare const __DEV__: boolean;

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8787' 
  : 'https://api.chujingtong.com';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface ApiError extends Error {
  status?: number;
  body?: any;
}

interface WechatLoginResponse {
  token?: string;
  [key: string]: any;
}

interface PhoneLoginResponse {
  token?: string;
  [key: string]: any;
}

interface FormDataFile {
  uri: string;
  type: string;
  name: string;
}

class ApiClient {
  token: string | null = null;

  async initialize(): Promise<void> {
    try {
      // SECURITY MIGRATION: Migrate from AsyncStorage to SecureStore (one-time)
      const migrated = await SecureTokenService.migrateFromAsyncStorage(
        'auth_token',
        SecureTokenService.AUTH_TOKEN_KEY
      );

      if (migrated) {
        logger.info('ApiClient', 'Auth token migrated from AsyncStorage to SecureStore');
      }

      // Load token from secure storage
      const token = await SecureTokenService.getAuthToken();
      if (token) {
        this.token = token;
      }
    } catch (error: any) {
      logger.error('ApiClient', 'Failed to load auth token', { error });
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      // SECURITY: Use SecureStore instead of AsyncStorage
      await SecureTokenService.saveAuthToken(token);
      // Only set in memory if save succeeds
      this.token = token;
    } catch (error: any) {
      logger.error('ApiClient', 'Failed to save auth token', { error });
      // Re-throw so caller knows save failed
      throw new Error('Failed to persist authentication. Please try logging in again.');
    }
  }

  async clearToken(): Promise<void> {
    try {
      // SECURITY: Use SecureStore instead of AsyncStorage
      await SecureTokenService.deleteAuthToken();
      this.token = null;
    } catch (error: any) {
      logger.error('ApiClient', 'Failed to clear auth token', { error });
      // Still clear from memory on logout attempt (best effort)
      this.token = null;
      // Don't throw - logout should still work even if storage clear fails
    }
  }

  async request(endpoint: string, options: RequestOptions = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        await this.clearToken();
        throw new Error('未授权，请重新登录');
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody.message || `API 错误: ${response.status}`;
        const error: ApiError = new Error(message);
        error.status = response.status;
        error.body = errorBody;
        throw error;
      }

      return response.json();
    } catch (error: any) {
      // 更友好的错误处理
      if (error.message.includes('Network request failed') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('ECONNREFUSED')) {
        throw new Error('网络连接失败，请检查网络设置');
      }
      throw error;
    }
  }

  // Authentication APIs
  async wechatLogin(code: string): Promise<WechatLoginResponse> {
    const result = await this.request('/api/auth/wechat', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    
    if (result.token) {
      await this.setToken(result.token);
    }
    
    return result;
  }

  async phoneLogin(phone: string, code: string): Promise<PhoneLoginResponse> {
    const result = await this.request('/api/auth/phone', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
    
    if (result.token) {
      await this.setToken(result.token);
    }
    
    return result;
  }

  async logout(): Promise<void> {
    await this.clearToken();
  }

  // OCR APIs
  async recognizePassport(imageUri: string): Promise<any> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'passport.jpg',
    } as any);

    return this.request('/api/ocr/passport', {
      method: 'POST',
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
      body: formData as any,
    });
  }

  async recognizeTicket(imageUri: string): Promise<any> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'ticket.jpg',
    } as any);

    return this.request('/api/ocr/ticket', {
      method: 'POST',
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
      body: formData as any,
    });
  }

  async recognizeHotel(imageUri: string): Promise<any> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'hotel.jpg',
    } as any);

    return this.request('/api/ocr/hotel', {
      method: 'POST',
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
      body: formData as any,
    });
  }

  // Generation APIs
  async generateEntryForm(data: Record<string, any>): Promise<any> {
    return this.request('/api/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkDuplicate(passportId: string, destinationId: string, flightNumber: string, arrivalDate: string): Promise<any> {
    const params = new URLSearchParams({
      passport_id: passportId,
      destination_id: destinationId,
      flight_number: flightNumber,
      arrival_date: arrivalDate,
    });

    return this.request(`/api/generate/check?${params}`, {
      method: 'GET',
    });
  }

  // History APIs
  async getHistory(limit: number = 50, offset: number = 0): Promise<any> {
    return this.request(`/api/history?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async getHistoryItem(id: string): Promise<any> {
    return this.request(`/api/history/${id}`, {
      method: 'GET',
    });
  }

  async deleteHistoryItem(id: string): Promise<any> {
    return this.request(`/api/history/${id}`, {
      method: 'DELETE',
    });
  }

  // Profile APIs
  async getProfile(): Promise<any> {
    return this.request('/api/profile', {
      method: 'GET',
    });
  }

  async updateProfile(data: Record<string, any>): Promise<any> {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Passport APIs
  async getPassports(): Promise<any> {
    return this.request('/api/passports', {
      method: 'GET',
    });
  }

  async savePassport(passportData: Record<string, any>): Promise<any> {
    return this.request('/api/passports', {
      method: 'POST',
      body: JSON.stringify(passportData),
    });
  }

  async deletePassport(id: string): Promise<any> {
    return this.request(`/api/passports/${id}`, {
      method: 'DELETE',
    });
  }

  async getTrendingDestinations({ campaign = 'national-day', limit = 12 }: { campaign?: string; limit?: number } = {}): Promise<any> {
    const params = new URLSearchParams({
      campaign,
      limit: String(limit),
    });

    return this.request(`/api/discovery/trending-destinations?${params.toString()}`, {
      method: 'GET',
    });
  }
}

const apiClient = new ApiClient();

// Initialize on module load
apiClient.initialize();

export default apiClient;


