# API Documentation

Complete API reference for the Vendor Onboarding & Verification System.

Base URL: `http://localhost:8000` (Development) | `https://your-domain.com` (Production)

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Get Access Token

**POST** `/api/auth/token`

```bash
curl -X POST "http://localhost:8000/api/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=userpassword"
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

## 👤 User Management

### Register User

**POST** `/api/auth/register`

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendor@example.com",
    "password": "securepassword123",
    "full_name": "John Doe",
    "phone": "+1234567890"
  }'
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "full_name": "string",
  "phone": "string" // optional
}
```

**Response:**
```json
{
  "id": 1,
  "email": "vendor@example.com",
  "full_name": "John Doe",
  "role": "vendor",
  "is_active": true
}
```

## 🏢 Vendor Operations

### Create Application

**POST** `/api/vendors/applications`

```bash
curl -X POST "http://localhost:8000/api/vendors/applications" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Acme Corporation",
    "business_type": "Private Limited Company",
    "registration_number": "REG123456",
    "tax_id": "GST789012",
    "address": "123 Business Street, Suite 100",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "country": "India",
    "bank_name": "HDFC Bank",
    "account_number": "1234567890",
    "routing_number": "HDFC0001234"
  }'
```

**Response:**
```json
{
  "id": 1,
  "application_id": "VND20241201ABCD1234",
  "business_name": "Acme Corporation",
  "status": "pending",
  "submitted_at": "2024-01-01T10:00:00Z",
  "vendor_id": null
}
```

### Get User Applications

**GET** `/api/vendors/applications`

```bash
curl -X GET "http://localhost:8000/api/vendors/applications" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
[
  {
    "id": 1,
    "application_id": "VND20241201ABCD1234",
    "business_name": "Acme Corporation",
    "status": "pending",
    "submitted_at": "2024-01-01T10:00:00Z",
    "vendor_id": null
  }
]
```

### Get Application Details

**GET** `/api/vendors/applications/{application_id}`

```bash
curl -X GET "http://localhost:8000/api/vendors/applications/VND20241201ABCD1234" \
  -H "Authorization: Bearer <token>"
```

### Upload Document

**POST** `/api/vendors/applications/{application_id}/documents`

```bash
curl -X POST "http://localhost:8000/api/vendors/applications/VND20241201ABCD1234/documents" \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "document_type=id_proof"
```

**Parameters:**
- `document_type`: `id_proof`, `address_proof`, `business_license`
- `file`: PDF, JPG, PNG (max 5MB)

**Response:**
```json
{
  "message": "Document uploaded successfully",
  "document_id": 1
}
```

## 💳 Payment Operations

### Create Payment Order

**POST** `/api/payments/create-order`

```bash
curl -X POST "http://localhost:8000/api/payments/create-order" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "application_id": "VND20241201ABCD1234",
    "amount": 1500.00
  }'
```

**Response:**
```json
{
  "razorpay_order_id": "order_12345678901234",
  "amount": 1500.00,
  "currency": "INR",
  "key": "rzp_test_1234567890"
}
```

### Verify Payment

**POST** `/api/payments/verify-payment`

```bash
curl -X POST "http://localhost:8000/api/payments/verify-payment" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_12345678901234",
    "razorpay_payment_id": "pay_12345678901234",
    "razorpay_signature": "signature_hash_here"
  }'
```

**Response:**
```json
{
  "message": "Payment verified successfully"
}
```

### Payment History

**GET** `/api/payments/history`

```bash
curl -X GET "http://localhost:8000/api/payments/history" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
[
  {
    "id": 1,
    "application_id": "VND20241201ABCD1234",
    "amount": 1500.00,
    "status": "success",
    "created_at": "2024-01-01T10:00:00Z",
    "razorpay_payment_id": "pay_12345678901234"
  }
]
```

## 🛡 Admin Operations

### List Applications

**GET** `/api/admin/applications`

```bash
curl -X GET "http://localhost:8000/api/admin/applications?status=under_review&search=Acme&skip=0&limit=10" \
  -H "Authorization: Bearer <admin-token>"
```

**Query Parameters:**
- `status`: Filter by application status
- `search`: Search by business name, application ID, or email
- `skip`: Pagination offset (default: 0)
- `limit`: Results per page (default: 100, max: 1000)

**Response:**
```json
[
  {
    "id": 1,
    "application_id": "VND20241201ABCD1234",
    "business_name": "Acme Corporation",
    "user_email": "vendor@example.com",
    "status": "under_review",
    "submitted_at": "2024-01-01T10:00:00Z",
    "reviewed_at": null
  }
]
```

### Get Application Details (Admin)

**GET** `/api/admin/applications/{application_id}`

```bash
curl -X GET "http://localhost:8000/api/admin/applications/VND20241201ABCD1234" \
  -H "Authorization: Bearer <admin-token>"
```

**Response:**
```json
{
  "id": 1,
  "application_id": "VND20241201ABCD1234",
  "business_name": "Acme Corporation",
  "business_type": "Private Limited Company",
  "registration_number": "REG123456",
  "tax_id": "GST789012",
  "address": "123 Business Street, Suite 100",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400001",
  "country": "India",
  "bank_name": "HDFC Bank",
  "account_number": "1234567890",
  "routing_number": "HDFC0001234",
  "status": "under_review",
  "submitted_at": "2024-01-01T10:00:00Z",
  "vendor_id": null,
  "user_email": "vendor@example.com",
  "user_phone": "+1234567890",
  "documents": [
    {
      "id": 1,
      "document_type": "id_proof",
      "filename": "passport.pdf",
      "file_path": "/uploads/documents/doc123.pdf",
      "uploaded_at": "2024-01-01T11:00:00Z"
    }
  ]
}
```

### Review Application

**PUT** `/api/admin/applications/{application_id}/review`

```bash
# Approve application
curl -X PUT "http://localhost:8000/api/admin/applications/VND20241201ABCD1234/review" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved"
  }'

# Reject application
curl -X PUT "http://localhost:8000/api/admin/applications/VND20241201ABCD1234/review" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "rejection_reason": "Incomplete documents provided"
  }'
```

**Request Body:**
```json
{
  "status": "approved" | "rejected",
  "rejection_reason": "string" // required for rejection
}
```

**Response:**
```json
{
  "message": "Application approved successfully"
}
```

### Dashboard Statistics

**GET** `/api/admin/dashboard/stats`

```bash
curl -X GET "http://localhost:8000/api/admin/dashboard/stats" \
  -H "Authorization: Bearer <admin-token>"
```

**Response:**
```json
{
  "total_applications": 150,
  "pending_applications": 23,
  "approved_applications": 98,
  "rejected_applications": 29
}
```

### Audit Logs

**GET** `/api/admin/audit-logs/{application_id}`

```bash
curl -X GET "http://localhost:8000/api/admin/audit-logs/VND20241201ABCD1234" \
  -H "Authorization: Bearer <admin-token>"
```

**Response:**
```json
[
  {
    "id": 1,
    "action": "Application submitted",
    "details": null,
    "user_email": "vendor@example.com",
    "timestamp": "2024-01-01T10:00:00Z"
  },
  {
    "id": 2,
    "action": "Application approved",
    "details": null,
    "user_email": "admin@example.com",
    "timestamp": "2024-01-02T14:30:00Z"
  }
]
```

## 📧 Notification Management

### Get Notification Templates

**GET** `/api/notifications/templates`

```bash
curl -X GET "http://localhost:8000/api/notifications/templates" \
  -H "Authorization: Bearer <admin-token>"
```

### Create Notification Template

**POST** `/api/notifications/templates`

```bash
curl -X POST "http://localhost:8000/api/notifications/templates" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "custom_notification",
    "subject": "Custom Notification Subject",
    "email_template": "Dear {business_name}, your application status is {status}.",
    "sms_template": "Application {application_id}: {status}"
  }'
```

### Update Notification Template

**PUT** `/api/notifications/templates/{template_id}`

## 🔍 Error Responses

All API endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid authentication credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Admin access required"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## 📊 Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **422** - Validation Error
- **500** - Internal Server Error

## 🚀 Rate Limits

Production environment rate limits:
- **Authentication endpoints**: 5 requests/minute
- **General API**: 60 requests/minute
- **File upload**: 10 requests/minute

Rate limit headers included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

## 📝 OpenAPI Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🧪 Testing

### Postman Collection

Import the Postman collection for easy API testing:
```bash
# Collection file available at
./docs/postman_collection.json
```

### cURL Examples

See complete cURL examples in the `./examples/` directory:
- `./examples/vendor_workflow.sh`
- `./examples/admin_operations.sh`
- `./examples/payment_flow.sh`