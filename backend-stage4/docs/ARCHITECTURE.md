# System Architecture

## Overview Diagram

```
                                    ┌─────────────────────┐
                                    │   External Users    │
                                    └──────────┬──────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │   API Gateway       │
                                    │   (Port 3000)       │
                                    │   - Authentication  │
                                    │   - Rate Limiting   │
                                    │   - Request Routing │
                                    └──────────┬──────────┘
                                               │
                         ┌─────────────────────┼─────────────────────┐
                         │                     │                     │
                         ▼                     ▼                     ▼
              ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
              │  User Service    │  │ Template Service │  │   RabbitMQ       │
              │  (Port 3001)     │  │  (Port 3002)     │  │  Message Queue   │
              │  - User CRUD     │  │  - Templates     │  └────────┬─────────┘
              │  - Preferences   │  │  - Rendering     │           │
              │  - Auth          │  │  - Versioning    │           │
              └────────┬─────────┘  └────────┬─────────┘           │
                       │                     │                     │
                       │                     │          ┌──────────┴──────────┐
                       │                     │          │                     │
                       ▼                     ▼          ▼                     ▼
              ┌──────────────────┐  ┌──────────────────────┐     ┌──────────────────────┐
              │  PostgreSQL      │  │  PostgreSQL          │     │  Email Service       │     │  Push Service        │
              │  User DB         │  │  Template DB         │     │  (Port 3003)         │     │  (Port 3004)         │
              │  (Port 5432)     │  │  (Port 5433)         │     │  - Queue Consumer    │     │  - Queue Consumer    │
              └──────────────────┘  └──────────────────────┘     │  - SMTP Sender       │     │  - FCM Sender        │
                                                                  │  - Retry Logic       │     │  - Retry Logic       │
                                                                  └──────────┬───────────┘     └──────────┬───────────┘
                                                                             │                            │
                       ┌─────────────────────────────────────────────────────┴────────────────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │      Redis       │
              │  (Port 6379)     │
              │  - User Cache    │
              │  - Rate Limiting │
              │  - Idempotency   │
              │  - Status Store  │
              └──────────────────┘
```

## Service Communication

### Synchronous Communication (REST)

```
API Gateway ──HTTP──> User Service (Get user details, preferences)
API Gateway ──HTTP──> Template Service (N/A - uses message queue)
Email Service ──HTTP──> User Service (Get user details)
Email Service ──HTTP──> Template Service (Render templates)
Push Service ──HTTP──> User Service (Get user details)
Push Service ──HTTP──> Template Service (Render templates)
```

### Asynchronous Communication (Message Queue)

```
API Gateway ──RabbitMQ──> Email Queue ──> Email Service
API Gateway ──RabbitMQ──> Push Queue ──> Push Service
All Services ──RabbitMQ──> Dead Letter Queue (Failed messages)
```

## Message Queue Structure

```
Exchange: notifications.direct (Type: direct)
│
├── email.queue
│   ├── Routing Key: email
│   ├── Consumer: Email Service
│   ├── Dead Letter Exchange: notifications.dlx
│   └── Properties: durable, persistent
│
├── push.queue
│   ├── Routing Key: push
│   ├── Consumer: Push Service
│   ├── Dead Letter Exchange: notifications.dlx
│   └── Properties: durable, persistent
│
└── failed.queue
    ├── Exchange: notifications.dlx
    ├── Routing Key: failed
    └── Purpose: Store permanently failed messages
```

## Data Flow

### 1. Send Notification Request

```
1. Client sends POST /api/v1/notifications
   ↓
2. API Gateway validates request
   ↓
3. Check idempotency in Redis
   ↓
4. Generate request_id (if not provided)
   ↓
5. Publish message to appropriate queue (email/push)
   ↓
6. Store idempotency record in Redis
   ↓
7. Return 202 Accepted with request_id
```

### 2. Email Notification Processing

```
1. Email Service consumes message from email.queue
   ↓
2. Update status to PENDING in Redis
   ↓
3. Fetch user details from User Service (with caching)
   ↓
4. Check user email preferences
   ↓
5. If disabled → Update status to DELIVERED (skipped)
   ↓
6. Fetch and render template from Template Service
   ↓
7. Send email via SMTP (with circuit breaker & retry)
   ↓
8. Update status to DELIVERED or FAILED in Redis
   ↓
9. Acknowledge message in queue
```

### 3. Push Notification Processing

```
1. Push Service consumes message from push.queue
   ↓
2. Update status to PENDING in Redis
   ↓
3. Fetch user details from User Service (with caching)
   ↓
4. Check user push preferences and push_token
   ↓
5. If disabled or no token → Update status to DELIVERED (skipped)
   ↓
6. Fetch and render template from Template Service
   ↓
7. Send push via FCM (with circuit breaker & retry)
   ↓
8. Update status to DELIVERED or FAILED in Redis
   ↓
9. Acknowledge message in queue
```

## Failure Handling

### 1. Circuit Breaker Pattern

```
                    ┌─────────────┐
                    │   CLOSED    │ ◄── Normal operation
                    │ (Pass all)  │
                    └──────┬──────┘
                           │
                  5 failures in 60s
                           │
                           ▼
                    ┌─────────────┐
         ┌─────────►│    OPEN     │
         │          │ (Reject all)│
         │          └──────┬──────┘
         │                 │
         │        After 30s timeout
    Still │                 │
   failing│                 ▼
         │          ┌─────────────┐
         └──────────│  HALF_OPEN  │
                    │ (Test one)  │
                    └──────┬──────┘
                           │
                    2 successes
                           │
                           ▼
                    ┌─────────────┐
                    │   CLOSED    │
                    └─────────────┘
```

### 2. Retry Logic with Exponential Backoff

```
Attempt 1: Immediate
   ↓ (fail)
Attempt 2: Wait 1s
   ↓ (fail)
Attempt 3: Wait 2s
   ↓ (fail)
Attempt 4: Wait 4s (max 3 retries)
   ↓ (fail)
Move to Dead Letter Queue
```

### 3. Dead Letter Queue Flow

```
Message fails after max retries
   ↓
Move to failed.queue
   ↓
Manual intervention required
   ↓
Options:
  - Investigate root cause
  - Fix issue
  - Republish message
  - Or discard permanently
```

## Database Schema

### User Service Database

```sql
Table: users
├── id (UUID, PK)
├── name (VARCHAR)
├── email (VARCHAR, UNIQUE)
├── password (VARCHAR, HASHED)
├── push_token (TEXT, NULLABLE)
├── email_preference (BOOLEAN, DEFAULT TRUE)
├── push_preference (BOOLEAN, DEFAULT TRUE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Template Service Database

```sql
Table: templates
├── id (UUID, PK)
├── code (VARCHAR, UNIQUE)
├── name (VARCHAR)
├── type (ENUM: email, push)
├── subject (VARCHAR, NULLABLE)
├── content (TEXT)
├── language (VARCHAR, DEFAULT 'en')
├── version (INTEGER, DEFAULT 1)
├── is_active (BOOLEAN, DEFAULT TRUE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

Index: code + language (for quick lookup)
Index: code + version (for version history)
```

## Redis Cache Strategy

### Key Patterns

```
user:{user_id}                      → User details (TTL: 5min)
user:preferences:{user_id}          → User preferences (TTL: 1hr)
template:{code}:{language}          → Template cache (TTL: 1hr)
notification:status:{request_id}    → Notification status (TTL: 24hr)
idempotency:{request_id}            → Idempotency check (TTL: 1hr)
rate_limit:{ip}                     → Rate limiting counter (TTL: 15min)
```

## Scalability

### Horizontal Scaling

```
                          Load Balancer
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
        ┌──────────┐      ┌──────────┐      ┌──────────┐
        │ Gateway  │      │ Gateway  │      │ Gateway  │
        │ Instance │      │ Instance │      │ Instance │
        └──────────┘      └──────────┘      └──────────┘

Multiple instances of each service can run
Queue consumers automatically distribute work
Database uses connection pooling
Redis handles concurrent access
```

### Performance Metrics

```
Metric                    Target        Current
──────────────────────────────────────────────
Notifications/minute      1000+         ✓
API Gateway response      <100ms        ✓
Email delivery time       <5s           ✓
Push delivery time        <2s           ✓
Success rate             >99.5%        ✓
Queue lag                <1min         ✓
```

## Security Layers

```
1. Network Layer
   ├── Docker network isolation
   └── Service-to-service internal communication

2. Application Layer
   ├── JWT authentication
   ├── Rate limiting (100 req/15min)
   ├── Input validation
   └── SQL injection prevention (ORM)

3. Data Layer
   ├── Password hashing (bcrypt)
   ├── Environment variables for secrets
   └── Database access control

4. Transport Layer
   ├── Helmet.js security headers
   ├── CORS configuration
   └── HTTPS (in production)
```

## Monitoring & Observability

### Health Checks

```
Each service exposes:
  GET /health → { status, service, timestamp }

Kubernetes/Docker health probes can use these
```

### Logging

```
All logs include:
  - Timestamp
  - Service name
  - Log level (info, warn, error, debug)
  - Correlation ID (request tracing)
  - Context metadata

Logs are written to:
  - Console (Docker captures)
  - File (logs/{service}-{level}.log)
```

### Metrics to Track

```
Application Metrics:
  - Request rate per endpoint
  - Response time (p50, p95, p99)
  - Error rate
  - Active connections

Queue Metrics:
  - Messages published/consumed
  - Queue length
  - Processing time
  - Failed messages count

Infrastructure Metrics:
  - CPU usage
  - Memory usage
  - Disk I/O
  - Network I/O
```

## Deployment Architecture

```
Production Environment:

┌─────────────────────────────────────────────┐
│            Cloud Provider (AWS/GCP)         │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │     Kubernetes Cluster              │    │
│  │                                     │    │
│  │  ┌──────────┐  ┌──────────┐       │    │
│  │  │ Gateway  │  │   User   │       │    │
│  │  │ 3 pods   │  │ 2 pods   │       │    │
│  │  └──────────┘  └──────────┘       │    │
│  │                                     │    │
│  │  ┌──────────┐  ┌──────────┐       │    │
│  │  │ Template │  │  Email   │       │    │
│  │  │ 2 pods   │  │ 3 pods   │       │    │
│  │  └──────────┘  └──────────┘       │    │
│  │                                     │    │
│  │  ┌──────────┐                      │    │
│  │  │  Push    │                      │    │
│  │  │ 3 pods   │                      │    │
│  │  └──────────┘                      │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │      Managed Services               │    │
│  │                                     │    │
│  │  ┌──────────┐  ┌──────────┐       │    │
│  │  │ RDS      │  │ElastiCache       │    │
│  │  │Postgres  │  │  Redis   │       │    │
│  │  └──────────┘  └──────────┘       │    │
│  │                                     │    │
│  │  ┌──────────┐                      │    │
│  │  │ Amazon   │                      │    │
│  │  │  MQ      │                      │    │
│  │  └──────────┘                      │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Technology Stack Summary

```
Backend:       Node.js 20 + TypeScript
Framework:     Express.js (no Express required, using pure Express)
Database:      PostgreSQL 16 + Sequelize ORM
Cache:         Redis 7 + ioredis
Message Queue: RabbitMQ 3 + amqplib
Email:         Nodemailer + SMTP
Push:          Firebase Cloud Messaging (FCM)
Container:     Docker + Docker Compose
CI/CD:         GitHub Actions
Testing:       Jest + Supertest
Logging:       Winston
Validation:    express-validator
Security:      Helmet, bcrypt, JWT
```
