// API Client Service for TripSecretary
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8787' 
  : 'https://api.chuguoluo.com';

class ApiClient {
  constructor() {
    this.token = null;
  }

  async initialize() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        this.token = token;
      }
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  async setToken(token) {
    this.token = token;
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  async clearToken() {
    this.token = null;
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
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
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API 错误: ${response.status}`);
      }

      return response.json();
    } catch (error) {
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
  async wechatLogin(code) {
    const result = await this.request('/api/auth/wechat', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    
    if (result.token) {
      await this.setToken(result.token);
    }
    
    return result;
  }

  async phoneLogin(phone, code) {
    const result = await this.request('/api/auth/phone', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
    
    if (result.token) {
      await this.setToken(result.token);
    }
    
    return result;
  }

  async logout() {
    await this.clearToken();
  }

  // OCR APIs
  async recognizePassport(imageUri) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'passport.jpg',
    });

    return this.request('/api/ocr/passport', {
      method: 'POST',
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }

  async recognizeTicket(imageUri) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'ticket.jpg',
    });

    return this.request('/api/ocr/ticket', {
      method: 'POST',
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }

  async recognizeHotel(imageUri) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'hotel.jpg',
    });

    return this.request('/api/ocr/hotel', {
      method: 'POST',
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }

  // Generation APIs
  async generateEntryForm(data) {
    return this.request('/api/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkDuplicate(passportId, destinationId, flightNumber, arrivalDate) {
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
  async getHistory(limit = 50, offset = 0) {
    return this.request(`/api/history?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async getHistoryItem(id) {
    return this.request(`/api/history/${id}`, {
      method: 'GET',
    });
  }

  async deleteHistoryItem(id) {
    return this.request(`/api/history/${id}`, {
      method: 'DELETE',
    });
  }

  // Profile APIs
  async getProfile() {
    return this.request('/api/profile', {
      method: 'GET',
    });
  }

  async updateProfile(data) {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Passport APIs
  async getPassports() {
    return this.request('/api/passports', {
      method: 'GET',
    });
  }

  async savePassport(passportData) {
    return this.request('/api/passports', {
      method: 'POST',
      body: JSON.stringify(passportData),
    });
  }

  async deletePassport(id) {
    return this.request(`/api/passports/${id}`, {
      method: 'DELETE',
    });
  }
}

const apiClient = new ApiClient();

// Initialize on module load
apiClient.initialize();

export default apiClient;
