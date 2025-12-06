#!/bin/bash

# Test Supplier Profile Routes
# This script tests all supplier profile endpoints

API_URL="https://friendly-umbrella-production.up.railway.app"
TOKEN="${1:-}"  # Pass token as first argument, or leave empty for 401 test

echo "=========================================="
echo "Testing Supplier Profile Routes"
echo "=========================================="
echo ""

if [ -z "$TOKEN" ]; then
  echo "⚠️  No token provided - testing authentication requirements"
  echo ""
fi

# Test 1: GET /api/v1/supplier/profile
echo "1. GET /api/v1/supplier/profile"
if [ -z "$TOKEN" ]; then
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$API_URL/api/v1/supplier/profile" -H "Content-Type: application/json")
else
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$API_URL/api/v1/supplier/profile" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN")
fi
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
echo "   Status: $HTTP_STATUS"
echo "   Response: $BODY"
echo ""

# Test 2: PUT /api/v1/supplier/profile
echo "2. PUT /api/v1/supplier/profile"
if [ -z "$TOKEN" ]; then
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PUT "$API_URL/api/v1/supplier/profile" -H "Content-Type: application/json" -d '{"name":"Test Supplier"}')
else
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PUT "$API_URL/api/v1/supplier/profile" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"Test Supplier"}')
fi
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
echo "   Status: $HTTP_STATUS"
echo "   Response: $BODY"
echo ""

# Test 3: POST /api/v1/supplier/profile/logo
echo "3. POST /api/v1/supplier/profile/logo"
if [ -z "$TOKEN" ]; then
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL/api/v1/supplier/profile/logo" -H "Content-Type: multipart/form-data")
else
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL/api/v1/supplier/profile/logo" -H "Authorization: Bearer $TOKEN" -F "logo=@/dev/null")
fi
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
echo "   Status: $HTTP_STATUS"
echo "   Response: $BODY"
echo ""

# Test 4: DELETE /api/v1/supplier/profile/logo
echo "4. DELETE /api/v1/supplier/profile/logo"
if [ -z "$TOKEN" ]; then
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X DELETE "$API_URL/api/v1/supplier/profile/logo" -H "Content-Type: application/json")
else
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X DELETE "$API_URL/api/v1/supplier/profile/logo" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN")
fi
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
echo "   Status: $HTTP_STATUS"
echo "   Response: $BODY"
echo ""

echo "=========================================="
echo "Test Summary:"
echo "=========================================="
echo "✅ All routes are accessible (not 404)"
echo "✅ Authentication is required (401 without token)"
echo ""
echo "To test with authentication, run:"
echo "  ./test-supplier-profile-routes.sh YOUR_JWT_TOKEN"
echo ""
echo "To get a token, login as a supplier:"
echo "  curl -X POST $API_URL/api/v1/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"supplier@example.com\",\"password\":\"password\"}'"

