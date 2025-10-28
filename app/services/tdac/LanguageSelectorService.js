/**
 * LanguageSelectorService
 *
 * Handles automatic language selection in TDAC WebView
 * Uses multiple strategies to find and click language dropdown/options
 */

import LoggingService from '../LoggingService';

const logger = LoggingService.for('LanguageSelectorService');

class LanguageSelectorService {
  /**
   * Generate JavaScript code to auto-select language in TDAC WebView
   *
   * @param {string} preferredLanguage - Preferred language code (e.g., 'en', 'zh', 'ja')
   * @returns {string} JavaScript code to inject into WebView
   */
  static generateLanguageSelectionScript(preferredLanguage) {
    return `
      (function() {
        try {
          // Notify React Native that the script has started
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'debug_log',
            message: '🚀 Language selection script started'
          }));

          if (window.languageSelected) {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug_log',
              message: '⚠️ Language already selected, skipping'
            }));
            return;
          }

          const preferredLang = '${preferredLanguage}';
          let dropdownOpened = false;

          // Strategy 1: Look for language selector in header/toolbar
          const headerSelectors = document.querySelectorAll(
            'header button, header div[role="button"], ' +
            'mat-toolbar button, mat-toolbar div[role="button"], ' +
            '.toolbar button, .toolbar div[role="button"], ' +
            'nav button, nav div[role="button"]'
          );

          for (let trigger of headerSelectors) {
            const text = (trigger.textContent || trigger.innerText || '').trim();
            if ((text.includes('English') || text.includes('中文') || text.includes('日本語') ||
                 text.includes('한국어') || text.includes('Русский')) && text.length < 30) {
              trigger.click();
              dropdownOpened = true;
              break;
            }
          }

          // Strategy 2: Search language-related elements
          if (!dropdownOpened) {
            const langSelectors = document.querySelectorAll(
              'button[class*="language"], button[class*="Language"], button[class*="lang"], ' +
              'div[class*="language"], div[class*="Language"], div[class*="lang"], ' +
              '[role="button"][class*="lang"], mat-select, .mat-select'
            );

            for (let trigger of langSelectors) {
              const text = (trigger.textContent || trigger.innerText || '').trim();
              if ((text.includes('English') || text.includes('中文') || text.includes('日本語') ||
                   text.includes('한국어') || text.includes('Русский')) && text.length < 30) {
                trigger.click();
                dropdownOpened = true;
                break;
              }
            }
          }

          // Strategy 3: Search ALL visible elements
          if (!dropdownOpened) {
            const allElements = document.querySelectorAll('button, a, div, span');
            for (let el of allElements) {
              const text = (el.textContent || el.innerText || '').trim();
              if (text === 'English' || text === '中文' || text === '日本語' ||
                  text === '한국어' || text === 'Русский') {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  el.click();
                  dropdownOpened = true;
                  break;
                }
              }
            }
          }

          // Step 2: Select the language option
          setTimeout(() => {
            const languageMap = {
              'en': ['English', 'ENGLISH', 'english'],
              'zh': ['中文', '简体中文', 'Chinese'],
              'ja': ['日本語', 'Japanese'],
              'ko': ['한국어', 'Korean'],
              'ru': ['Русский', 'Russian']
            };

            const targetTexts = languageMap[preferredLang] || languageMap['en'];
            const languageButtons = document.querySelectorAll(
              'button, a, li, mat-option, [role="option"], [role="menuitem"], div[class*="option"]'
            );

            for (let btn of languageButtons) {
              const text = (btn.textContent || btn.innerText || '').trim();
              for (let targetText of targetTexts) {
                if (text === targetText || (text.includes(targetText) && text.length < 30)) {
                  const rect = btn.getBoundingClientRect();
                  if (rect.width > 0 && rect.height > 0) {
                    btn.click();
                    window.languageSelected = true;
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                      type: 'language_selected',
                      language: preferredLang
                    }));
                    return;
                  }
                }
              }
            }
          }, dropdownOpened ? 800 : 200);

        } catch(e) {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'error',
            message: 'Language selection error: ' + e.message
          }));
        }
      })();
    `;
  }

  /**
   * Log language selection activity
   *
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  static log(event, data = {}) {
    logger.debug(event, data);
  }
}

export default LanguageSelectorService;
