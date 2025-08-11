import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import get_db, Base

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_vendors.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture
def authenticated_user():
    """Create and login a test user"""
    user_data = {
        "email": "vendor@example.com",
        "password": "vendorpassword123",
        "full_name": "Test Vendor",
        "phone": "+1234567890"
    }
    
    # Register user
    client.post("/api/auth/register", json=user_data)
    
    # Login to get token
    login_data = {
        "username": user_data["email"],
        "password": user_data["password"]
    }
    response = client.post("/api/auth/token", data=login_data)
    token = response.json()["access_token"]
    
    return {
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"}
    }

@pytest.fixture
def sample_application():
    return {
        "business_name": "Test Business Inc",
        "business_type": "Private Limited Company",
        "registration_number": "REG123456",
        "tax_id": "TAX789012",
        "address": "123 Business Street, Suite 100",
        "city": "Mumbai",
        "state": "Maharashtra",
        "postal_code": "400001",
        "country": "India",
        "bank_name": "Test Bank",
        "account_number": "1234567890",
        "routing_number": "TESTBANK001"
    }

def test_create_application(authenticated_user, sample_application):
    """Test creating a vendor application"""
    response = client.post(
        "/api/vendors/applications",
        json=sample_application,
        headers=authenticated_user["headers"]
    )
    assert response.status_code == 200
    data = response.json()
    assert data["business_name"] == sample_application["business_name"]
    assert data["status"] == "pending"
    assert "application_id" in data
    assert data["application_id"].startswith("VND")

def test_create_application_unauthorized():
    """Test creating application without authentication"""
    sample_app = {
        "business_name": "Test Business",
        "business_type": "Sole Proprietorship",
        "address": "123 Test St",
        "city": "Test City",
        "state": "Test State",
        "postal_code": "12345",
        "country": "India"
    }
    response = client.post("/api/vendors/applications", json=sample_app)
    assert response.status_code == 401

def test_get_applications(authenticated_user, sample_application):
    """Test retrieving user applications"""
    # Create an application first
    client.post(
        "/api/vendors/applications",
        json=sample_application,
        headers=authenticated_user["headers"]
    )
    
    # Get applications
    response = client.get(
        "/api/vendors/applications",
        headers=authenticated_user["headers"]
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["business_name"] == sample_application["business_name"]

def test_get_application_by_id(authenticated_user, sample_application):
    """Test retrieving specific application"""
    # Create an application
    create_response = client.post(
        "/api/vendors/applications",
        json=sample_application,
        headers=authenticated_user["headers"]
    )
    application_id = create_response.json()["application_id"]
    
    # Get specific application
    response = client.get(
        f"/api/vendors/applications/{application_id}",
        headers=authenticated_user["headers"]
    )
    assert response.status_code == 200
    data = response.json()
    assert data["application_id"] == application_id
    assert data["business_name"] == sample_application["business_name"]

def test_create_duplicate_pending_application(authenticated_user, sample_application):
    """Test that user cannot create multiple pending applications"""
    # Create first application
    client.post(
        "/api/vendors/applications",
        json=sample_application,
        headers=authenticated_user["headers"]
    )
    
    # Try to create another application
    response = client.post(
        "/api/vendors/applications",
        json=sample_application,
        headers=authenticated_user["headers"]
    )
    assert response.status_code == 400
    assert "pending application" in response.json()["detail"]

def test_create_application_missing_required_fields():
    """Test creating application with missing required fields"""
    # Register and login user
    user_data = {
        "email": "test2@example.com",
        "password": "testpassword123",
        "full_name": "Test User 2"
    }
    client.post("/api/auth/register", json=user_data)
    
    login_response = client.post("/api/auth/token", data={
        "username": user_data["email"],
        "password": user_data["password"]
    })
    headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}
    
    # Try to create application with missing fields
    incomplete_app = {
        "business_name": "Test Business"
        # Missing required fields
    }
    response = client.post(
        "/api/vendors/applications",
        json=incomplete_app,
        headers=headers
    )
    assert response.status_code == 422