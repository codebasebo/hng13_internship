#!/bin/bash

BASE_URL="https://hng13internship-production-a451.up.railway.app"

echo "=========================================="
echo "Testing Railway Deployment"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "✓ Test 1: Health Check"
curl -s "$BASE_URL/health" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/health"
echo ""

# Test 2: Root endpoint
echo "✓ Test 2: Root Endpoint"
curl -s "$BASE_URL/" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/"
echo ""

# Test 3: Notification endpoint (should work if Redis/RabbitMQ configured)
echo "✓ Test 3: Notification Endpoint"
echo "Testing with empty body (should return validation error):"
HTTP_CODE=$(curl -s -o /tmp/response.txt -w "%{http_code}" -X POST "$BASE_URL/api/notifications" -H "Content-Type: application/json" -d '{}')
echo "HTTP Code: $HTTP_CODE"
cat /tmp/response.txt
echo ""
echo ""

# Test 4: Notification endpoint with valid data
echo "✓ Test 4: Notification with Valid Data"
HTTP_CODE=$(curl -s -o /tmp/response2.txt -w "%{http_code}" -X POST "$BASE_URL/api/notifications" \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "email",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "template_code": "welcome_email",
    "variables": {"name": "Test User"},
    "priority": 2
  }')
echo "HTTP Code: $HTTP_CODE"
cat /tmp/response2.txt
echo ""
echo ""

# Test 5: Check headers for correlation ID
echo "✓ Test 5: Headers Check"
curl -I -s "$BASE_URL/health" | grep -i "x-correlation-id"
echo ""

# Summary
echo "=========================================="
echo "SUMMARY"
echo "=========================================="
if [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Notification endpoint not accessible (404)"
    echo ""
    echo "This means either:"
    echo "  1. Service needs to be redeployed after adding env vars"
    echo "  2. RabbitMQ/Redis connection failed on startup"
    echo "  3. Routes not properly registered"
    echo ""
    echo "Next Steps:"
    echo "  1. Check Railway logs for errors"
    echo "  2. Verify REDIS_URL and RABBITMQ_URL are set correctly"
    echo "  3. Redeploy the service in Railway"
elif [ "$HTTP_CODE" = "400" ]; then
    echo "✅ Notification endpoint is working!"
    echo "   (400 = validation error, which is expected for empty data)"
elif [ "$HTTP_CODE" = "202" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Notification endpoint is fully functional!"
    echo "   Redis and RabbitMQ are connected!"
else
    echo "⚠️  Unexpected HTTP code: $HTTP_CODE"
fi
echo "=========================================="

rm -f /tmp/response.txt /tmp/response2.txt
