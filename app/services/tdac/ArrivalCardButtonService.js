/**
 * ArrivalCardButtonService
 *
 * Handles automatic clicking of Arrival Card button in TDAC WebView
 * Uses multi-language pattern matching to find the correct button
 */

import LoggingService from '../LoggingService';

const logger = LoggingService.for('ArrivalCardButtonService');

class ArrivalCardButtonService {
  /**
   * Generate JavaScript code to auto-click Arrival Card button
   *
   * @returns {string} JavaScript code to inject into WebView
   */
  static generateArrivalCardClickScript() {
    return `
      (function() {
        try {
          if (window.arrivalCardClicked) {
            console.log('⚠️ Arrival Card already clicked, skipping');
            return;
          }

          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'debug_log',
            message: '🔍 Looking for Arrival Card button...'
          }));

          // Wait for page to load after language selection
          setTimeout(() => {
            let arrivalCardBtn = null;
            const allElements = document.querySelectorAll(
              'button, a, div, span, mat-card, [class*="card"], [class*="Card"], [role="button"]'
            );

            let bestMatch = null;
            let bestMatchScore = 0;

            for (let el of allElements) {
              const text = (el.textContent || el.innerText || '').trim();

              // Skip large containers
              if (text.length > 80) continue;

              let matchScore = 0;

              // English patterns
              if (text === 'Arrival Card') {
                matchScore = 100;
              } else if (text.match(/^Arrival\\s*Card$/i)) {
                matchScore = 90;
              } else if (text.includes('Arrival Card')) {
                matchScore = 50;
              }

              // Chinese patterns
              if (text === '入境卡') {
                matchScore = Math.max(matchScore, 100);
              } else if (text.match(/^入境卡$/)) {
                matchScore = Math.max(matchScore, 90);
              } else if (text.includes('入境卡') && !text.includes('更新')) {
                matchScore = Math.max(matchScore, 60);
              } else if (text.includes('入境卡')) {
                matchScore = Math.max(matchScore, 40);
              }

              // Japanese patterns
              if (text === 'アライバルカード' || text === '入国カード') {
                matchScore = Math.max(matchScore, 100);
              } else if (text.includes('アライバルカード') || text.includes('入国カード')) {
                matchScore = Math.max(matchScore, 50);
              }

              // Korean patterns
              if (text === '입국 카드' || text === '도착 카드') {
                matchScore = Math.max(matchScore, 100);
              } else if (text.includes('입국') || text.includes('도착')) {
                matchScore = Math.max(matchScore, 50);
              }

              // Russian patterns
              if (text === 'Карта прибытия' || text.includes('прибытия')) {
                matchScore = Math.max(matchScore, 80);
              }

              if (matchScore > bestMatchScore) {
                bestMatchScore = matchScore;
                bestMatch = el;
              }
            }

            if (bestMatch) {
              const rect = bestMatch.getBoundingClientRect();
              const isVisible = rect.width > 0 && rect.height > 0;

              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'debug_log',
                message: '🎯 Found Arrival Card button (score: ' + bestMatchScore + '): ' +
                         bestMatch.textContent.trim().substring(0, 30)
              }));

              if (isVisible) {
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'debug_log',
                  message: '✅ Clicking Arrival Card button'
                }));

                bestMatch.click();
                window.arrivalCardClicked = true;

                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'arrival_card_clicked'
                }));
              } else {
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'debug_log',
                  message: '⚠️ Button found but not visible'
                }));
              }
            } else {
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'debug_log',
                message: '❌ Could not find Arrival Card button'
              }));
            }
          }, 1000);

        } catch(e) {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'error',
            message: 'Arrival Card button click error: ' + e.message
          }));
        }
      })();
    `;
  }

  /**
   * Log arrival card button activity
   *
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  static log(event, data = {}) {
    logger.debug(event, data);
  }
}

export default ArrivalCardButtonService;
