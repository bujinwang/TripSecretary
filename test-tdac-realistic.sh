#!/bin/bash

# Test with a more realistic Cloudflare token (longer)
echo "🔍 Testing TDAC API with realistic token length..."

BASE_URL="https://tdac.immigration.go.th/arrival-card-api/api/v1"
SUBMIT_ID="mgh4r95t3f0zp1xwpgzmfk3"

# Create a longer token similar to what the app uses (1093 characters as shown in logs)
REALISTIC_TOKEN="0.awHSOuLf9FyuVAvRayThlK7LgafX42kozoO6n5nWeknOUIsv5u55qVt8mBBojkSlQs1CbhCNA8Khk559PDzo4xHFMDfjXBTTYWnGM_V8HuaX_5V_AVJhO40cVJNUX27suutfToidKutc7c7GPV3_zz0ZkYm0j4NxoMJtovBtubM-m32lOo1iUTRhAEqtawHSOuLf9FyuVAvRayThlK7LgafX42kozoO6n5nWeknOUIsv5u55qVt8mBBojkSlQs1CbhCNA8Khk559PDzo4xHFMDfjXBTTYWnGM_V8HuaX_5V_AVJhO40cVJNUX27suutfToidKutc7c7GPV3_zz0ZkYm0j4NxoMJtovBtubM-m32lOo1iUTRhAEqtawHSOuLf9FyuVAvRayThlK7LgafX42kozoO6n5nWeknOUIsv5u55qVt8mBBojkSlQs1CbhCNA8Khk559PDzo4xHFMDfjXBTTYWnGM_V8HuaX_5V_AVJhO40cVJNUX27suutfToidKutc7c7GPV3_zz0ZkYm0j4NxoMJtovBtubM-m32lOo1iUTRhAEqtawHSOuLf9FyuVAvRayThlK7LgafX42kozoO6n5nWeknOUIsv5u55qVt8mBBojkSlQs1CbhCNA8Khk559PDzo4xHFMDfjXBTTYWnGM_V8HuaX_5V_AVJhO40cVJNUX27suutfToidKutc7c7GPV3_zz0ZkYm0j4NxoMJtovBtubM-m32lOo1iUTRhAEqtawHSOuLf9FyuVAvRayThlK7LgafX42kozoO6n5nWeknOUIsv5u55qVt8mBBojkSlQs1CbhCNA8Khk559PDzo4xHFMDfjXBTTYWnGM_V8HuaX_5V_AVJhO40cVJNUX27suutfToidKutc7c7GPV3_zz0ZkYm0j4NxoMJtovBtubM-m32lOo1iUTRhAEqt"

echo "Token length: ${#REALISTIC_TOKEN} characters"
echo "Submit ID: $SUBMIT_ID"

# Test with verbose output to see exactly what's happening
echo ""
echo "📡 Testing with realistic token and verbose output..."

start_time=$(date +%s)

curl -v \
    --connect-timeout 10 \
    --max-time 20 \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "{\"token\":\"$REALISTIC_TOKEN\",\"langague\":\"EN\"}" \
    "$BASE_URL/security/initActionToken?submitId=$SUBMIT_ID"

curl_exit_code=$?
end_time=$(date +%s)
duration=$((end_time - start_time))

echo ""
echo "Duration: ${duration}s"
echo "Exit code: $curl_exit_code"

# Also test the exact same request format as the app
echo ""
echo "📡 Testing with exact app format..."

cat > request_body.json << EOF
{
  "token": "$REALISTIC_TOKEN",
  "langague": "EN"
}
EOF

echo "Request body size: $(wc -c < request_body.json) bytes"

start_time=$(date +%s)

curl -v \
    --connect-timeout 10 \
    --max-time 20 \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    --data @request_body.json \
    "$BASE_URL/security/initActionToken?submitId=$SUBMIT_ID"

curl_exit_code=$?
end_time=$(date +%s)
duration=$((end_time - start_time))

echo ""
echo "Duration: ${duration}s"
echo "Exit code: $curl_exit_code"

# Clean up
rm -f request_body.json

echo ""
echo "🏁 Realistic test completed!"