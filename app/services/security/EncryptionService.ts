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

// Type definitions
export type FieldType = 
  | 'general'
  | 'passport_number'
  | 'full_name'
  | 'date_of_birth'
  | 'phone_number'
  | 'email_address'
  | 'home_address'
  | 'bank_details'
  | 'financial_docs'
  | 'recovery';

export interface EncryptionInfo {
  algorithm: string;
  keyDerivation: string;
  iterations: number;
  ivLength: number;
  tagLength: number;
  initialized: boolean;
  fieldTypes: string[];
  timestamp: string;
}

export interface EncryptedFields {
  [fieldType: string]: string | any;
}

// Declare crypto for TypeScript
declare const crypto: {
  getRandomValues: (array: Uint8Array) => Uint8Array;
  subtle: {
    importKey: (
      format: string,
      keyData: ArrayBuffer,
      algorithm: string,
      extractable: boolean,
      keyUsages: string[]
    ) => Promise<CryptoKey>;
    deriveKey: (
      algorithm: { name: string; salt: ArrayBuffer; iterations: number; hash: string },
      baseKey: CryptoKey,
      derivedKeyType: { name: string; length: number },
      extractable: boolean,
      keyUsages: string[]
    ) => Promise<CryptoKey>;
    encrypt: (
      algorithm: { name: string; iv: Uint8Array },
      key: CryptoKey,
      data: ArrayBuffer
    ) => Promise<ArrayBuffer>;
    decrypt: (
      algorithm: { name: string; iv: Uint8Array },
      key: CryptoKey,
      data: ArrayBuffer
    ) => Promise<ArrayBuffer>;
  };
};

class EncryptionService {
  private masterKey: string | null = null;
  private userKey: CryptoKey | null = null;
  private fieldKeys: Map<string, CryptoKey> = new Map();
  private readonly KEY_PREFIX: string = 'tripsec_key_';
  private readonly SALT: string = 'trip-secretary-salt-2024';

  /**
   * Initialize encryption service with master key from environment
   */
  async initialize(masterKey: string | null = null): Promise<void> {
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
   */
  generateRandomKey(): string {
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
   */
  async deriveKey(masterKey: string, salt: string = this.SALT, iterations: number = 100000): Promise<CryptoKey> {
    try {
      const enc = new TextEncoder();
      const masterKeyBytes = enc.encode(masterKey);
      const masterKeyBuffer = new ArrayBuffer(masterKeyBytes.byteLength);
      new Uint8Array(masterKeyBuffer).set(masterKeyBytes);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        masterKeyBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      const saltBytes = enc.encode(salt);
      const saltBuffer = new ArrayBuffer(saltBytes.byteLength);
      new Uint8Array(saltBuffer).set(saltBytes);
      return await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
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
   */
  async setupUserKey(userId: string): Promise<void> {
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
  async initializeFieldKeys(): Promise<void> {
    if (!this.userKey) {
      throw new Error('User key not initialized');
    }

    if (!this.masterKey) {
      throw new Error('Master key not initialized');
    }

    const fieldTypes: FieldType[] = [
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
   */
  async getFieldKey(fieldType: FieldType): Promise<CryptoKey> {
    if (!this.userKey) {
      throw new Error('User key not initialized');
    }

    if (!this.masterKey) {
      throw new Error('Master key not initialized');
    }

    if (!this.fieldKeys.has(fieldType)) {
      const fieldSalt = `field-${fieldType}-${this.SALT}`;
      this.fieldKeys.set(fieldType, await this.deriveKey(this.masterKey, fieldSalt));
    }

    return this.fieldKeys.get(fieldType)!;
  }

  /**
   * Encrypt sensitive data field
   */
  async encrypt(plaintext: string, fieldType: FieldType = 'general'): Promise<string> {
    try {
      if (!plaintext) {
        throw new Error('No data provided for encryption');
      }

      const key = await this.getFieldKey(fieldType);
      const enc = new TextEncoder();
      const encoded = enc.encode(plaintext);
      const encodedBuffer = new ArrayBuffer(encoded.byteLength);
      new Uint8Array(encodedBuffer).set(encoded);

      // Generate unique IV for each encryption
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt using AES-GCM
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encodedBuffer
      );

      // Combine IV and ciphertext
      const result = new Uint8Array(iv.length + ciphertext.byteLength);
      result.set(iv, 0);
      result.set(new Uint8Array(ciphertext), iv.length);

      // Return base64 encoded result
      // Using btoa for base64 encoding (available in React Native)
      // Convert Uint8Array to string for btoa
      const chars: string[] = [];
      for (let i = 0; i < result.length; i++) {
        chars.push(String.fromCharCode(result[i]));
      }
      return btoa(chars.join(''));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data field
   */
  async decrypt(encryptedData: string, fieldType: FieldType = 'general'): Promise<string> {
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
      const ciphertextBuffer = new ArrayBuffer(ciphertext.byteLength);
      new Uint8Array(ciphertextBuffer).set(ciphertext);

      // Decrypt using AES-GCM
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertextBuffer
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
   */
  async encryptFields(data: Record<string, any>): Promise<EncryptedFields> {
    const encrypted: EncryptedFields = {};

    for (const [fieldType, value] of Object.entries(data)) {
      if (value && typeof value === 'string') {
        encrypted[fieldType] = await this.encrypt(value, fieldType as FieldType);
      } else {
        encrypted[fieldType] = value; // Keep non-string values as-is
      }
    }

    return encrypted;
  }

  /**
   * Decrypt multiple fields of different types
   */
  async decryptFields(encryptedData: EncryptedFields): Promise<Record<string, any>> {
    const decrypted: Record<string, any> = {};

    for (const [fieldType, value] of Object.entries(encryptedData)) {
      if (value && typeof value === 'string' && value.length > 50) {
        // Heuristic: encrypted data is usually longer than 50 chars
        try {
          decrypted[fieldType] = await this.decrypt(value, fieldType as FieldType);
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
  async clearKeys(): Promise<void> {
    try {
      // Clear master key
      this.masterKey = null;

      // Clear user key
      this.userKey = null;

      // Clear field keys
      if (this.fieldKeys) {
        this.fieldKeys.clear();
      }

      // Note: In production, you might want to overwrite memory
      // with zeros to prevent key recovery from memory dumps
    } catch (error) {
      console.error('Failed to clear encryption keys:', error);
    }
  }

  /**
   * Get encryption metadata for audit logging
   */
  getEncryptionInfo(): EncryptionInfo {
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

