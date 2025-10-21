/**
 * Test the fetch TDAC implementation (React Native compatible)
 */

const BASE_URL = 'https://tdac.immigration.go.th/arrival-card-api/api/v1';
const SUBMIT_ID = 'mgh4rtest123456789012';
const TIMEOUT_MS = 30000;

// Test token (from actual app logs)
const TEST_TOKEN = "0.TUpysYr6kCoJdSFEXAGOvXXLH3LPygpU9lg62pb38WbxjmQsk8X7MldRszirvhf7zUGGo9ySZAECC4cPJeScOD8zvpXM6JysgL-ft701BOo9i5ansnnLDJyqOTx69n2PI_eNuGzhXO5Hs571Fqwt7sK2X38nK_OMzIeSOOaXDvSGma-9gYPbnweG4q7rez7pTwqI7wi6TiETLM5EPOXDPemZdAw-9N7iad7Y7xtzmiJTJ_17979PJ_L_nlS4TCF5Sbtv8-uEUYzgXqStjbYwXGvPecKMC_Toa355iWHcZ5uYoh9yhKI92ePStLwIGDxIHJikKYw-CiAolR577cwihV67s8r6ZvWiKIs7yPPHV79pjPfrluqG47Bfwbhmm0OpLdZjDXiELZgvmgPmzDWXDaTnAw1KqJakl-tyiPmuWOazJdzeQeUbZpz_1xDYBjgYR4G8vV4mdgczIDCGovtB8O-qcF3NQGQvtL12FVZeXf9RWzBjA5OzO0uPyVmSONCdGF0SG2NohdF-gWaDIZ2jXGHg9ooYLM44kTmXJKFoOTBh0hmNqt4Q6yDtnu7PGBmQxJB0LzAiizik6Nau0s18r8JZOLTo0j3wJE--n2e898uRfaDeM7JNuhVFZiPjMwbvUyzCYruOkvOjsbPbnG-JwEUXwK1isXCmzniesygQBl5GaM0bO-ZrzCyVN5TXiRufR0-wXG8IMG23OviqQGbL-S6RE8u58O8zzXeUAwif6d3k0pwBtKeuHaMfx6dznXiv1Ti1Z7lfkSwwAPvzsBsC97l_jl0SnYqM--a4LStKaQau7FA198fr88TeJ-icQDU5DY-qCiRJU-evXhiAftoFDDOPu2jEqk8BkoHybcVj7FmRkSOrhZ3l2WVJ2YKY--B-QQZx4Uww5GO1sh7WB-cYdoJEQzLxh1kkRXsP_uvMJA0f_iKFvgvaagrhixIynhLdHKD_7zKFyrEtJcUc5gESi3pD5KJ7cCeqogVwMO19Do4.lvgdg5F0jbi5c5eEPP3Ndg.3654cb72c7a51273fb74c6e3aedcd24d4649d950eafc90fd2605828c7254b59d";

async function testFetchTDAC() {
  console.log('🔍 Testing fetch TDAC implementation (React Native compatible)...');
  
  const apiUrl = `${BASE_URL}/security/initActionToken?submitId=${SUBMIT_ID}`;
  const requestBody = {
    token: TEST_TOKEN,
    langague: 'EN'
  };
  
  console.log('📤 Request details:');
  console.log('   URL:', apiUrl);
  console.log('   Method: POST');
  console.log('   Timeout:', `${TIMEOUT_MS}ms`);
  console.log('   Body:', JSON.stringify(requestBody).substring(0, 100) + '...');
  
  const startTime = Date.now();
  
  // Use fetch with AbortController for timeout (React Native compatible)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.error('⏰ Request timeout after 30 seconds');
  }, TIMEOUT_MS);
  
  try {
    console.log('⏳ Starting fetch request (React Native compatible)...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log('📥 Response received:');
    console.log('   Status:', response.status, response.statusText);
    console.log('   Duration:', `${duration}ms`);
    console.log('   Content-Type:', response.headers.get('content-type'));
    console.log('   OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, errorText);
      return { success: false, duration, error: `HTTP ${response.status}: ${errorText}` };
    }
    
    const responseText = await response.text();
    console.log('   Response length:', responseText.length);
    console.log('   Response preview:', responseText.substring(0, 200) + '...');
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      return { success: false, duration, error: `JSON parse error: ${parseError.message}` };
    }
    
    console.log('   Data type:', typeof data);
    console.log('   Message code:', data.messageCode);
    
    if (data && data.data && data.data.actionToken) {
      console.log('✅ Success! ActionToken received');
      console.log('   Token length:', data.data.actionToken.length);
    } else {
      console.log('⚠️ Response structure unexpected');
    }
    
    return { success: true, duration, data };
    
  } catch (error) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.error('❌ Request failed:');
    console.error('   Duration:', `${duration}ms`);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    
    if (error.name === 'AbortError') {
      console.error('   ⏰ This was a timeout error (AbortController)');
    } else {
      console.error('   🌐 This was a network/other error');
    }
    
    return { success: false, duration, error: error.message };
  }
}

// Run the test
testFetchTDAC().then(result => {
  console.log('');
  console.log('🏁 Test completed:');
  console.log('   Success:', result.success);
  console.log('   Duration:', result.duration + 'ms');
  
  if (result.success) {
    console.log('🎉 Fetch TDAC implementation is working!');
  } else {
    console.log('💥 Fetch TDAC implementation needs debugging');
    console.log('   Error:', result.error);
  }
}).catch(error => {
  console.error('💥 Test script error:', error);
});