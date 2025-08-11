from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Enum, ForeignKey, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    VENDOR = "vendor"
    ADMIN = "admin"
    REVIEWER = "reviewer"

class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    PAYMENT_PENDING = "payment_pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String)
    role = Column(Enum(UserRole), default=UserRole.VENDOR)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    vendor_applications = relationship("VendorApplication", back_populates="user")

class VendorApplication(Base):
    __tablename__ = "vendor_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Business Information
    business_name = Column(String, nullable=False)
    business_type = Column(String, nullable=False)
    registration_number = Column(String)
    tax_id = Column(String)
    
    # Contact Information
    address = Column(Text, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    postal_code = Column(String, nullable=False)
    country = Column(String, nullable=False)
    
    # Banking Information
    bank_name = Column(String)
    account_number = Column(String)
    routing_number = Column(String)
    
    # Application Status
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING)
    vendor_id = Column(String, unique=True)  # Generated on approval
    
    # Timestamps
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime)
    approved_at = Column(DateTime)
    
    # Relations
    user = relationship("User", back_populates="vendor_applications")
    documents = relationship("Document", back_populates="application")
    payments = relationship("Payment", back_populates="application")
    audit_logs = relationship("AuditLog", back_populates="application")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("vendor_applications.id"))
    document_type = Column(String, nullable=False)  # id_proof, address_proof, business_license
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    application = relationship("VendorApplication", back_populates="documents")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("vendor_applications.id"))
    razorpay_order_id = Column(String, unique=True)
    razorpay_payment_id = Column(String)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="INR")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    application = relationship("VendorApplication", back_populates="payments")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("vendor_applications.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False)
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    application = relationship("VendorApplication", back_populates="audit_logs")
    user = relationship("User")

class NotificationTemplate(Base):
    __tablename__ = "notification_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    subject = Column(String, nullable=False)
    email_template = Column(Text)
    sms_template = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)