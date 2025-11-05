# Deployment Guide - TelexCodeBuddy

This guide provides step-by-step instructions for deploying TelexCodeBuddy to production.

## Prerequisites

- GitHub account with the repository pushed
- Node.js 18+ installed locally
- npm packages installed (`npm install`)
- API keys for Mastra and OpenAI

## Option 1: Vercel (Recommended)

### Why Vercel?
- Zero configuration required
- Automatic deployments on git push
- Free tier with generous limits
- Perfect for serverless agent endpoints
- Built-in environment management

### Steps

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Connect Repository**
   - Click "New Project"
   - Select your repository
   - Vercel auto-detects it's a Node.js project

3. **Configure Project**
   - **Root Directory**: `backend-stage3`
   - **Framework**: Other (Node.js)
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

4. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add all variables from `.env`:
     ```
     MASTRA_API_KEY=sk-...
     OPENAI_API_KEY=sk-...
     TELEX_WEBHOOK_SECRET=...
     PORT=4000
     NODE_ENV=production
     ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Get your URL: `https://your-project.vercel.app`

6. **Test**
   ```bash
   curl -X POST https://your-project.vercel.app/a2a/agent/telex-codebuddy \
     -H "Content-Type: application/json" \
     -d '{"id": "test", "text": "review: const x = 5 == 5;"}'
   ```

### Automatic Deployments

Every push to `main` branch automatically deploys!

```bash
git push origin main  # Automatic deployment triggered
```

---

## Option 2: Railway

### Why Railway?
- More traditional VPS experience
- Better for long-running processes
- Excellent documentation
- Pay-as-you-go pricing (~$5/month for small apps)

### Steps

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   cd backend-stage3
   railway init
   ```

4. **Create Service**
   - Select "Node.js"
   - Name it "TelexCodeBuddy"

5. **Add Environment Variables**
   ```bash
   railway variables
   ```
   Add the following:
   - `MASTRA_API_KEY`
   - `OPENAI_API_KEY`
   - `TELEX_WEBHOOK_SECRET`
   - `PORT=4000`
   - `NODE_ENV=production`

6. **Deploy**
   ```bash
   railway up
   ```

7. **Get URL**
   ```bash
   railway open
   ```
   Copy the deployment URL

---

## Option 3: Render

### Why Render?
- Similar to Railway
- Great free tier
- Easy to understand UI
- Good for learning

### Steps

1. **Create render.yaml**
   ```yaml
   services:
     - type: web
       name: telex-codebuddy
       runtime: node
       buildCommand: cd backend-stage3 && npm install && npm run build
       startCommand: cd backend-stage3 && npm start
       envVars:
         - key: PORT
           value: 4000
           scope: run
         - key: NODE_ENV
           value: production
           scope: run
   ```

2. **Push to GitHub**
   ```bash
   git add render.yaml
   git commit -m "Add Render deployment config"
   git push origin main
   ```

3. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

4. **Create Service**
   - Click "New"
   - Select "Web Service"
   - Connect your GitHub repo
   - Choose `backend-stage3` as root directory

5. **Configure**
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

6. **Add Environment Variables**
   - Go to "Environment"
   - Add all variables from `.env`

7. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Get URL from dashboard

---

## Post-Deployment Checklist

### 1. Update Workflow Configuration

Update `workflow.json` with your deployment URL:

```json
{
  "nodes": [
    {
      "url": "https://your-deployed-url/a2a/agent/telex-codebuddy"
    }
  ]
}
```

### 2. Test Deployed Endpoint

```bash
DEPLOYED_URL="https://your-deployed-url"

curl -X POST $DEPLOYED_URL/a2a/agent/telex-codebuddy \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-1",
    "channel_id": "test-channel",
    "user": {"id": "user-1", "name": "Test User"},
    "text": "review: const x = 5 == 5;",
    "metadata": {}
  }'
```

### 3. Monitor Logs

Each platform has different log locations:

**Vercel:**
- Dashboard → Deployments → Function logs

**Railway:**
```bash
railway logs
```

**Render:**
- Dashboard → Logs tab

### 4. Register with Telex

```
/telex-invite your-email@example.com
```

Then import your workflow.json with the deployed URL.

### 5. Test on Telex.im

Send messages to your agent and verify responses.

### 6. Monitor Agent Logs

```
https://api.telex.im/agent-logs/{channel-id}.txt
```

---

## Scaling Considerations

### Free Tier Limits

| Platform | Concurrent | Requests/month | Cold Start |
|----------|-----------|----------------|-----------|
| Vercel | Unlimited | 1M | <100ms |
| Railway | Unlimited | Variable | 5s |
| Render | Unlimited | Variable | 30s |

### For Production (Higher Volume)

**Vercel Pro**: $20/month
- Priority support
- Advanced scaling
- Custom domains

**Railway Team**: $5-50+/month
- As you scale
- Better monitoring

**Render Pro**: Similar pricing

---

## Performance Optimization

### 1. Use Caching

Add Redis for response caching:

```typescript
import redis from 'redis';

const client = redis.createClient();

app.post('/a2a/agent/telex-codebuddy', async (req, res) => {
  const cacheKey = `${req.body.text}:${req.body.user?.id}`;
  const cached = await client.get(cacheKey);
  
  if (cached) return res.json(JSON.parse(cached));
  
  const response = await runAgent(req.body);
  await client.set(cacheKey, JSON.stringify(response), { EX: 3600 });
  
  res.json(response);
});
```

### 2. Database Integration

Add persistent storage:

```bash
npm install @prisma/client
```

Track user interactions and preferences.

### 3. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

---

## Rollback & Updates

### Vercel
1. Go to Deployments
2. Click on previous deployment
3. Click "Redeploy"

### Railway
```bash
railway rollback
```

### Render
1. Dashboard → Deploys
2. Click "Deploy" on previous version

---

## Monitoring & Alerts

### Setup Uptime Monitoring

**Uptime Robot** (Free):
1. Go to https://uptimerobot.com
2. Add monitor for your endpoint
3. Get alerts if site goes down

**Example:**
- URL: `https://your-deployed-url/`
- Interval: 5 minutes
- HTTP method: GET

### Error Tracking

Add Sentry for error monitoring:

```bash
npm install @sentry/node
```

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN
});

app.use(Sentry.Handlers.errorHandler());
```

---

## Cost Analysis

### Monthly Costs (Estimate)

**Vercel Free:**
- Server: $0
- API calls: $0 (if using mock handlers)
- **Total: $0/month**

**Vercel + OpenAI API:**
- Server: $0
- OpenAI (1000 requests/month @ $0.01): ~$10
- **Total: ~$10/month**

**Railway:**
- Execution: $5
- API calls: ~$10 (with LLM)
- **Total: ~$15/month**

---

## Troubleshooting Deployment

### Build Failures

**Issue**: `npm install` fails
```bash
# Solution: Clear cache
rm -rf node_modules package-lock.json
npm install
```

**Issue**: TypeScript compilation errors
```bash
# Check tsconfig.json
npm run build
```

### Runtime Issues

**Issue**: Port binding error
```
Error: listen EADDRINUSE: address already in use :::4000
```
Solution: The platform automatically assigns ports. Don't hardcode PORT=4000 in production.

**Issue**: Environment variables not loading
```bash
# Verify in platform dashboard
# Check .env file is not in git
git status | grep .env
```

### Cold Starts

**Problem**: First request takes 30+ seconds

**Solution for Vercel:**
- Use Vercel Pro for faster cold starts
- Keep dependencies minimal

**Solution for Railway/Render:**
- Use a paid plan that keeps containers warm
- Monitor cold start metrics

---

## Environment-Specific Config

### Development
```env
NODE_ENV=development
PORT=4000
MASTRA_API_KEY=sk-test-...
```

### Production
```env
NODE_ENV=production
PORT=auto (assigned by platform)
MASTRA_API_KEY=sk-live-...
```

---

## Security Best Practices

1. **Never commit `.env` files**
   ```bash
   echo ".env" >> .gitignore
   ```

2. **Use strong secrets**
   ```bash
   openssl rand -base64 32
   ```

3. **Enable HTTPS**
   - All platforms provide free HTTPS

4. **Validate webhook signatures**
   ```typescript
   import { createHmac } from 'crypto';
   
   function verifySignature(body, signature) {
     const hash = createHmac('sha256', process.env.WEBHOOK_SECRET)
       .update(body)
       .digest('hex');
     return hash === signature;
   }
   ```

5. **Limit CORS**
   ```typescript
   app.use(cors({
     origin: ['https://telex.im', 'https://api.telex.im']
   }));
   ```

---

## Success Checklist

- [ ] Deployment succeeds without errors
- [ ] `/` endpoint returns "TelexCodeBuddy is alive"
- [ ] `/a2a/agent/telex-codebuddy` accepts POST requests
- [ ] Environment variables loaded correctly
- [ ] Error handling works (test with empty body)
- [ ] Response format matches A2A spec
- [ ] Telex agent logs show activity
- [ ] Monitoring/alerting configured
- [ ] Documentation updated with live URL
- [ ] Team notified of deployment

---

## Support

- **Vercel Support**: https://vercel.com/support
- **Railway Support**: https://railway.app/support
- **Render Support**: https://render.com/support
- **Telex Support**: https://telex.im/support

---

**Last Updated**: November 4, 2025
