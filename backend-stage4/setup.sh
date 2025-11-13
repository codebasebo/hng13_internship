#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20.x first."
    exit 1
fi

print_status "Starting Distributed Notification System setup..."
echo ""

# Step 1: Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_success ".env file created. Please edit it with your credentials."
    echo ""
    print_warning "Important: Update these values in .env:"
    echo "  - SMTP_USER (your Gmail address)"
    echo "  - SMTP_PASS (your Gmail app password)"
    echo "  - FCM_SERVER_KEY (your Firebase Cloud Messaging key)"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

# Step 2: Install dependencies
print_status "Installing Node.js dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi
echo ""

# Step 3: Create logs directory
print_status "Creating logs directory..."
mkdir -p logs
print_success "Logs directory created"
echo ""

# Step 4: Stop any existing containers
print_status "Stopping any existing containers..."
docker-compose down -v
echo ""

# Step 5: Start infrastructure services
print_status "Starting infrastructure services (PostgreSQL, Redis, RabbitMQ)..."
docker-compose up -d postgres-user postgres-template redis rabbitmq

# Wait for services to be healthy
print_status "Waiting for services to be healthy (this may take 30-60 seconds)..."
sleep 10

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    POSTGRES_USER_HEALTH=$(docker-compose ps postgres-user | grep "healthy" | wc -l)
    POSTGRES_TEMPLATE_HEALTH=$(docker-compose ps postgres-template | grep "healthy" | wc -l)
    REDIS_HEALTH=$(docker-compose ps redis | grep "healthy" | wc -l)
    RABBITMQ_HEALTH=$(docker-compose ps rabbitmq | grep "healthy" | wc -l)
    
    if [ $POSTGRES_USER_HEALTH -eq 1 ] && [ $POSTGRES_TEMPLATE_HEALTH -eq 1 ] && [ $REDIS_HEALTH -eq 1 ] && [ $RABBITMQ_HEALTH -eq 1 ]; then
        print_success "All infrastructure services are healthy!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Infrastructure services did not become healthy in time"
    docker-compose ps
    exit 1
fi
echo ""

# Step 6: Start application services
print_status "Starting application services..."
docker-compose up -d user-service template-service email-service push-service api-gateway

sleep 5
echo ""

# Step 7: Check service status
print_status "Checking service status..."
docker-compose ps
echo ""

# Step 8: Wait for all services to be running
print_status "Waiting for application services to start..."
sleep 10

# Check health endpoints
print_status "Checking health endpoints..."
echo ""

check_health() {
    SERVICE=$1
    PORT=$2
    RESPONSE=$(curl -s http://localhost:$PORT/health 2>/dev/null)
    if [ $? -eq 0 ]; then
        print_success "$SERVICE is healthy (http://localhost:$PORT)"
    else
        print_warning "$SERVICE is not responding yet (http://localhost:$PORT)"
    fi
}

check_health "API Gateway" 3000
check_health "User Service" 3001
check_health "Template Service" 3002
check_health "Email Service" 3003
check_health "Push Service" 3004

echo ""

# Step 9: Display service URLs
print_success "===== Setup Complete! ====="
echo ""
echo "Service URLs:"
echo "  - API Gateway:        http://localhost:3000"
echo "  - User Service:       http://localhost:3001"
echo "  - Template Service:   http://localhost:3002"
echo "  - Email Service:      http://localhost:3003"
echo "  - Push Service:       http://localhost:3004"
echo "  - RabbitMQ UI:        http://localhost:15672 (admin/admin)"
echo ""

echo "Quick Start Commands:"
echo "  1. Register a user:"
echo "     curl -X POST http://localhost:3001/api/v1/users \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"password123\",\"preferences\":{\"email\":true,\"push\":true}}'"
echo ""
echo "  2. Login to get token:"
echo "     curl -X POST http://localhost:3001/api/v1/users/login \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"email\":\"john@example.com\",\"password\":\"password123\"}'"
echo ""
echo "  3. View logs:"
echo "     docker-compose logs -f"
echo ""
echo "  4. Stop all services:"
echo "     docker-compose down"
echo ""

print_success "For complete testing guide, see docs/API_TESTING.md"
print_success "For architecture details, see docs/ARCHITECTURE.md"
echo ""
