// @ts-nocheck

/**
 * Network Capability Detector
 * Detects network connectivity and API compatibility
 * Note: iOS 18.5+ simulator networking issues have been resolved
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
      console.log('❌ Fetch API issue detected - may need WebView fallback');
      console.log('   Error:', error.name, error.message);
      return false;
    }
  }
  
  static async shouldUseWebViewMode() {
    // Check if we're in an environment where fetch doesn't work
    // Note: This is now rare with iOS 18.5+ simulator fixes
    const fetchWorks = await this.testFetchCapability();
    
    if (!fetchWorks) {
      console.log('🌐 Fetch API not available - recommending WebView mode');
      console.log('   Note: This is unusual with iOS 18.5+ simulators');
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