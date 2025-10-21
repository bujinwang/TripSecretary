/**
 * Network Capability Detector
 * Detects if fetch API works properly in the current environment
 * Falls back to WebView mode if fetch is blocked (e.g., iOS Simulator)
 */

class NetworkCapabilityDetector {
  static async testFetchCapability() {
    console.log('🔍 Testing fetch capability...');
    
    try {
      // Quick test with a reliable endpoint and short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 2000); // 2 second timeout
      
      const response = await fetch('https://httpbin.org/get', {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('✅ Fetch API works - can use API mode');
      return true;
      
    } catch (error) {
      console.log('❌ Fetch API blocked - must use WebView mode');
      console.log('   Error:', error.name, error.message);
      return false;
    }
  }
  
  static async shouldUseWebViewMode() {
    // Check if we're in an environment where fetch doesn't work
    const fetchWorks = await this.testFetchCapability();
    
    if (!fetchWorks) {
      console.log('🌐 Fetch API not available - recommending WebView mode');
      return true;
    }
    
    console.log('📡 Fetch API available - can use API mode');
    return false;
  }
  
  static getEnvironmentInfo() {
    return {
      userAgent: navigator.userAgent || 'Not available',
      platform: navigator.platform || 'Not available',
      isSimulator: navigator.userAgent?.includes('Simulator') || false
    };
  }
}

export default NetworkCapabilityDetector;