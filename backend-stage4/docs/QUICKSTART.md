# Quick Start Guide

This guide will get you up and running with the Distributed Notification System in 5 minutes.

## Prerequisites

- Docker & Docker Compose installed
- Node.js 20.x installed
- Gmail account (for SMTP) or SendGrid API key
- Firebase project (for FCM push notifications) - Optional

## Step 1: Clone and Navigate

```bash
cd backend-stage4
```

## Step 2: Automated Setup

We provide a setup script that automates everything:

```bash
chmod +x setup.sh
./setup.sh
```

This script will:
1. Check prerequisites
2. Create .env file from template
3. Install Node.js dependencies
4. Start infrastructure (PostgreSQL, Redis, RabbitMQ)
5. Start all microservices
6. Verify health of all services

## Step 3: Configure SMTP (Gmail Example)

Edit `.env` file:

```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Notification System <noreply@notifications.com>
```

### How to get Gmail App Password:

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Generate a new app password for "Mail"
5. Copy the 16-character password to .env

## Step 4: Test the System

### 4.1 Register a User

```bash
curl -X POST http://localhost:3001/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "your-email@example.com",
    "password": "password123",
    "preferences": {
      "email": true,
      "push": true
    }
  }'
```

Save the `id` from the response.

### 4.2 Login

```bash
curl -X POST http://localhost:3001/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "password123"
  }'
```

Save the `token` from the response.

### 4.3 Create a Template

```bash
export TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3002/api/v1/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "welcome_email",
    "name": "Welcome Email",
    "type": "email",
    "subject": "Welcome {{name}}!",
    "content": "<h1>Hello {{name}}!</h1><p>Thank you for joining us.</p><p><a href=\"{{link}}\">Get Started</a></p>",
    "language": "en"
  }'
```

### 4.4 Send a Notification

```bash
export USER_ID="user-id-from-step-4.1"

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
    "priority": 3
  }'
```

Save the `request_id` from the response.

### 4.5 Check Notification Status

```bash
export REQUEST_ID="request-id-from-step-4.4"

curl -X GET http://localhost:3000/api/v1/notifications/status/$REQUEST_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Step 5: Monitor the System

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f email-service

# Last 50 lines
docker-compose logs --tail=50 api-gateway
```

### RabbitMQ Management UI

Open browser: http://localhost:15672
- Username: `admin`
- Password: `admin`

You can see:
- Queue depths
- Message rates
- Consumer status
- Failed messages in DLQ

### Check Service Health

```bash
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # Template Service
curl http://localhost:3003/health  # Email Service
curl http://localhost:3004/health  # Push Service
```

## Common Issues & Solutions

### Issue: "Connection refused" errors

**Solution:** Wait longer for services to start. Check status:
```bash
docker-compose ps
```

All services should show "healthy" status.

### Issue: Email not sending

**Causes:**
1. Invalid SMTP credentials in .env
2. Gmail blocking the app password
3. 2-Step Verification not enabled

**Solution:**
1. Verify credentials in .env
2. Check Gmail security settings
3. Enable "Less secure app access" (if needed)
4. Check email service logs:
   ```bash
   docker-compose logs email-service
   ```

### Issue: "Template not found" error

**Solution:** Make sure you created the template first (Step 4.3)

### Issue: Services not starting

**Solution:**
```bash
# Clean restart
docker-compose down -v
docker-compose up -d

# Check for port conflicts
lsof -i :3000
lsof -i :5432
```

## Development Mode

If you want to run services locally (not in Docker):

### 1. Start infrastructure only

```bash
docker-compose up -d postgres-user postgres-template redis rabbitmq
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run services in separate terminals

```bash
# Terminal 1
npm run dev:user

# Terminal 2
npm run dev:template

# Terminal 3
npm run dev:email

# Terminal 4
npm run dev:push

# Terminal 5
npm run dev:gateway
```

## Performance Testing

### Load Test with Apache Bench

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API Gateway health endpoint
ab -n 1000 -c 10 http://localhost:3000/health

# Test with authentication (save token to file first)
ab -n 100 -c 5 -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/users
```

### Monitor Queue Performance

```bash
# Check queue statistics
docker exec rabbitmq rabbitmqctl list_queues name messages consumers

# Expected output:
# email.queue    0    1
# push.queue     0    1
# failed.queue   0    0
```

## Scaling

### Scale Email Service

```bash
# Scale to 3 instances
docker-compose up -d --scale email-service=3

# Verify
docker-compose ps email-service
```

RabbitMQ will automatically distribute messages across all instances.

### Scale Any Service

```bash
docker-compose up -d --scale api-gateway=3
docker-compose up -d --scale user-service=2
docker-compose up -d --scale push-service=2
```

## Stopping the System

### Stop all services

```bash
docker-compose down
```

### Stop and remove volumes (WARNING: deletes all data)

```bash
docker-compose down -v
```

### Stop specific service

```bash
docker-compose stop email-service
```

## Next Steps

1. **Read the full documentation:**
   - [README.md](../README.md) - Complete overview
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System design
   - [API_TESTING.md](API_TESTING.md) - Comprehensive API tests
   - [TEMPLATES.md](TEMPLATES.md) - Sample templates

2. **Implement additional templates:**
   - Password reset
   - Order confirmation
   - Shipping updates
   - Account verification

3. **Set up monitoring:**
   - Prometheus for metrics
   - Grafana for dashboards
   - ELK stack for log aggregation

4. **Deploy to production:**
   - Set up CI/CD pipeline
   - Configure production environment variables
   - Use managed services (RDS, ElastiCache, Amazon MQ)
   - Set up load balancer
   - Configure SSL/TLS

## Useful Commands

```bash
# View all containers
docker-compose ps

# Restart a service
docker-compose restart email-service

# View service logs in real-time
docker-compose logs -f --tail=100 email-service

# Execute command in container
docker-compose exec api-gateway sh

# Check Redis cache
docker exec -it redis redis-cli
> KEYS *
> GET "user:123"

# Check PostgreSQL
docker exec -it postgres-user psql -U postgres -d user_service
\dt
SELECT * FROM users;

# Remove all stopped containers
docker-compose rm

# Rebuild services
docker-compose build --no-cache
docker-compose up -d
```

## Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Ensure all ports are available (3000-3004, 5432-5433, 6379, 5672, 15672)
4. Check Docker resources (RAM, Disk space)
5. Review [API_TESTING.md](API_TESTING.md) for examples

## Congratulations! 🎉

You now have a fully functional distributed notification system running locally. 

The system can:
- ✅ Handle 1000+ notifications per minute
- ✅ Send emails via SMTP
- ✅ Send push notifications via FCM
- ✅ Retry failed messages automatically
- ✅ Track notification status
- ✅ Scale horizontally
- ✅ Handle service failures gracefully

Start building your notification workflows!
