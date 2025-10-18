import { translations } from '../locales.js';

describe('Login Screen Translations', () => {
  const supportedLanguages = ['en', 'zh-CN', 'fr', 'de', 'es'];
  
  const requiredLoginKeys = [
    'login.tagline',
    'login.benefits.free',
    'login.benefits.noRegistration', 
    'login.benefits.instant',
    'login.ctaTitle',
    'login.ctaSubtitle',
    'login.buttonText',
    'login.buttonSubtext',
    'login.popularityText',
    'login.hotlistLabel',
    'login.hotlistDescription'
  ];

  test.each(supportedLanguages)('should have all login translations for %s', (language) => {
    const langTranslations = translations[language];
    expect(langTranslations).toBeDefined();
    
    requiredLoginKeys.forEach(key => {
      const keyPath = key.split('.');
      let value = langTranslations;
      
      keyPath.forEach(part => {
        value = value?.[part];
      });
      
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    });
  });

  test('should handle interpolation in popularityText', () => {
    supportedLanguages.forEach(language => {
      const langTranslations = translations[language];
      const popularityText = langTranslations.login.popularityText;
      
      expect(popularityText).toContain('{{percent}}');
    });
  });

  test('should have consistent structure across languages', () => {
    const enStructure = translations.en.login;
    
    supportedLanguages.slice(1).forEach(language => {
      const langStructure = translations[language].login;
      
      // Check that all English keys exist in other languages
      Object.keys(enStructure).forEach(key => {
        expect(langStructure).toHaveProperty(key);
        
        if (typeof enStructure[key] === 'object') {
          Object.keys(enStructure[key]).forEach(subKey => {
            expect(langStructure[key]).toHaveProperty(subKey);
          });
        }
      });
    });
  });

  test('should not have empty translations', () => {
    supportedLanguages.forEach(language => {
      const langTranslations = translations[language];
      
      requiredLoginKeys.forEach(key => {
        const keyPath = key.split('.');
        let value = langTranslations;
        
        keyPath.forEach(part => {
          value = value?.[part];
        });
        
        expect(value).not.toBe('');
        expect(value).not.toBe(null);
        expect(value).not.toBe(undefined);
      });
    });
  });
});