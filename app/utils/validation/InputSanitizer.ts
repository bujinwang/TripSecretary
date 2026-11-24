// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SanitizeOptions = Record<string, any>;

/**
 * 入境通 - Input Sanitization Utility
 * Security-focused input sanitization and cleaning
 */
class InputSanitizer {
  dangerousPatterns: RegExp[];
  sqlInjectionPatterns: RegExp[];
  pathTraversalPatterns: RegExp[];

  constructor() {
    this.dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:(?!image\/(?:png|jpg|jpeg|gif|webp|svg\+xml|bmp))[^;]/gi,
      /on\w+\s*=/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
      /<input\b[^<]*(?:(?!<\/input>)<[^<]*)*\/?>/gi,
      /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*\/?>/gi,
    ];

    this.sqlInjectionPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /(-{2}|\/\*|\*\/)/g,
      /('|(\\x27)|(\\x2D))/g,
      /(%27|%3B|%22)/gi,
    ];

    this.pathTraversalPatterns = [
      /\.\.[\/\\]/g,
      /[\/\\]\.\./g,
      /%2e%2e[\/\\]/gi,
      /[\/\\]%2e%2e/gi,
    ];
  }

  sanitizeText(input: unknown, options: SanitizeOptions = {}): string {
    if (!input || typeof input !== 'string') {
      return input as string;
    }

    let sanitized: string = input;

    sanitized = sanitized.replace(/\0/g, '');

    sanitized = sanitized.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

    if (options.allowHtml !== true) {
      sanitized = this.removeDangerousHtml(sanitized);
    }

    if (options.checkSqlInjection !== false) {
      sanitized = this.removeSqlInjection(sanitized);
    }

    if (options.checkPathTraversal !== false) {
      sanitized = this.removePathTraversal(sanitized);
    }

    sanitized = sanitized.trim();

    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    return sanitized;
  }

  sanitizeEmail(email: unknown): string {
    if (!email || typeof email !== 'string') {
      return email as string;
    }

    let sanitized = email.toLowerCase().trim();
    sanitized = sanitized.replace(/[<>'"&\\]/g, '');

    sanitized = this.removeDangerousHtml(sanitized);

    if (sanitized.length > 254) {
      sanitized = sanitized.substring(0, 254);
    }

    return sanitized;
  }

  sanitizePhone(phone: unknown): string {
    if (!phone || typeof phone !== 'string') {
      return phone as string;
    }

    let sanitized = phone.replace(/[^\d+\-() ]/g, '');
    sanitized = sanitized.replace(/\s+/g, ' ');
    sanitized = sanitized.trim();

    return sanitized;
  }

  sanitizeName(name: unknown): string {
    if (!name || typeof name !== 'string') {
      return name as string;
    }

    let sanitized = name.replace(/[^a-zA-Z\s'-]/g, '');
    sanitized = sanitized.replace(/\s+/g, ' ');
    sanitized = sanitized.trim();

    if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 100);
    }

    return sanitized;
  }

  sanitizePassportNumber(num: unknown): string {
    if (!num || typeof num !== 'string') {
      return num as string;
    }

    const sanitized = num.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    return sanitized.substring(0, 12);
  }

  sanitizeDate(dateStr: unknown): string {
    if (!dateStr || typeof dateStr !== 'string') {
      return dateStr as string;
    }

    const sanitized = dateStr.replace(/[^0-9-]/g, '');

    const parts = sanitized.split('-');
    if (parts.length !== 3) {
      return sanitized.substring(0, 10);
    }

    const [year, month, day] = parts;
    const y = parseInt(year, 10);
    const m = Math.min(Math.max(parseInt(month, 10) || 1, 1), 12);
    const d = Math.min(Math.max(parseInt(day, 10) || 1, 1), 31);

    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  sanitizeAmount(amount: unknown): string {
    if (!amount || typeof amount !== 'string') {
      return amount as string;
    }

    let sanitized = amount.replace(/[^0-9\s.,¥$€£THBUSD]/g, '');
    sanitized = sanitized.replace(/\s+/g, ' ');

    sanitized = sanitized.trim();

    if (sanitized.length > 50) {
      sanitized = sanitized.substring(0, 50);
    }

    return sanitized;
  }

  sanitizeUrl(url: unknown): string {
    if (!url || typeof url !== 'string') {
      return url as string;
    }

    let sanitized = url.trim();

    sanitized = this.removeDangerousHtml(sanitized);

    const allowed = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (!allowed.test(sanitized)) {
      return '';
    }

    return sanitized;
  }

  sanitizeForStorage(input: unknown): string {
    if (!input || typeof input !== 'string') {
      return input as string;
    }

    let sanitized = input.replace(/\0/g, '');

    sanitized = sanitized.replace(
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g,
      '',
    );

    sanitized = this.removeDangerousHtml(sanitized);
    sanitized = this.removeSqlInjection(sanitized);

    return sanitized;
  }

  isRequiredField(
    field: string,
    dataType: string,
  ): boolean {
    const requiredFields: Record<string, string[]> = {
      passport: [
        'passportNumber',
        'fullName',
        'dateOfBirth',
        'nationality',
        'expiryDate',
      ],
      personalInfo: [],
      entryData: ['destination', 'arrivalDate'],
      fundingProof: [],
    };

    return (requiredFields[dataType] || []).includes(field);
  }

  removeDangerousHtml(input: string): string {
    let sanitized = input;

    for (const pattern of this.dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    return sanitized;
  }

  removeSqlInjection(input: string): string {
    let sanitized = input;

    for (const pattern of this.sqlInjectionPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    return sanitized;
  }

  removePathTraversal(input: string): string {
    let sanitized = input;

    for (const pattern of this.pathTraversalPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    return sanitized;
  }
}

export default new InputSanitizer();
