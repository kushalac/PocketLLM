#!/bin/bash

echo "🧪 Testing Error Message Persistence..."
echo ""

# 1. Create a new session
echo "📝 Step 1: Creating a new chat session..."
SESSION_RESPONSE=$(curl -s -X POST http://localhost:5000/api/chat/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-user1" \
  -d '{}')

SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"sessionId":"[^"]*' | cut -d'"' -f4)
echo "✅ Session created: $SESSION_ID"
echo ""

# 2. Send a message that might timeout
echo "📨 Step 2: Sending a message (may timeout based on settings)..."
curl -s -X POST http://localhost:5000/api/chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-user1" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"message\": \"Write a long story about the history of technology\"}" | head -5
echo ""
echo "✅ Message sent"
echo ""

# 3. Fetch messages immediately
echo "📋 Step 3: Fetching messages immediately after sending..."
curl -s -X GET "http://localhost:5000/api/chat/messages?sessionId=$SESSION_ID" \
  -H "Authorization: Bearer test-token-user1" | jq '.messages[-1] | {role, status, content: (.content | if length > 100 then .[0:100] + "..." else . end)}'
echo ""

# 4. Wait a few seconds
echo "⏳ Step 4: Waiting 5 seconds..."
sleep 5
echo "✅ Done waiting"
echo ""

# 5. Fetch messages again (simulating navigation away and back)
echo "📋 Step 5: Fetching messages again (simulating return from another chat)..."
MESSAGES=$(curl -s -X GET "http://localhost:5000/api/chat/messages?sessionId=$SESSION_ID" \
  -H "Authorization: Bearer test-token-user1" | jq '.messages[-1] | {role, status, content: (.content | if length > 100 then .[0:100] + "..." else . end)}')
echo "$MESSAGES"
echo ""

# 6. Check if error message persists
STATUS=$(echo "$MESSAGES" | jq -r '.status')
if [ "$STATUS" = "error" ]; then
  echo "✅ SUCCESS: Error message persisted to database with status='error'"
else
  echo "❌ FAILED: Error message not found or status incorrect (status: $STATUS)"
fi
echo ""
echo "🎯 Test complete!"
