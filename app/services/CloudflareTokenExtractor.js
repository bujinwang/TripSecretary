/**
 * Cloudflare Token Extractor
 * Extracts Cloudflare Turnstile token from hidden WebView
 * 
 * Strategy:
 * 1. Load TDAC website in hidden WebView
 * 2. Wait for Cloudflare challenge to complete
 * 3. Inject JavaScript to extract token
 * 4. Return token for API use
 */

class CloudflareTokenExtractor {
  /**
   * JavaScript injection code to extract Cloudflare token
   * This runs inside the WebView context
   */
  static getExtractionScript() {
    return `
      (function() {
        // Method 1: Try to find token in window object
        const findTokenInWindow = () => {
          if (window.turnstile && window.turnstile.getResponse) {
            return window.turnstile.getResponse();
          }
          return null;
        };

        // Method 2: Look for hidden input fields with token
        const findTokenInDOM = () => {
          const selectors = [
            'input[name="cf-turnstile-response"]',
            'input[id="cf-chl-widget-token"]',
            'textarea[name="cf-turnstile-response"]'
          ];
          
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.value) {
              return element.value;
            }
          }
          return null;
        };

        // Method 3: Intercept the token when it's generated
        const findTokenInCallback = () => {
          // This requires the token to be stored somewhere accessible
          if (window.__cfTurnstileToken) {
            return window.__cfTurnstileToken;
          }
          return null;
        };

        // Try all methods
        const token = findTokenInWindow() || findTokenInDOM() || findTokenInCallback();
        
        if (token) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'CLOUDFLARE_TOKEN_EXTRACTED',
            token: token,
            timestamp: Date.now()
          }));
          return token;
        }

        // No token found yet
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CLOUDFLARE_TOKEN_NOT_READY',
          timestamp: Date.now()
        }));
        return null;
      })();
    `;
  }

  /**
   * JavaScript to intercept Cloudflare callback
   * This must be injected BEFORE the page loads
   */
  static getInterceptionScript() {
    return `
      (function() {
        // Store token when turnstile callback fires
        window.__cfTurnstileToken = null;
        
        // Override the callback if it exists
        const originalCallback = window.onloadTurnstileCallback;
        window.onloadTurnstileCallback = function() {
          if (originalCallback) {
            originalCallback.apply(this, arguments);
          }
          
          // Try to get token after callback
          setTimeout(() => {
            if (window.turnstile && window.turnstile.getResponse) {
              const token = window.turnstile.getResponse();
              if (token) {
                window.__cfTurnstileToken = token;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'CLOUDFLARE_TOKEN_EXTRACTED',
                  token: token,
                  timestamp: Date.now()
                }));
              }
            }
          }, 500);
        };

        // Listen for form submissions that might contain the token
        document.addEventListener('submit', function(e) {
          const formData = new FormData(e.target);
          const token = formData.get('cf-turnstile-response');
          if (token) {
            window.__cfTurnstileToken = token;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'CLOUDFLARE_TOKEN_EXTRACTED',
              token: token,
              timestamp: Date.now()
            }));
          }
        }, true);

        // Monitor for token in hidden fields (polling)
        let pollCount = 0;
        const maxPolls = 60; // 30 seconds max
        const pollInterval = setInterval(() => {
          pollCount++;
          
          const input = document.querySelector('input[name="cf-turnstile-response"], textarea[name="cf-turnstile-response"]');
          if (input && input.value) {
            window.__cfTurnstileToken = input.value;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'CLOUDFLARE_TOKEN_EXTRACTED',
              token: input.value,
              timestamp: Date.now()
            }));
            clearInterval(pollInterval);
          }

          // Check turnstile API
          if (window.turnstile && window.turnstile.getResponse) {
            const token = window.turnstile.getResponse();
            if (token) {
              window.__cfTurnstileToken = token;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CLOUDFLARE_TOKEN_EXTRACTED',
                token: token,
                timestamp: Date.now()
              }));
              clearInterval(pollInterval);
            }
          }

          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'CLOUDFLARE_TOKEN_TIMEOUT',
              timestamp: Date.now()
            }));
          }
        }, 500);

        // Notify that interception is ready
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CLOUDFLARE_INTERCEPTION_READY',
          timestamp: Date.now()
        }));
      })();
    `;
  }

  /**
   * Get the TDAC URL to load for token extraction
   */
  static getTDACUrl() {
    return 'https://tdac.immigration.go.th/';
  }
}

export default CloudflareTokenExtractor;
