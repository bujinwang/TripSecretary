#!/bin/bash

# API Testing Script for BorderBuddy Backend
# Tests all endpoints with mock data

BASE_URL="${1:-http://localhost:8787}"
echo "🧪 Testing API at: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  
  echo -n "Testing: $name... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
    echo "Response: $body"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏥 Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Root endpoint" "GET" "/"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Authentication"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Phone login" "POST" "/api/auth/phone" \
  '{"phone":"13800138000","code":"123456"}'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📸 OCR Recognition"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Note: These tests with actual images require curl with multipart/form-data
# For now, testing with mock data endpoint
echo "Testing: Passport OCR... "
echo -e "${YELLOW}⚠ SKIPPED${NC} (requires image file)"
echo ""
echo "Testing: Ticket OCR... "
echo -e "${YELLOW}⚠ SKIPPED${NC} (requires image file)"
echo ""
echo "Testing: Hotel OCR... "
echo -e "${YELLOW}⚠ SKIPPED${NC} (requires image file)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 AI Generation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Generate entry form" "POST" "/api/generate" '{
  "passportId": 1,
  "destination": {
    "id": "th",
    "name": "泰国",
    "nameEn": "Thailand"
  },
  "travelInfo": {
    "flightNumber": "CA981",
    "arrivalDate": "2025-01-15",
    "hotelName": "Bangkok Grand Hotel",
    "hotelAddress": "123 Sukhumvit Road, Bangkok",
    "contactPhone": "+66 2 123 4567",
    "stayDuration": "5",
    "travelPurpose": "Tourism"
  }
}'

test_endpoint "Check duplicate" "GET" "/api/generate/check?passportId=1&destinationId=th&flightNumber=CA981&arrivalDate=2025-01-15"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 History"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Get history" "GET" "/api/history"
test_endpoint "Get specific generation" "GET" "/api/history/1"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👤 Profile"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Get profile" "GET" "/api/profile"
test_endpoint "Update profile" "PUT" "/api/profile" \
  '{"name":"Test User","phone":"13800138000"}'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛂 Passports"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Get passports" "GET" "/api/passports"
test_endpoint "Save passport" "POST" "/api/passports" '{
  "type": "china_passport",
  "passportNo": "E12345678",
  "name": "张伟",
  "nameEn": "ZHANG WEI",
  "gender": "男",
  "birthDate": "1990-01-01",
  "nationality": "中国",
  "issueDate": "2020-01-01",
  "expiryDate": "2030-01-01"
}'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL=$((PASSED + FAILED))
echo -e "Total tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed: $FAILED${NC}"
else
  echo -e "Failed: $FAILED"
fi
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
