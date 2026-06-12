
import { translations } from '../locales';
import { convertToTraditional } from '../chineseConverter';

describe('Login Traditional Chinese Translations', () => {
  test('should convert login translations to Traditional Chinese', () => {
    const simplifiedLogin = translations['zh-CN'].login;
    const traditionalLogin = convertToTraditional(simplifiedLogin, 'zh-TW');
    
    // Check that conversion happened
    expect(traditionalLogin).toBeDefined();
    expect(traditionalLogin.tagline).toBeDefined();
    expect(traditionalLogin.benefits).toBeDefined();
    expect(traditionalLogin.ctaTitle).toBeDefined();
    
    // Verify some specific conversions
    expect(traditionalLogin.tagline).toContain('跨境入境'); // Should remain the same
    expect(traditionalLogin.benefits.free).toBe('完全免費'); // 费 -> 費
    expect(traditionalLogin.benefits.noRegistration).toBe('無需註冊'); // 无需注册 -> 無需註冊
  });

  test('should access Traditional Chinese through lazy getter', () => {
    const zhTWTranslations = translations['zh-TW'] as Record<string, unknown>;
    expect(zhTWTranslations).toBeDefined();
    const zhTWLogin = zhTWTranslations.login as Record<string, unknown>;
    expect(zhTWLogin).toBeDefined();
    expect(zhTWLogin.tagline).toBeDefined();
    
    // Should have converted characters
    const zhTWBenefits = zhTWLogin.benefits as Record<string, unknown>;
    expect(zhTWBenefits.free).toBe('完全免費');
    expect(zhTWBenefits.noRegistration).toBe('無需註冊');
  });

  test('should handle interpolation placeholders correctly', () => {
    const zhTWTranslations = translations['zh-TW'];
    const {popularityText} = zhTWTranslations.login;
    
    // Should preserve the interpolation placeholder
    expect(popularityText).toContain('{{percent}}');
    // Should convert Chinese characters
    expect(popularityText).toContain('順暢入境'); // 顺畅入境 -> 順暢入境
  });

  test('should maintain structure consistency', () => {
    const simplifiedLogin = (translations['zh-CN'] as Record<string, unknown>).login as Record<string, unknown>;
    const traditionalLogin = (translations['zh-TW'] as Record<string, unknown>).login as Record<string, unknown>;
    
    // Should have same keys
    expect(Object.keys(traditionalLogin)).toEqual(Object.keys(simplifiedLogin));
    expect(Object.keys(traditionalLogin.benefits)).toEqual(Object.keys(simplifiedLogin.benefits));
  });
});