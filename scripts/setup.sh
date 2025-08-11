#!/bin/bash

# Vendor Onboarding System Setup Script

set -e

echo "🚀 Setting up Vendor Onboarding System..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual configuration values!"
    echo "   Required: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, SECRET_KEY"
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/uploads
mkdir -p ssl
mkdir -p logs

# Set proper permissions
chmod 755 backend/uploads
chmod 755 ssl
chmod 755 logs

echo "🐳 Starting services with Docker Compose..."
docker-compose up -d postgres redis

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

echo "🔧 Running database migrations..."
docker-compose run --rm backend alembic upgrade head

echo "👤 Creating admin user (optional)..."
read -p "Do you want to create an admin user? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter admin email: " ADMIN_EMAIL
    read -s -p "Enter admin password: " ADMIN_PASSWORD
    echo
    
    docker-compose run --rm backend python -c "
from database import SessionLocal
from models import User, UserRole
from utils.security import get_password_hash

db = SessionLocal()
admin_user = User(
    email='$ADMIN_EMAIL',
    hashed_password=get_password_hash('$ADMIN_PASSWORD'),
    full_name='System Administrator',
    role=UserRole.ADMIN
)
db.add(admin_user)
db.commit()
print('Admin user created successfully!')
db.close()
"
fi

echo "🚀 Starting all services..."
docker-compose up -d

echo "✅ Setup complete!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Documentation: http://localhost:8000/docs"
echo ""
echo "📊 Monitor services:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""
echo "⚠️  Don't forget to:"
echo "   1. Configure your .env file with actual values"
echo "   2. Set up SSL certificates for production"
echo "   3. Configure your domain in nginx.prod.conf"