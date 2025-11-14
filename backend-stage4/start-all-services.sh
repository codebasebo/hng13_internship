#!/bin/bash

# Start All Services Script for Railway
# This script starts all microservices required for the notification system

echo "=========================================="
echo "Starting Distributed Notification System"
echo "=========================================="

# Set default ports if not provided
export PORT=${PORT:-3000}
export USER_SERVICE_PORT=${USER_SERVICE_PORT:-3001}
export TEMPLATE_SERVICE_PORT=${TEMPLATE_SERVICE_PORT:-3002}
export EMAIL_SERVICE_PORT=${EMAIL_SERVICE_PORT:-3003}
export PUSH_SERVICE_PORT=${PUSH_SERVICE_PORT:-3004}

# Set service URLs for inter-service communication
export USER_SERVICE_URL=http://localhost:${USER_SERVICE_PORT}
export TEMPLATE_SERVICE_URL=http://localhost:${TEMPLATE_SERVICE_PORT}
export EMAIL_SERVICE_URL=http://localhost:${EMAIL_SERVICE_PORT}
export PUSH_SERVICE_URL=http://localhost:${PUSH_SERVICE_PORT}

# Function to start a service in background
start_service() {
    local service_name=$1
    local service_port=$2
    local service_path=$3
    
    echo "Starting $service_name on port $service_port..."
    PORT=$service_port node $service_path > /tmp/${service_name}.log 2>&1 &
    local pid=$!
    echo "$service_name started with PID $pid"
    
    # Wait a bit for service to start
    sleep 2
    
    # Check if process is still running
    if ps -p $pid > /dev/null; then
        echo "✓ $service_name is running"
    else
        echo "✗ $service_name failed to start"
        cat /tmp/${service_name}.log
    fi
}

# Start User Service
start_service "user-service" $USER_SERVICE_PORT "dist/services/user-service/src/index.js"

# Start Template Service
start_service "template-service" $TEMPLATE_SERVICE_PORT "dist/services/template-service/src/index.js"

# Start Email Service
start_service "email-service" $EMAIL_SERVICE_PORT "dist/services/email-service/src/index.js"

# Start Push Service
start_service "push-service" $PUSH_SERVICE_PORT "dist/services/push-service/src/index.js"

# Start API Gateway (foreground)
echo "Starting API Gateway on port $PORT..."
echo "=========================================="
node dist/services/api-gateway/src/index.js
