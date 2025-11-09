#!/bin/bash

# Test script to simulate what Telex sends to your A2A endpoint
# This helps debug issues with workflow triggering

ENDPOINT="https://backend-stage3-5qiqiexrf-ucheroyal2021-2830s-projects.vercel.app/a2a/agent/telex-codebuddy"

echo "🧪 Testing A2A Endpoint: $ENDPOINT"
echo ""

# Test 1: Simple message (what Telex likely sends)
echo "📝 Test 1: Simple text message"
curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "msg-001",
    "text": "Hello CodeBuddy!",
    "user": {"id": "user-123", "name": "Test User"},
    "channel_id": "019a5331-c458-79c0-b008-aa5889cdba3b"
  }' | jq '.'

echo -e "\n\n"

# Test 2: Code review request
echo "📝 Test 2: Code review request"
curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "msg-002",
    "text": "review: function add(a, b) { return a + b; }",
    "user": {"id": "user-123", "name": "Test User"},
    "channel_id": "019a5331-c458-79c0-b008-aa5889cdba3b"
  }' | jq '.'

echo -e "\n\n"

# Test 3: JSON-RPC 2.0 format (Mastra standard)
echo "📝 Test 3: JSON-RPC 2.0 format"
curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "test-003",
    "method": "agent.execute",
    "params": {
      "message": {
        "role": "user",
        "parts": [{"kind": "text", "text": "explain: async/await in JavaScript"}]
      },
      "contextId": "019a5331-c458-79c0-b008-aa5889cdba3b",
      "taskId": "task-123"
    }
  }' | jq '.'

echo -e "\n\n✅ All tests completed!"
