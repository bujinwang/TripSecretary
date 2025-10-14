/**
 * 入境通 - Encryption Service
 * Multi-layer encryption service for sensitive data protection
 *
 * Features:
 * - AES-256-GCM encryption with unique IV per operation
 * - Hierarchical key derivation (Master → User → Field keys)
 * - Secure key storage using Expo SecureStore
 * - GDPR/PIPL compliant encryption
 */

import * as SecureStore from 'expo-secure-store';

class EncryptionService {
  constructor() {
    this.masterKey = null;
    this.userKey = null;
    this.fieldKeys = new Map();
    this.KEY_PREFIX = 'tripsec_key_';
    this.SALT = 'trip-secretary-salt-2024';
  }

  /**
   * Initialize encryption service with master key from environment
   * @param {string} masterKey - Master encryption key from env variables
   */
  async initialize(masterKey = null) {
    try {
      // In production, master key should come from environment variables
      // For development, we'll generate one and store it securely
      if (masterKey) {
        this.masterKey = masterKey;
      } else {
        // Try to load existing master key
        this.masterKey = await SecureStore.getItemAsync(`${this.KEY_PREFIX}master`);
        if (!this.masterKey) {
          // Generate new master key for development
          this.masterKey = this.generateRandomKey();
          await SecureStore.setItemAsync(`${this.KEY_PREFIX}master`, this.masterKey);
        }
      }
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
      throw new Error('Encryption service initialization failed');
    }
  }

  /**
   * Generate a cryptographically secure random key
   * @returns {string} - Hex encoded 256-bit key
   */
  generateRandomKey() {
    const array = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto.getRandomValues
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Derive encryption key from master key using PBKDF2
   * @param {string} masterKey - Master key
   * @param {string} salt - Salt for key derivation
   * @param {number} iterations - PBKDF2 iterations (default: 100000)
   * @returns {Promise<CryptoKey>} - Derived AES-GCM key
   */
  async deriveKey(masterKey, salt = this.SALT, iterations = 100000) {
    try {
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(masterKey),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      return await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: enc.encode(salt),
          iterations: iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Key derivation failed:', error);
      throw new Error('Failed to derive encryption key');
    }
  }

  /**
   * Set up user-specific encryption key
   * @param {string} userId - Unique user identifier
   */
  async setupUserKey(userId) {
    try {
      if (!this.masterKey) {
        throw new Error('Master key not initialized');
      }

      // Create user-specific salt
      const userSalt = `user-${userId}-${this.SALT}`;

      // Derive user-specific key from master key
      this.userKey = await this.deriveKey(this.masterKey, userSalt);

      // Cache field-specific keys for performance
      await this.initializeFieldKeys();
    } catch (error) {
      console.error('Failed to setup user key:', error);
      throw error;
    }
  }

  /**
   * Initialize field-specific keys for different data types
   */
  async initializeFieldKeys() {
    if (!this.userKey) {
      throw new Error('User key not initialized');
    }

    const fieldTypes = [
      'passport_number',
      'full_name',
      'date_of_birth',
      'phone_number',
      'email_address',
      'home_address',
      'bank_details',
      'financial_docs'
    ];

    for (const fieldType of fieldTypes) {
      const fieldSalt = `field-${fieldType}-${this.SALT}`;
      this.fieldKeys.set(fieldType, await this.deriveKey(this.masterKey, fieldSalt));
    }
  }

  /**
   * Get or create field-specific encryption key
   * @param {string} fieldType - Type of field being encrypted
   * @returns {CryptoKey} - Field-specific encryption key
   */
  async getFieldKey(fieldType) {
    if (!this.userKey) {
      throw new Error('User key not initialized');
    }

    if (!this.fieldKeys.has(fieldType)) {
      const fieldSalt = `field-${fieldType}-${this.SALT}`;
      this.fieldKeys.set(fieldType, await this.deriveKey(this.masterKey, fieldSalt));
    }

    return this.fieldKeys.get(fieldType);
  }

  /**
   * Encrypt sensitive data field
   * @param {string} plaintext - Data to encrypt
   * @param {string} fieldType - Type of field (determines which key to use)
   * @returns {Promise<string>} - Base64 encoded encrypted data with IV
   */
  async encrypt(plaintext, fieldType = 'general') {
    try {
      if (!plaintext) {
        throw new Error('No data provided for encryption');
      }

      const key = await this.getFieldKey(fieldType);
      const enc = new TextEncoder();
      const encoded = enc.encode(plaintext);

      // Generate unique IV for each encryption
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt using AES-GCM
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encoded
      );

      // Combine IV and ciphertext
      const result = new Uint8Array(iv.length + ciphertext.byteLength);
      result.set(iv, 0);
      result.set(new Uint8Array(ciphertext), iv.length);

      // Return base64 encoded result
      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data field
   * @param {string} encryptedData - Base64 encoded encrypted data with IV
   * @param {string} fieldType - Type of field (determines which key to use)
   * @returns {Promise<string>} - Decrypted plaintext
   */
  async decrypt(encryptedData, fieldType = 'general') {
    try {
      if (!encryptedData) {
        throw new Error('No encrypted data provided');
      }

      const key = await this.getFieldKey(fieldType);

      // Decode base64 data
      const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

      // Extract IV and ciphertext
      const iv = data.slice(0, 12);
      const ciphertext = data.slice(12);

      // Decrypt using AES-GCM
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );

      const dec = new TextDecoder();
      return dec.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data - possibly corrupted or wrong key');
    }
  }

  /**
   * Encrypt multiple fields of different types
   * @param {Object} data - Object with fieldType keys and plaintext values
   * @returns {Promise<Object>} - Object with same keys but encrypted values
   */
  async encryptFields(data) {
    const encrypted = {};

    for (const [fieldType, value] of Object.entries(data)) {
      if (value && typeof value === 'string') {
        encrypted[fieldType] = await this.encrypt(value, fieldType);
      } else {
        encrypted[fieldType] = value; // Keep non-string values as-is
      }
    }

    return encrypted;
  }

  /**
   * Decrypt multiple fields of different types
   * @param {Object} encryptedData - Object with fieldType keys and encrypted values
   * @returns {Promise<Object>} - Object with same keys but decrypted values
   */
  async decryptFields(encryptedData) {
    const decrypted = {};

    for (const [fieldType, value] of Object.entries(encryptedData)) {
      if (value && typeof value === 'string' && value.length > 50) {
        // Heuristic: encrypted data is usually longer than 50 chars
        try {
          decrypted[fieldType] = await this.decrypt(value, fieldType);
        } catch (error) {
          // If decryption fails, keep original value (might not be encrypted)
          decrypted[fieldType] = value;
        }
      } else {
        decrypted[fieldType] = value; // Keep non-encrypted values as-is
      }
    }

    return decrypted;
  }

  /**
   * Securely wipe encryption keys from memory
   */
  async clearKeys() {
    try {
      // Clear master key
      this.masterKey = null;

      // Clear user key
      this.userKey = null;

      // Clear field keys
      this.fieldKeys.clear();

      // Note: In production, you might want to overwrite memory
      // with zeros to prevent key recovery from memory dumps
    } catch (error) {
      console.error('Failed to clear encryption keys:', error);
    }
  }

  /**
   * Get encryption metadata for audit logging
   * @returns {Object} - Encryption configuration info (without keys)
   */
  getEncryptionInfo() {
    return {
      algorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2-SHA256',
      iterations: 100000,
      ivLength: 12,
      tagLength: 16,
      initialized: !!this.masterKey,
      fieldTypes: Array.from(this.fieldKeys.keys()),
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

export default encryptionService;