#!/bin/bash

echo "Checking Railway deployment version..."
echo ""

RESPONSE=$(curl -s https://hng13internship-production-a451.up.railway.app/)

echo "Current deployment info:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "Looking for version 1.0.1 and trustProxy setting..."

if echo "$RESPONSE" | grep -q '"version":"1.0.1"'; then
    echo "✅ NEW VERSION DETECTED! (v1.0.1)"
    
    if echo "$RESPONSE" | grep -q '"trustProxy"'; then
        echo "✅ Trust proxy configuration is present!"
    fi
    
    echo ""
    echo "Testing notification endpoint..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://hng13internship-production-a451.up.railway.app/api/notifications -H "Content-Type: application/json" -d '{}')
    
    if [ "$HTTP_CODE" = "400" ]; then
        echo "✅ Notification endpoint is WORKING! (HTTP 400 = validation error)"
    elif [ "$HTTP_CODE" = "404" ]; then
        echo "❌ Still 404 - endpoint not registered"
    else
        echo "HTTP Code: $HTTP_CODE"
    fi
else
    echo "❌ Still running old version (1.0.0)"
    echo ""
    echo "Railway hasn't deployed the new code yet."
    echo ""
    echo "Options:"
    echo "1. Wait a few more minutes"
    echo "2. Go to Railway dashboard and manually click 'Redeploy'"
    echo "3. Check Railway settings → Make sure it's watching 'main' branch"
fi
