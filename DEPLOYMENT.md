# Deployment Guide

This guide covers deploying the Vendor Onboarding System to production environments.

## 🚀 Quick Deploy

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd vendor-onboarding

# Configure environment
cp .env.example .env
# Edit .env with your production values

# Run deployment script
./scripts/deploy.sh production
```

## 🔧 Manual Deployment

### Prerequisites

- Docker & Docker Compose
- Domain name configured
- SSL certificates (optional but recommended)
- Email service (SMTP)
- SMS service (Twilio)
- Payment gateway (Razorpay)

### Step 1: Environment Configuration

Create and configure `.env` file:

```env
# Database
DATABASE_URL=postgresql://postgres:secure_password@postgres:5432/vendor_db

# Security
SECRET_KEY=your-super-secret-key-at-least-32-characters

# Razorpay
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
S3_BUCKET=your-bucket-name
```

### Step 2: SSL Configuration (Production)

Place SSL certificates in `./ssl/` directory:
- `cert.pem` - SSL certificate
- `key.pem` - Private key

### Step 3: Domain Configuration

Update `nginx.prod.conf` with your domain:

```nginx
server_name your-domain.com www.your-domain.com;
```

### Step 4: Deploy

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Check service health
docker-compose -f docker-compose.prod.yml ps
```

## ☁️ Cloud Platform Deployment

### AWS ECS/Fargate

1. **Push images to ECR**
```bash
# Build and tag images
docker build -t vendor-backend ./backend
docker build -t vendor-frontend ./frontend

# Tag for ECR
docker tag vendor-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/vendor-backend:latest
docker tag vendor-frontend:latest <account>.dkr.ecr.<region>.amazonaws.com/vendor-frontend:latest

# Push to ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker push <account>.dkr.ecr.<region>.amazonaws.com/vendor-backend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/vendor-frontend:latest
```

2. **Create ECS Task Definitions**
   - Use provided `aws/task-definition.json` templates
   - Configure environment variables
   - Set up service and load balancer

3. **Database Setup**
   - Use RDS PostgreSQL for managed database
   - Configure security groups and VPC
   - Run migrations using ECS Task

### Google Cloud Run

1. **Deploy Backend**
```bash
cd backend
gcloud run deploy vendor-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=<cloud-sql-url>
```

2. **Deploy Frontend**
```bash
cd frontend
gcloud run deploy vendor-frontend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars API_BASE_URL=<backend-url>
```

### DigitalOcean App Platform

1. **Create App Spec** (`do-app-spec.yaml`)
```yaml
name: vendor-onboarding
services:
  - name: backend
    source_dir: backend
    github:
      repo: your-repo
      branch: main
    run_command: uvicorn main:app --host 0.0.0.0 --port 8000
    environment_slug: python
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
  
  - name: frontend
    source_dir: frontend
    github:
      repo: your-repo
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs

databases:
  - name: db
    engine: PG
    version: "13"
```

2. **Deploy**
```bash
doctl apps create --spec do-app-spec.yaml
```

## 🔒 Security Checklist

- [ ] Change default passwords
- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Regular security updates

## 📊 Monitoring & Logging

### Health Checks

The system provides health endpoints:
- Backend: `GET /health`
- Frontend: Default Next.js health check

### Logging

Logs are available via Docker:
```bash
# View all logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Monitoring Stack (Optional)

Deploy monitoring with Prometheus and Grafana:

```yaml
# Add to docker-compose.prod.yml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana
    ports:
      - "3001:3000"
```

## 🔧 Database Management

### Migrations

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"
```

### Backups

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres vendor_db > backup.sql

# Restore backup
docker-compose exec -i postgres psql -U postgres vendor_db < backup.sql
```

### Database Scaling

For high traffic:
- Use read replicas
- Configure connection pooling
- Consider database sharding for very high scale

## 🚀 Performance Optimization

### Backend Optimization
- Enable Gunicorn with multiple workers
- Use Redis for caching
- Configure database indexes
- Enable database query optimization

### Frontend Optimization
- Enable CDN for static assets
- Configure Next.js optimization
- Use image optimization
- Enable compression

### Infrastructure
- Use load balancer for multiple instances
- Configure auto-scaling
- Use CDN for global distribution
- Enable monitoring and alerting

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build and deploy
        run: |
          docker-compose -f docker-compose.prod.yml build
          docker-compose -f docker-compose.prod.yml up -d
```

## 🛠 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify database is running
   - Check network connectivity

2. **Payment Gateway Errors**
   - Verify Razorpay credentials
   - Check API key permissions
   - Review webhook configuration

3. **Email/SMS Not Sending**
   - Verify SMTP/Twilio credentials
   - Check network access
   - Review rate limits

4. **File Upload Issues**
   - Check file permissions
   - Verify AWS S3 configuration
   - Review file size limits

### Logs Analysis

```bash
# Check specific service status
docker-compose ps

# View recent logs
docker-compose logs --tail=100 backend

# Follow logs in real-time
docker-compose logs -f backend frontend
```

### Database Debugging

```bash
# Connect to database
docker-compose exec postgres psql -U postgres vendor_db

# Check tables
\dt

# View recent applications
SELECT * FROM vendor_applications ORDER BY submitted_at DESC LIMIT 10;
```

## 📞 Support

For deployment support:
- Check logs first
- Review environment variables
- Verify network connectivity
- Test health endpoints

Need help? Create an issue with:
- Error logs
- Environment details
- Steps to reproduce