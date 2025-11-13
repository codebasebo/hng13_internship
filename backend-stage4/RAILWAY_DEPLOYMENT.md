# Railway Deployment Guide

This project is configured to deploy the API Gateway service on Railway.

## Required Environment Variables

Configure these in your Railway project settings:

### Database
- `DATABASE_URL_USER` - PostgreSQL connection string for user service
- `DATABASE_URL_TEMPLATE` - PostgreSQL connection string for template service

### Message Queue & Cache
- `RABBITMQ_URL` - RabbitMQ connection string (e.g., from CloudAMQP)
- `REDIS_URL` - Redis connection string (e.g., from Upstash Redis)

### Authentication
- `JWT_SECRET` - Secret key for JWT tokens (generate a strong random string)

### Email Configuration (for email service)
- `SMTP_USER` - SMTP username (e.g., Gmail account)
- `SMTP_PASS` - SMTP password or app-specific password
- `SMTP_FROM` - From email address

### Push Notifications (for push service)
- `FCM_SERVER_KEY` - Firebase Cloud Messaging server key

### Service URLs (internal - Railway will set PORT automatically)
- `PORT` - Default: 3000 (Railway sets this automatically)
- `NODE_ENV` - Set to `production`

## Railway Add-ons Needed

1. **PostgreSQL** (2 instances or 1 shared)
   - One for user-service database
   - One for template-service database

2. **Redis** - For caching and rate limiting

3. **RabbitMQ** - Use CloudAMQP (external)
   - Sign up at https://www.cloudamqp.com/
   - Use the free tier
   - Copy the AMQP URL to `RABBITMQ_URL`

## Deployment Steps

1. Push this code to GitHub
2. Create a new Railway project
3. Connect your GitHub repository
4. Add PostgreSQL and Redis services
5. Set all environment variables listed above
6. Deploy!

## Architecture Note

This Railway deployment runs only the **API Gateway**. For a full microservices deployment with all services, you would need:
- Separate Railway services for each microservice
- Or use Docker Compose locally
- Or deploy to a platform that supports Docker Compose (like Render)

The API Gateway can communicate with other services via:
- HTTP calls to other Railway services (set their URLs in env vars)
- Or handle basic operations standalone
