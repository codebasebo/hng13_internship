# Distributed Notification System

A scalable microservices-based notification system that sends emails and push notifications using message queues for asynchronous communication.

## 🏗️ Architecture Overview

This system consists of 5 microservices:

1. **API Gateway** (Port 3000) - Entry point for all notification requests
2. **User Service** (Port 3001) - Manages user data and preferences
3. **Template Service** (Port 3002) - Stores and renders notification templates
4. **Email Service** (Port 3003) - Processes and sends email notifications
5. **Push Service** (Port 3004) - Processes and sends push notifications

### Infrastructure Components

- **PostgreSQL** - Database for User and Template services
- **Redis** - Caching and rate limiting
- **RabbitMQ** - Message queue for asynchronous communication

## 🚀 Features

- ✅ Microservices architecture with independent scaling
- ✅ Asynchronous message processing with RabbitMQ
- ✅ Circuit breaker pattern for fault tolerance
- ✅ Retry mechanism with exponential backoff
- ✅ Dead letter queue for failed messages
- ✅ Idempotency to prevent duplicate notifications
- ✅ User preference management
- ✅ Template versioning and multi-language support
- ✅ Health checks for all services
- ✅ Correlation IDs for request tracking
- ✅ Rate limiting and security headers
- ✅ Docker containerization
- ✅ CI/CD pipeline with GitHub Actions

## 📋 Prerequisites

- Node.js 20.x or higher
- Docker and Docker Compose
- PostgreSQL 16
- Redis 7
- RabbitMQ 3

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd backend-stage4
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# SMTP Configuration
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Notification System <noreply@notifications.com>

# FCM Configuration
FCM_SERVER_KEY=your-fcm-server-key

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 4. Start infrastructure services

```bash
docker-compose up -d postgres-user postgres-template redis rabbitmq
```

Wait for services to be healthy:

```bash
docker-compose ps
```

### 5. Run database migrations

The services will automatically sync database schemas on startup in development mode.

## 🏃 Running the Application

### Development Mode

Run all services in separate terminals:

```bash
# Terminal 1 - API Gateway
npm run dev:gateway

# Terminal 2 - User Service
npm run dev:user

# Terminal 3 - Template Service
npm run dev:template

# Terminal 4 - Email Service
npm run dev:email

# Terminal 5 - Push Service
npm run dev:push
```

### Production Mode with Docker

```bash
docker-compose up -d
```

Check all services are running:

```bash
docker-compose ps
```

View logs:

```bash
docker-compose logs -f
```

## 📖 API Documentation

### Base URL

```
http://localhost:3000
```

### Authentication

Most endpoints require a JWT token. Include it in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### 1. User Management

**Register User**
```http
POST /api/v1/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "preferences": {
    "email": true,
    "push": true
  },
  "push_token": "optional-fcm-token"
}
```

**Login**
```http
POST /api/v1/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Get User**
```http
GET /api/v1/users/:id
Authorization: Bearer <token>
```

**Update User**
```http
PUT /api/v1/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "preferences": {
    "email": false,
    "push": true
  }
}
```

#### 2. Template Management

**Create Template**
```http
POST /api/v1/templates
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "welcome_email",
  "name": "Welcome Email",
  "type": "email",
  "subject": "Welcome {{name}}!",
  "content": "<h1>Hello {{name}}</h1><p>Welcome to our platform!</p>",
  "language": "en"
}
```

**Get Template**
```http
GET /api/v1/templates/code/:code?language=en
```

**Render Template**
```http
POST /api/v1/templates/render/:code
Content-Type: application/json

{
  "variables": {
    "name": "John Doe",
    "link": "https://example.com"
  }
}
```

**List Templates**
```http
GET /api/v1/templates?page=1&limit=10&type=email
Authorization: Bearer <token>
```

#### 3. Send Notifications

**Send Notification**
```http
POST /api/v1/notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "notification_type": "email",
  "user_id": "user-uuid-here",
  "template_code": "welcome_email",
  "variables": {
    "name": "John Doe",
    "link": "https://example.com"
  },
  "priority": 3,
  "metadata": {
    "campaign": "onboarding"
  }
}
```

**Get Notification Status**
```http
GET /api/v1/notifications/status/:request_id
Authorization: Bearer <token>
```

### Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "meta": {
    "total": 100,
    "limit": 10,
    "page": 1,
    "total_pages": 10,
    "has_next": true,
    "has_previous": false
  }
}
```

Error response:

```json
{
  "success": false,
  "error": "ErrorType",
  "message": "Error description"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | Service-specific |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `RABBITMQ_URL` | RabbitMQ connection string | `amqp://admin:admin@localhost:5672` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRY` | JWT expiration time | `24h` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASS` | SMTP password | - |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging key | - |

## 🧪 Testing

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## 📊 Monitoring

### Health Checks

Each service exposes a `/health` endpoint:

```bash
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # Template Service
curl http://localhost:3003/health  # Email Service
curl http://localhost:3004/health  # Push Service
```

### RabbitMQ Management UI

Access at `http://localhost:15672`
- Username: `admin`
- Password: `admin`

### Logs

View logs for all services:

```bash
docker-compose logs -f
```

View logs for a specific service:

```bash
docker-compose logs -f api-gateway
```

## 🔐 Security Features

- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes)
- JWT authentication
- Input validation with express-validator
- CORS configuration
- Password hashing with bcrypt

## 🚀 Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

### CI/CD Pipeline

The project includes a GitHub Actions workflow that:

1. Runs tests
2. Builds TypeScript
3. Creates Docker images
4. Pushes to Docker Hub
5. Deploys to server

Configure these secrets in GitHub:

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `SERVER_HOST`
- `SERVER_USER`
- `SSH_PRIVATE_KEY`

## 📈 Performance Targets

- ✅ Handle 1,000+ notifications per minute
- ✅ API Gateway response under 100ms
- ✅ 99.5% delivery success rate
- ✅ Horizontal scaling support

## 🏛️ System Design

### Message Queue Structure

```
Exchange: notifications.direct
├── email.queue  → Email Service
├── push.queue   → Push Service
└── failed.queue → Dead Letter Queue
```

### Service Communication

- **Synchronous (REST)**: User preferences, template retrieval, status queries
- **Asynchronous (Message Queue)**: Notification processing, retry handling

### Failure Handling

1. **Circuit Breaker**: Prevents cascading failures (5 failures trigger open state)
2. **Retry Logic**: Exponential backoff (max 3 retries)
3. **Dead Letter Queue**: Permanently failed messages
4. **Idempotency**: Request IDs prevent duplicate processing

## 🛠️ Tech Stack

- **Runtime**: Node.js 20 with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Cache**: Redis with ioredis
- **Message Queue**: RabbitMQ with amqplib
- **Email**: Nodemailer
- **Push Notifications**: Firebase Cloud Messaging
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

## 📝 License

This project is licensed under the ISC License.

## 👥 Team

HNG13 Internship - Stage 4 Backend Task

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues or questions, please create an issue in the repository.
