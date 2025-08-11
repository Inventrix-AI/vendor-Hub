# Vendor Onboarding & Verification System

A complete, production-ready vendor onboarding and verification system with secure document upload, payment processing, and real-time status tracking.

## 🚀 Features

### Vendor Features
- **User Registration & Authentication** - Secure JWT-based authentication
- **Application Management** - Complete business profile and document submission
- **Document Upload** - Secure, encrypted document storage with validation
- **Payment Integration** - Razorpay payment gateway with multiple payment methods
- **Real-time Tracking** - Track application status and receive notifications
- **Responsive Dashboard** - Mobile-friendly vendor portal

### Admin Features
- **Application Review** - Comprehensive review dashboard with document viewer
- **Side-by-side Comparison** - Compare uploaded documents efficiently
- **Status Management** - Approve/reject applications with feedback
- **Audit Logging** - Complete audit trail of all actions
- **Dashboard Analytics** - Real-time statistics and insights
- **Notification System** - Automated email/SMS notifications

### Technical Features
- **Production-Ready** - Docker containerization with production configs
- **Scalable Architecture** - FastAPI backend with Next.js frontend
- **Secure by Design** - Input validation, XSS/CSRF prevention, encryption
- **Payment Processing** - Complete Razorpay integration with verification
- **File Management** - AWS S3 integration with local fallback
- **Database Migrations** - Alembic for database schema management

## 🛠 Tech Stack

### Backend
- **FastAPI** - High-performance Python API framework
- **PostgreSQL** - Robust relational database with ACID compliance
- **SQLAlchemy** - Python SQL toolkit and ORM
- **Alembic** - Database migration tool
- **Razorpay** - Payment gateway integration
- **Twilio** - SMS notifications
- **AWS S3** - Secure file storage

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Data fetching and caching
- **React Hook Form** - Form validation and management

### DevOps & Deployment
- **Docker** - Containerization for consistent deployments
- **Docker Compose** - Multi-container application orchestration
- **Nginx** - Reverse proxy and load balancer
- **SSL/TLS** - HTTPS encryption for production

## 📦 Installation

### Prerequisites
- Docker and Docker Compose
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vendor-onboarding
   ```

2. **Run the setup script**
   ```bash
   ./scripts/setup.sh
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Manual Installation

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Configure your .env file
alembic upgrade head
uvicorn main:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Configure your .env.local file
npm run dev
```

## ⚙️ Configuration

### Required Environment Variables

#### Database
```env
DATABASE_URL=postgresql://postgres:password@localhost/vendor_db
```

#### Security
```env
SECRET_KEY=your-secret-key-minimum-32-characters
```

#### Payment Gateway
```env
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

#### Email Notifications
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### SMS Notifications
```env
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

#### File Storage (Optional - AWS S3)
```env
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET=your-bucket-name
```

## 🔄 Application Workflow

1. **Vendor Registration**
   - User creates account with email/password
   - Email verification (optional)

2. **Application Submission**
   - Complete business information form
   - Provide business details and address
   - Submit application (receives unique ID)

3. **Document Upload**
   - Upload ID proof (Aadhaar, Passport, License)
   - Upload address proof (Utility bill, Bank statement)
   - Upload business license/registration

4. **Payment Processing**
   - Razorpay payment gateway integration
   - Multiple payment methods (Cards, UPI, Net Banking)
   - Real-time payment status updates

5. **Admin Review**
   - Admin reviews application and documents
   - Side-by-side document comparison
   - Approve or reject with feedback

6. **Notification & Completion**
   - Automated email/SMS notifications
   - Unique vendor ID generation on approval
   - Access to vendor portal

## 🏗 Project Structure

```
vendor-onboarding/
├── backend/                    # FastAPI backend
│   ├── alembic/               # Database migrations
│   ├── routers/               # API routes
│   ├── services/              # Business logic
│   ├── utils/                 # Utilities
│   ├── models.py              # Database models
│   └── main.py                # Application entry point
├── frontend/                  # Next.js frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   ├── lib/               # Utilities and API
│   │   └── types/             # TypeScript types
├── scripts/                   # Deployment scripts
├── docker-compose.yml         # Development containers
├── docker-compose.prod.yml    # Production containers
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/token` - User login

### Vendor Operations
- `POST /api/vendors/applications` - Create application
- `GET /api/vendors/applications` - Get user applications
- `POST /api/vendors/applications/{id}/documents` - Upload documents

### Payment Operations
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify-payment` - Verify payment
- `GET /api/payments/history` - Payment history

### Admin Operations
- `GET /api/admin/applications` - List applications
- `GET /api/admin/applications/{id}` - Application details
- `PUT /api/admin/applications/{id}/review` - Review application
- `GET /api/admin/dashboard/stats` - Dashboard statistics

## 🚀 Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
# Configure production environment
cp .env.example .env
# Edit .env with production values

# Deploy with production configuration
./scripts/deploy.sh production
```

### Cloud Deployment Options

#### AWS
- **ECS/Fargate** - Container orchestration
- **RDS** - Managed PostgreSQL
- **S3** - File storage
- **CloudFront** - CDN
- **ALB** - Load balancer

#### Google Cloud
- **Cloud Run** - Serverless containers
- **Cloud SQL** - Managed PostgreSQL
- **Cloud Storage** - File storage
- **Cloud CDN** - Content delivery

#### DigitalOcean
- **App Platform** - Platform-as-a-Service
- **Managed Databases** - PostgreSQL
- **Spaces** - Object storage

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

### API Testing
Import the Postman collection from `docs/api-collection.json`

## 📊 Monitoring

### Health Checks
- Backend: `GET /health`
- Database: Built-in PostgreSQL health checks
- Frontend: Built-in Next.js health monitoring

### Logging
- Application logs: Docker container logs
- Access logs: Nginx access logs
- Error tracking: Built-in error handling

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt password hashing
- **Input Validation** - Comprehensive request validation
- **File Upload Security** - File type and size validation
- **Rate Limiting** - API rate limiting (production)
- **HTTPS Encryption** - SSL/TLS termination
- **CSRF Protection** - Cross-site request forgery protection
- **XSS Prevention** - Cross-site scripting protection

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support, please email [support@yourcompany.com](mailto:support@yourcompany.com) or create an issue in the repository.

## 📈 Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Webhook integration
- [ ] Mobile app (React Native)
- [ ] Advanced document OCR
- [ ] Integration with more payment gateways
- [ ] Advanced reporting features

---

**Built with ❤️ for seamless vendor onboarding**# VendorHub
# VendorHub
# VendorHub
# vendor-Hub
