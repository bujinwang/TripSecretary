#!/bin/bash

# Test TDAC API connectivity and response times
echo "🔍 Testing TDAC API connectivity..."

BASE_URL="https://tdac.immigration.go.th/arrival-card-api/api/v1"
SUBMIT_ID="mgh4rtest123456789012"

# Test 1: Basic connectivity
echo ""
echo "📡 Test 1: Basic connectivity check..."
curl -I --connect-timeout 10 --max-time 30 "$BASE_URL" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Base URL is reachable"
else
    echo "❌ Base URL is not reachable"
fi

# Test 2: Check if the initActionToken endpoint responds
echo ""
echo "📡 Test 2: Testing initActionToken endpoint..."
echo "URL: $BASE_URL/security/initActionToken?submitId=$SUBMIT_ID"

# Use a dummy token for testing
DUMMY_TOKEN="0.awHSOuLf9FyuVAvRayThlK7LgafX42kozoO6n5nWeknOUIsv5u55qVt8mBBojkSlQs1CbhCNA8Khk559PDzo4xHFMDfjXBTTYWnGM_V8HuaX_5V_AVJhO40cVJNUX27suutfToidKutc7c7GPV3_zz0ZkYm0j4NxoMJtovBtubM-m32lOo1iUTRhAEqt"

# Test with different timeout values
for timeout in 15 30 45 60; do
    echo ""
    echo "⏱️  Testing with ${timeout}s timeout..."
    
    start_time=$(date +%s)
    
    response=$(curl -s \
        --connect-timeout 10 \
        --max-time $timeout \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "{\"token\":\"$DUMMY_TOKEN\",\"langague\":\"EN\"}" \
        "$BASE_URL/security/initActionToken?submitId=$SUBMIT_ID" 2>&1)
    
    curl_exit_code=$?
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    echo "   Duration: ${duration}s"
    echo "   Exit code: $curl_exit_code"
    
    case $curl_exit_code in
        0)
            echo "   ✅ Request completed successfully"
            echo "   Response preview: $(echo "$response" | head -c 200)..."
            ;;
        28)
            echo "   ⏰ Request timed out after ${timeout}s"
            ;;
        7)
            echo "   🚫 Failed to connect to host"
            ;;
        *)
            echo "   ❌ Request failed with exit code: $curl_exit_code"
            echo "   Error: $response"
            ;;
    esac
done

# Test 3: Check DNS resolution
echo ""
echo "📡 Test 3: DNS resolution check..."
nslookup tdac.immigration.go.th
if [ $? -eq 0 ]; then
    echo "✅ DNS resolution successful"
else
    echo "❌ DNS resolution failed"
fi

# Test 4: Ping test
echo ""
echo "📡 Test 4: Ping test..."
ping -c 3 tdac.immigration.go.th
if [ $? -eq 0 ]; then
    echo "✅ Host is reachable via ping"
else
    echo "❌ Host is not reachable via ping"
fi

echo ""
echo "🏁 Test completed!"