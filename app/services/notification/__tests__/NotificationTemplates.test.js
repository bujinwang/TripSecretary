import NotificationTemplates, {
  NOTIFICATION_TYPES,
  getNotificationTemplate,
  getNotificationMetadata,
  interpolateTemplate,
  createNotificationFromTemplate,
  isValidNotificationType,
  getSupportedLanguages
} from '../NotificationTemplates';

describe('NotificationTemplates', () => {
  describe('getNotificationTemplate', () => {
    it('should return template for valid type and language', () => {
      const template = getNotificationTemplate(NOTIFICATION_TYPES.SUBMISSION_WINDOW_OPEN, 'en');
      
      expect(template).toBeDefined();
      expect(template.title).toBe('Thailand Entry Card Submission Available');
      expect(template.body).toContain('{{daysRemaining}}');
      expect(template.actionButtons).toHaveLength(2);
    });

    it('should return Chinese template', () => {
      const template = getNotificationTemplate(NOTIFICATION_TYPES.URGENT_REMINDER, 'zh');
      
      expect(template).toBeDefined();
      expect(template.title).toBe('紧急：请尽快提交入境卡');
      expect(template.body).toContain('{{hoursRemaining}}');
    });

    it('should return Spanish template', () => {
      const template = getNotificationTemplate(NOTIFICATION_TYPES.ARRIVAL_REMINDER, 'es');
      
      expect(template).toBeDefined();
      expect(template.title).toBe('Llegando a Tailandia Mañana');
      expect(template.body).toContain('Tailandia mañana');
    });

    it('should fallback to English for unsupported language', () => {
      const template = getNotificationTemplate(NOTIFICATION_TYPES.SUBMISSION_WINDOW_OPEN, 'fr');
      
      expect(template).toBeDefined();
      expect(template.title).toBe('Thailand Entry Card Submission Available');
    });

    it('should return null for invalid type', () => {
      const template = getNotificationTemplate('invalid_type', 'en');
      
      expect(template).toBeNull();
    });
  });

  describe('getNotificationMetadata', () => {
    it('should return metadata for valid type', () => {
      const metadata = getNotificationMetadata(NOTIFICATION_TYPES.URGENT_REMINDER);
      
      expect(metadata).toBeDefined();
      expect(metadata.priority).toBe('urgent');
      expect(metadata.sound).toBe(true);
      expect(metadata.vibration).toBe(true);
      expect(metadata.deepLink).toBeDefined();
    });

    it('should return default metadata for invalid type', () => {
      const metadata = getNotificationMetadata('invalid_type');
      
      expect(metadata.priority).toBe('normal');
      expect(metadata.sound).toBe(false);
      expect(metadata.vibration).toBe(false);
    });
  });

  describe('interpolateTemplate', () => {
    it('should interpolate variables correctly', () => {
      const template = 'Hello {{name}}, you have {{count}} messages';
      const variables = { name: 'John', count: 5 };
      
      const result = interpolateTemplate(template, variables);
      
      expect(result).toBe('Hello John, you have 5 messages');
    });

    it('should leave unmatched variables as is', () => {
      const template = 'Hello {{name}}, you have {{count}} messages';
      const variables = { name: 'John' };
      
      const result = interpolateTemplate(template, variables);
      
      expect(result).toBe('Hello John, you have {{count}} messages');
    });

    it('should handle empty variables', () => {
      const template = 'Hello {{name}}';
      
      const result = interpolateTemplate(template);
      
      expect(result).toBe('Hello {{name}}');
    });

    it('should handle non-string templates', () => {
      expect(interpolateTemplate(null)).toBeNull();
      expect(interpolateTemplate(undefined)).toBeUndefined();
      expect(interpolateTemplate(123)).toBe(123);
    });
  });

  describe('createNotificationFromTemplate', () => {
    it('should create complete notification object', () => {
      const variables = { daysRemaining: 3 };
      
      const notification = createNotificationFromTemplate(
        NOTIFICATION_TYPES.SUBMISSION_WINDOW_OPEN,
        'en',
        variables
      );
      
      expect(notification).toBeDefined();
      expect(notification.title).toBe('Thailand Entry Card Submission Available');
      expect(notification.body).toBe('You can now submit your Thailand entry card. 3 days until arrival.');
      expect(notification.data.type).toBe(NOTIFICATION_TYPES.SUBMISSION_WINDOW_OPEN);
      expect(notification.data.language).toBe('en');
      expect(notification.data.variables).toEqual(variables);
      expect(notification.options.priority).toBe('high');
      expect(notification.options.sound).toBe(true);
    });

    it('should throw error for invalid type', () => {
      expect(() => {
        createNotificationFromTemplate('invalid_type', 'en');
      }).toThrow('Cannot create notification: template not found');
    });

    it('should include additional data', () => {
      const additionalData = { entryPackId: '123' };
      
      const notification = createNotificationFromTemplate(
        NOTIFICATION_TYPES.ARRIVAL_REMINDER,
        'en',
        {},
        additionalData
      );
      
      expect(notification.data.entryPackId).toBe('123');
    });
  });

  describe('isValidNotificationType', () => {
    it('should return true for valid types', () => {
      expect(isValidNotificationType(NOTIFICATION_TYPES.SUBMISSION_WINDOW_OPEN)).toBe(true);
      expect(isValidNotificationType(NOTIFICATION_TYPES.URGENT_REMINDER)).toBe(true);
      expect(isValidNotificationType(NOTIFICATION_TYPES.ARRIVAL_DAY)).toBe(true);
    });

    it('should return false for invalid types', () => {
      expect(isValidNotificationType('invalid_type')).toBe(false);
      expect(isValidNotificationType('')).toBe(false);
      expect(isValidNotificationType(null)).toBe(false);
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return supported languages', () => {
      const languages = getSupportedLanguages();
      
      expect(languages).toEqual(['zh', 'en', 'es']);
    });
  });

  describe('notification types coverage', () => {
    it('should have templates for all notification types', () => {
      const allTypes = Object.values(NOTIFICATION_TYPES);
      
      allTypes.forEach(type => {
        const template = getNotificationTemplate(type, 'en');
        expect(template).toBeDefined();
        expect(template.title).toBeDefined();
        expect(template.body).toBeDefined();
      });
    });

    it('should have all languages for each notification type', () => {
      const allTypes = Object.values(NOTIFICATION_TYPES);
      const languages = getSupportedLanguages();
      
      allTypes.forEach(type => {
        languages.forEach(language => {
          const template = getNotificationTemplate(type, language);
          expect(template).toBeDefined();
          expect(template.title).toBeDefined();
          expect(template.body).toBeDefined();
        });
      });
    });
  });

  describe('action buttons', () => {
    it('should have action buttons for interactive notifications', () => {
      const interactiveTypes = [
        NOTIFICATION_TYPES.SUBMISSION_WINDOW_OPEN,
        NOTIFICATION_TYPES.URGENT_REMINDER,
        NOTIFICATION_TYPES.DEADLINE_WARNING,
        NOTIFICATION_TYPES.ARRIVAL_REMINDER,
        NOTIFICATION_TYPES.DATA_CHANGE_DETECTED
      ];

      interactiveTypes.forEach(type => {
        const template = getNotificationTemplate(type, 'en');
        expect(template.actionButtons).toBeDefined();
        expect(template.actionButtons.length).toBeGreaterThan(0);
        
        template.actionButtons.forEach(button => {
          expect(button.id).toBeDefined();
          expect(button.title).toBeDefined();
        });
      });
    });
  });

  describe('deep links', () => {
    it('should have deep links for all notification types', () => {
      const allTypes = Object.values(NOTIFICATION_TYPES);
      
      allTypes.forEach(type => {
        const metadata = getNotificationMetadata(type);
        expect(metadata.deepLink).toBeDefined();
        expect(typeof metadata.deepLink).toBe('string');
      });
    });
  });
});