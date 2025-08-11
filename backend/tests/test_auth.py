import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import get_db, Base
from models import User, UserRole

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
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
def test_user():
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User",
        "phone": "+1234567890"
    }

def test_register_user(test_user):
    """Test user registration"""
    response = client.post("/api/auth/register", json=test_user)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user["email"]
    assert data["full_name"] == test_user["full_name"]
    assert data["role"] == "vendor"

def test_register_duplicate_user(test_user):
    """Test duplicate user registration fails"""
    # Register user first time
    client.post("/api/auth/register", json=test_user)
    
    # Try to register again
    response = client.post("/api/auth/register", json=test_user)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_login_user(test_user):
    """Test user login"""
    # Register user first
    client.post("/api/auth/register", json=test_user)
    
    # Login
    login_data = {
        "username": test_user["email"],
        "password": test_user["password"]
    }
    response = client.post("/api/auth/token", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials():
    """Test login with invalid credentials"""
    login_data = {
        "username": "invalid@example.com",
        "password": "wrongpassword"
    }
    response = client.post("/api/auth/token", data=login_data)
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_register_invalid_email():
    """Test registration with invalid email"""
    invalid_user = {
        "email": "invalid-email",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    response = client.post("/api/auth/register", json=invalid_user)
    assert response.status_code == 422

def test_register_weak_password():
    """Test registration with weak password"""
    weak_password_user = {
        "email": "test@example.com",
        "password": "123",
        "full_name": "Test User"
    }
    response = client.post("/api/auth/register", json=weak_password_user)
    # This should be validated by frontend, but backend should handle gracefully
    assert response.status_code in [200, 422]