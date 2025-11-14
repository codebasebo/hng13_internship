# System Design Diagram
# Distributed Notification System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATIONS                                     │
│                    (Web, Mobile, API Consumers)                                  │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │
                                   │ HTTPS/REST
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY SERVICE                                      │
│                              (Port 3000)                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Authentication & Authorization (JWT)                                  │   │
│  │  • Request Validation                                                    │   │
│  │  • Rate Limiting (100 req/15min per IP)                                 │   │
│  │  • Correlation ID Generation                                            │   │
│  │  • Circuit Breaker Pattern                                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└────────┬─────────────────┬────────────────────────────────────┬────────────────┘
         │                 │                                     │
         │ REST            │ REST                                │ Message Queue
         ▼                 ▼                                     ▼
┌─────────────────┐ ┌──────────────────┐            ┌──────────────────────────┐
│  USER SERVICE   │ │ TEMPLATE SERVICE │            │   RABBITMQ BROKER        │
│   (Port 3001)   │ │   (Port 3002)    │            │  (Port 5672, 15672)      │
├─────────────────┤ ├──────────────────┤            ├──────────────────────────┤
│ • User CRUD     │ │ • Template CRUD  │            │  Exchange:               │
│ • Preferences   │ │ • Variable Sub   │            │  notifications.direct    │
│ • JWT Auth      │ │ • Multi-language │            │                          │
│ • Login/Logout  │ │ • Versioning     │            │  ┌────────────────────┐  │
└────────┬────────┘ └────────┬─────────┘            │  │  email.queue       │  │
         │                   │                       │  │  ↓ Email Service   │  │
         │                   │                       │  ├────────────────────┤  │
         ▼                   ▼                       │  │  push.queue        │  │
┌─────────────────────────────────────┐            │  │  ↓ Push Service    │  │
│       POSTGRESQL DATABASES           │            │  ├────────────────────┤  │
├─────────────────┬───────────────────┤            │  │  failed.queue      │  │
│ User DB         │  Template DB       │            │  │  (Dead Letter)     │  │
│ • users         │  • templates       │            │  └────────────────────┘  │
│ • preferences   │  • versions        │            └───────┬──────────┬───────┘
└─────────────────┴───────────────────┘                    │          │
                                                            │          │
                                            ┌───────────────┘          └──────────────┐
                                            ▼                                         ▼
                                 ┌─────────────────────┐                  ┌─────────────────────┐
                                 │   EMAIL SERVICE     │                  │   PUSH SERVICE      │
                                 │    (Port 3003)      │                  │    (Port 3004)      │
                                 ├─────────────────────┤                  ├─────────────────────┤
                                 │ • Queue Consumer    │                  │ • Queue Consumer    │
                                 │ • Template Fetch    │                  │ • Template Fetch    │
                                 │ • Variable Render   │                  │ • Token Validation  │
                                 │ • SMTP Send         │                  │ • FCM Integration   │
                                 │ • Retry Logic       │                  │ • Retry Logic       │
                                 │ • Circuit Breaker   │                  │ • Circuit Breaker   │
                                 └──────────┬──────────┘                  └──────────┬──────────┘
                                            │                                         │
                                            ▼                                         ▼
                                 ┌─────────────────────┐                  ┌─────────────────────┐
                                 │  SMTP Providers     │                  │  FCM (Firebase)     │
                                 │  • Gmail            │                  │  • iOS Push         │
                                 │  • SendGrid         │                  │  • Android Push     │
                                 │  • Mailgun          │                  │  • Web Push         │
                                 └─────────────────────┘                  └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                      SHARED INFRASTRUCTURE                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌───────────────────────────┐      ┌─────────────────────────────┐           │
│  │      REDIS CACHE          │      │    MONITORING & LOGGING      │           │
│  │      (Port 6379)          │      │                              │           │
│  ├───────────────────────────┤      │  • Winston Logger            │           │
│  │ • Idempotency Keys        │      │  • Correlation IDs           │           │
│  │ • Rate Limit Counters     │      │  • Request Tracking          │           │
│  │ • User Preferences Cache  │      │  • Error Tracking            │           │
│  │ • Notification Status     │      │  • Performance Metrics       │           │
│  │ • Session Storage         │      └─────────────────────────────┘           │
│  └───────────────────────────┘                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Notification Send Flow

```
Client → API Gateway → Validate Request → Check Idempotency (Redis)
                     ↓
                Check User Preferences (User Service)
                     ↓
                Fetch Template (Template Service)
                     ↓
                Publish to Queue (RabbitMQ)
                     ↓
                Return 202 Accepted
                     ↓
        ┌────────────┴──────────────┐
        ▼                           ▼
  Email Service              Push Service
        ↓                           ↓
  Retry (if fail)            Retry (if fail)
        ↓                           ▼
  Update Status (Redis)      Update Status (Redis)
        ↓                           ↓
  Send Email via SMTP        Send Push via FCM
        ↓                           ↓
  Success/Failure            Success/Failure
```

### 2. Retry & Failure Handling Flow

```
Message → Service Consumer
              ↓
         Processing Failed?
              ↓
         ┌────Yes────┐
         ▼           ▼
   Retry Count < 3?  Dead Letter Queue
         ↓
     Yes │ No
         ↓  ↓
   Exponential   Move to
   Backoff       Failed Queue
   Wait          (Manual Review)
         ↓
   Retry
   Processing
```

### 3. Circuit Breaker Pattern

```
Request → Circuit Breaker Check
              ↓
         State = CLOSED?
              ↓
          ┌───Yes──┐
          ▼        ▼
     Try Request   State = OPEN?
          ↓            ↓
     Success?      Return Error
       ↓   ↓       (Fast Fail)
    Yes   No           ↓
     ↓     ↓      Timeout Elapsed?
  Return  Increment     ↓
  Success Failures   ┌─Yes─┐
              ↓      ▼     ▼
         Threshold   Try   State = HALF_OPEN
         Reached?  Request     ↓
              ↓        ↓    Success?
           Yes│No  Success?   ↓
              ↓        ↓    ┌Yes┐No
         State =   Reset    ↓   ↓
          OPEN    Counter  CLOSED OPEN
```

## Scaling Strategy

### Horizontal Scaling

```
                    Load Balancer
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   API Gateway 1    API Gateway 2    API Gateway 3
        │                │                │
        └────────────────┼────────────────┘
                         │
                    RabbitMQ (Clustered)
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
  Email Service 1  Email Service 2  Email Service 3
  Push Service 1   Push Service 2   Push Service 3
```

### Database Scaling

```
┌──────────────────────────────────────┐
│         PostgreSQL Primary            │
│         (Read/Write)                  │
└───────────┬──────────────────────────┘
            │
            │ Replication
            │
    ┌───────┴───────────┐
    ▼                   ▼
┌─────────┐         ┌─────────┐
│ Replica │         │ Replica │
│ (Read)  │         │ (Read)  │
└─────────┘         └─────────┘
```

## Security Architecture

```
┌──────────────────────────────────────────────┐
│            Security Layers                    │
├──────────────────────────────────────────────┤
│ 1. API Gateway                               │
│    • Rate Limiting (100 req/15min)          │
│    • JWT Authentication                      │
│    • Request Validation                      │
│    • CORS Configuration                      │
│    • Helmet Security Headers                 │
│                                              │
│ 2. Network Security                          │
│    • Internal service communication          │
│    • Firewall rules                          │
│    • HTTPS/TLS encryption                    │
│                                              │
│ 3. Data Security                             │
│    • Password hashing (bcrypt)               │
│    • Encrypted connections to DB             │
│    • Redis authentication                    │
│    • RabbitMQ credentials                    │
│                                              │
│ 4. Application Security                      │
│    • Input validation                        │
│    • SQL injection prevention (Sequelize)    │
│    • XSS protection                          │
│    • CSRF tokens (future)                    │
└──────────────────────────────────────────────┘
```

## Performance Characteristics

| Component | Latency Target | Throughput |
|-----------|---------------|------------|
| API Gateway | < 100ms | 1000+ req/min |
| User Service | < 50ms | High |
| Template Service | < 50ms | High |
| Email Service | Async | 500+ msg/min |
| Push Service | Async | 500+ msg/min |
| Redis | < 5ms | Very High |
| RabbitMQ | < 10ms | Very High |

## Deployment Architecture

```
┌──────────────────────────────────────────────┐
│            Railway Cloud Platform             │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────┐        │
│  │    API Gateway Container         │        │
│  │    • Node.js 20                  │        │
│  │    • Express.js                  │        │
│  │    • Port: 8080                  │        │
│  └─────────────────────────────────┘        │
│                                              │
│  ┌─────────────────────────────────┐        │
│  │    Redis Add-on                  │        │
│  │    • Version 7.x                 │        │
│  │    • Auto-connection             │        │
│  └─────────────────────────────────┘        │
│                                              │
│  ┌─────────────────────────────────┐        │
│  │    RabbitMQ (CloudAMQP)          │        │
│  │    • External provider           │        │
│  │    • Free tier                   │        │
│  └─────────────────────────────────┘        │
│                                              │
└──────────────────────────────────────────────┘
```

## Technology Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Databases**: PostgreSQL 16, Redis 7
- **Message Queue**: RabbitMQ 3.x
- **Container**: Docker
- **Deployment**: Railway
- **CI/CD**: GitHub Actions
- **Monitoring**: Winston Logger
