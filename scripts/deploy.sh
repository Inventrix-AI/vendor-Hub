#!/bin/bash

# Production Deployment Script

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Deploying Vendor Onboarding System to $ENVIRONMENT..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one from .env.example"
    exit 1
fi

# Source environment variables
source .env

# Validate required environment variables
required_vars=(
    "SECRET_KEY"
    "DATABASE_URL"
    "RAZORPAY_KEY_ID"
    "RAZORPAY_KEY_SECRET"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Build and deploy
if [ "$ENVIRONMENT" == "production" ]; then
    echo "🔧 Building production images..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    echo "🔄 Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down
    
    echo "🗄️  Running database migrations..."
    docker-compose -f docker-compose.prod.yml run --rm backend alembic upgrade head
    
    echo "🚀 Starting production services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    echo "⏳ Waiting for services to be ready..."
    sleep 30
    
    echo "🔍 Checking service health..."
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy"
    else
        echo "❌ Backend health check failed"
        docker-compose -f docker-compose.prod.yml logs backend
        exit 1
    fi
    
    if curl -f http://localhost > /dev/null 2>&1; then
        echo "✅ Frontend is accessible"
    else
        echo "❌ Frontend is not accessible"
        docker-compose -f docker-compose.prod.yml logs frontend
        exit 1
    fi
    
else
    echo "🔧 Building development images..."
    docker-compose build
    
    echo "🔄 Starting development services..."
    docker-compose up -d
fi

echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "📝 Useful Commands:"
echo "   View logs: docker-compose logs -f"
echo "   Scale services: docker-compose up -d --scale backend=2"
echo "   Update services: docker-compose pull && docker-compose up -d"
echo "   Backup database: docker-compose exec postgres pg_dump -U postgres vendor_db > backup.sql"