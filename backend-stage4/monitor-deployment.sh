#!/bin/bash

BASE_URL="https://hng13internship-production-a451.up.railway.app"

echo "=========================================="
echo "🔍 Monitoring Railway Deployment"
echo "=========================================="
echo ""
echo "Checking every 15 seconds for new deployment..."
echo "Press Ctrl+C to stop"
echo ""

LAST_UPTIME=""

while true; do
    RESPONSE=$(curl -s "$BASE_URL/health" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        UPTIME=$(echo "$RESPONSE" | grep -o '"uptime":[0-9.]*' | cut -d: -f2)
        TIMESTAMP=$(date "+%H:%M:%S")
        
        if [ -n "$UPTIME" ]; then
            UPTIME_INT=$(echo "$UPTIME" | cut -d. -f1)
            
            # If uptime < 60 seconds, new deployment detected!
            if [ "$UPTIME_INT" -lt 60 ]; then
                echo ""
                echo "=========================================="
                echo "🎉 NEW DEPLOYMENT DETECTED!"
                echo "=========================================="
                echo "Uptime: ${UPTIME}s (< 60s = fresh deployment)"
                echo "Time: $TIMESTAMP"
                echo ""
                echo "Testing notification endpoint..."
                
                HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/notifications" \
                    -H "Content-Type: application/json" \
                    -d '{}')
                
                if [ "$HTTP_CODE" = "404" ]; then
                    echo "❌ Still 404 - Redis/RabbitMQ might not be connected"
                elif [ "$HTTP_CODE" = "400" ]; then
                    echo "✅ Working! (400 = validation error, endpoint is alive)"
                elif [ "$HTTP_CODE" = "500" ]; then
                    echo "⚠️  500 error - Check Railway logs for connection errors"
                else
                    echo "HTTP Code: $HTTP_CODE"
                fi
                
                echo ""
                echo "Run full test with: ./test-deployment.sh"
                break
            else
                echo "[$TIMESTAMP] Uptime: ${UPTIME}s - Waiting for new deployment..."
            fi
        else
            echo "[$TIMESTAMP] ⚠️  Cannot reach service"
        fi
    else
        echo "[$TIMESTAMP] ❌ Service unreachable (might be deploying)"
    fi
    
    sleep 15
done
