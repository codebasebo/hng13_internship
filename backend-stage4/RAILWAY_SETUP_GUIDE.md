# Railway Setup Guide - Enable Notification Functionality

This guide will help you configure RabbitMQ and Redis to enable the notification endpoint on your Railway deployment.

## Current Status
- ✅ API Gateway deployed and healthy
- ⚠️ Notification endpoint not working (requires RabbitMQ & Redis)

## Quick Setup Steps

### Step 1: Sign up for CloudAMQP (Free RabbitMQ)

1. Go to https://www.cloudamqp.com/
2. Click "Sign Up" - it's FREE
3. Create a new instance:
   - **Plan**: Little Lemur (Free)
   - **Region**: Choose closest to your Railway deployment (Europe)
   - **Name**: hng13-notifications
4. Click on your instance
5. Copy the **AMQP URL** (looks like: `amqps://user:pass@server.cloudamqp.com/vhost`)

### Step 2: Sign up for Upstash Redis (Free)

1. Go to https://upstash.com/
2. Click "Get Started" - it's FREE
3. Create a new database:
   - **Name**: hng13-redis
   - **Type**: Regional
   - **Region**: Choose Europe (same as Railway)
4. Click on your database
5. Copy the **Redis URL** from the "Connect" section

### Step 3: Configure Railway Environment Variables

1. Go to your Railway project: https://railway.app/
2. Click on your **api-gateway** service
3. Go to the **Variables** tab
4. Add these environment variables:

```bash
RABBITMQ_URL=amqps://your-cloudamqp-url-here
REDIS_URL=redis://your-upstash-url-here
```

**Important:** Replace the placeholder values with your actual URLs from Step 1 and Step 2.

### Step 4: Redeploy

Railway will automatically redeploy when you add the variables. If not:
1. Go to **Deployments** tab
2. Click **Deploy** on the latest deployment

### Step 5: Test the Notification Endpoint

Once redeployed, test with:

```bash
curl -X POST https://hng13internship-production-a451.up.railway.app/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "email",
    "user_id": "test-user-id",
    "template_code": "welcome_email",
    "variables": {
      "name": "Test User",
      "message": "Hello from Railway!"
    },
    "priority": 2
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "request_id": "uuid-here",
    "status": "queued",
    "message": "Notification has been queued for processing"
  },
  "message": "Notification queued successfully"
}
```

## Detailed Configuration

### CloudAMQP Setup Details

**Free Tier Limits:**
- 1 Million messages per month
- 20 concurrent connections
- Perfect for development and small projects

**Configuration:**
1. After creating instance, go to **Details**
2. Note these values (Railway will use them):
   - **URL**: Full AMQP connection string
   - **Host**: Server hostname
   - **User & VHost**: Already in URL

### Upstash Redis Setup Details

**Free Tier Limits:**
- 10,000 commands per day
- 256 MB storage
- Perfect for caching and rate limiting

**Configuration:**
1. After creating database, go to **Details**
2. Copy the **REDIS_URL** (format: `redis://:password@host:port`)
3. Or use the **REDISS_URL** for SSL (recommended)

## Environment Variables Reference

Add these to Railway (Variables tab):

```env
# Required for notifications
RABBITMQ_URL=amqps://username:password@server.cloudamqp.com/vhost
REDIS_URL=redis://:password@host:port

# Optional but recommended
NODE_ENV=production
JWT_SECRET=your-secret-key-change-this

# If you deploy full microservices later
DATABASE_URL_USER=postgresql://...
DATABASE_URL_TEMPLATE=postgresql://...
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FCM_SERVER_KEY=your-fcm-key
```

## Troubleshooting

### Issue: Notification endpoint still returns 404

**Solution:**
1. Check Railway logs for connection errors
2. Verify environment variables are set correctly
3. Ensure service has redeployed after adding variables
4. Check CloudAMQP and Upstash dashboards for connection attempts

### Issue: "Connection refused" in logs

**Solution:**
- **RabbitMQ**: Make sure URL starts with `amqps://` (with 's')
- **Redis**: Check if you need `rediss://` (with 's') for SSL

### Issue: "Authentication failed"

**Solution:**
- Copy the full URL from CloudAMQP/Upstash (includes credentials)
- Don't modify the URL format
- Check for extra spaces when pasting

## Cost Breakdown

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| Railway | Hobby | $5/month | 500 hours, $5 credit |
| CloudAMQP | Little Lemur | FREE | 1M msgs/month |
| Upstash Redis | Free | FREE | 10K commands/day |
| **Total** | | **$5/month** | Enough for testing |

## Next Steps After Setup

Once RabbitMQ and Redis are configured:

1. ✅ Notification endpoint will work
2. Consider deploying other services:
   - User Service (needs PostgreSQL)
   - Template Service (needs PostgreSQL)
   - Email Service (needs SMTP config)
   - Push Service (needs FCM key)

3. Add PostgreSQL for full functionality:
   - Railway provides PostgreSQL plugin
   - Or use Supabase free tier

## Quick Copy-Paste Commands

### Test health (should always work):
```bash
curl https://hng13internship-production-a451.up.railway.app/health
```

### Test notification (after setup):
```bash
curl -X POST https://hng13internship-production-a451.up.railway.app/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"notification_type":"email","user_id":"test","template_code":"welcome","variables":{"name":"Test"},"priority":2}'
```

## Support Links

- Railway Dashboard: https://railway.app/
- CloudAMQP Dashboard: https://customer.cloudamqp.com/
- Upstash Console: https://console.upstash.com/
- Railway Docs: https://docs.railway.app/

---

**Estimated Setup Time:** 15 minutes  
**Difficulty:** Easy  
**Cost:** $5/month (Railway only, rest is free)
