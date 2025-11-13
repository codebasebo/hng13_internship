# API Testing Guide

This guide provides examples for testing all API endpoints using cURL.

## Setup

1. Start all services:
```bash
docker-compose up -d
```

2. Wait for services to be healthy:
```bash
docker-compose ps
```

## 1. User Service Tests

### Register a new user

```bash
curl -X POST http://localhost:3001/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "preferences": {
      "email": true,
      "push": true
    },
    "push_token": "fcm-token-here"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Save the token from the response:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get user by ID

```bash
USER_ID="user-uuid-from-registration"

curl -X GET http://localhost:3001/api/v1/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Update user

```bash
curl -X PUT http://localhost:3001/api/v1/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "preferences": {
      "email": false,
      "push": true
    }
  }'
```

### List users

```bash
curl -X GET "http://localhost:3001/api/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

## 2. Template Service Tests

### Create email template

```bash
curl -X POST http://localhost:3002/api/v1/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "welcome_email",
    "name": "Welcome Email",
    "type": "email",
    "subject": "Welcome {{name}}!",
    "content": "<h1>Hello {{name}}</h1><p>Welcome! Click <a href=\"{{link}}\">here</a> to get started.</p>",
    "language": "en"
  }'
```

### Create push template

```bash
curl -X POST http://localhost:3002/api/v1/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "reminder_push",
    "name": "Reminder Push",
    "type": "push",
    "subject": "{{title}}",
    "content": "{{message}}",
    "language": "en"
  }'
```

### Get template by code

```bash
curl -X GET "http://localhost:3002/api/v1/templates/code/welcome_email?language=en"
```

### Render template

```bash
curl -X POST http://localhost:3002/api/v1/templates/render/welcome_email \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "name": "John Doe",
      "link": "https://example.com/welcome"
    }
  }'
```

### List templates

```bash
curl -X GET "http://localhost:3002/api/v1/templates?page=1&limit=10&type=email" \
  -H "Authorization: Bearer $TOKEN"
```

### Get template versions

```bash
curl -X GET http://localhost:3002/api/v1/templates/versions/welcome_email \
  -H "Authorization: Bearer $TOKEN"
```

## 3. Notification Tests (API Gateway)

### Send email notification

```bash
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "email",
    "user_id": "'$USER_ID'",
    "template_code": "welcome_email",
    "variables": {
      "name": "John Doe",
      "link": "https://example.com/welcome"
    },
    "priority": 3,
    "metadata": {
      "campaign": "onboarding"
    }
  }'
```

Save the request_id from response:
```bash
REQUEST_ID="notification-uuid"
```

### Send push notification

```bash
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "push",
    "user_id": "'$USER_ID'",
    "template_code": "reminder_push",
    "variables": {
      "title": "Meeting Reminder",
      "message": "Your meeting starts in 10 minutes"
    },
    "priority": 4
  }'
```

### Get notification status

```bash
curl -X GET http://localhost:3000/api/v1/notifications/status/$REQUEST_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Test idempotency (send same notification twice)

```bash
REQUEST_ID_CUSTOM="my-unique-request-id-123"

# First request
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "email",
    "user_id": "'$USER_ID'",
    "template_code": "welcome_email",
    "request_id": "'$REQUEST_ID_CUSTOM'",
    "variables": {
      "name": "John Doe",
      "link": "https://example.com"
    }
  }'

# Second request (should return cached result)
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "email",
    "user_id": "'$USER_ID'",
    "template_code": "welcome_email",
    "request_id": "'$REQUEST_ID_CUSTOM'",
    "variables": {
      "name": "John Doe",
      "link": "https://example.com"
    }
  }'
```

## 4. Health Checks

```bash
# API Gateway
curl http://localhost:3000/health

# User Service
curl http://localhost:3001/health

# Template Service
curl http://localhost:3002/health

# Email Service
curl http://localhost:3003/health

# Push Service
curl http://localhost:3004/health
```

## 5. Rate Limiting Test

Test rate limiting by making many requests quickly:

```bash
for i in {1..110}; do
  echo "Request $i"
  curl -X GET http://localhost:3000/health
  echo ""
done
```

After 100 requests, you should see a 429 (Too Many Requests) response.

## 6. Complete Flow Test

This script tests the complete notification flow:

```bash
#!/bin/bash

# 1. Register user
echo "1. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "preferences": {"email": true, "push": true}
  }')

USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.data.id')
echo "User ID: $USER_ID"

# 2. Login
echo -e "\n2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo "Token: ${TOKEN:0:20}..."

# 3. Create template
echo -e "\n3. Creating template..."
curl -s -X POST http://localhost:3002/api/v1/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test_email",
    "name": "Test Email",
    "type": "email",
    "subject": "Test Email for {{name}}",
    "content": "<h1>Hello {{name}}!</h1>",
    "language": "en"
  }' | jq

# 4. Send notification
echo -e "\n4. Sending notification..."
NOTIF_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "email",
    "user_id": "'$USER_ID'",
    "template_code": "test_email",
    "variables": {"name": "Test User", "link": "https://example.com"},
    "priority": 3
  }')

REQUEST_ID=$(echo $NOTIF_RESPONSE | jq -r '.data.request_id')
echo "Request ID: $REQUEST_ID"

# 5. Wait a bit
echo -e "\n5. Waiting for processing..."
sleep 3

# 6. Check status
echo -e "\n6. Checking notification status..."
curl -s -X GET http://localhost:3000/api/v1/notifications/status/$REQUEST_ID \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n✅ Complete flow test finished!"
```

Save this as `test-flow.sh`, make it executable, and run:

```bash
chmod +x test-flow.sh
./test-flow.sh
```

## Monitoring RabbitMQ

Visit RabbitMQ Management UI:
```
http://localhost:15672
Username: admin
Password: admin
```

You can see:
- Message rates
- Queue lengths
- Consumer status
- Exchange bindings

## Troubleshooting

### Check service logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f email-service

# Last 100 lines
docker-compose logs --tail=100 email-service
```

### Check queue status

```bash
# Using RabbitMQ CLI
docker exec rabbitmq rabbitmqctl list_queues
```

### Check Redis cache

```bash
# Connect to Redis
docker exec -it redis redis-cli

# List all keys
KEYS *

# Get a specific key
GET "user:preferences:user-id-here"
```

### Reset everything

```bash
docker-compose down -v
docker-compose up -d
```
