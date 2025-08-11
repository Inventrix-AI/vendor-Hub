from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from database import get_db
from models import User, VendorApplication, Document, ApplicationStatus, UserRole, AuditLog
from routers.auth import get_current_user
from services.notification_service import send_notification

router = APIRouter()

def admin_required(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.REVIEWER]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

class ApplicationReview(BaseModel):
    status: ApplicationStatus
    rejection_reason: str = None

class ApplicationListResponse(BaseModel):
    id: int
    application_id: str
    business_name: str
    user_email: str
    status: ApplicationStatus
    submitted_at: datetime
    reviewed_at: datetime = None
    
    class Config:
        from_attributes = True

class ApplicationDetailResponse(BaseModel):
    id: int
    application_id: str
    business_name: str
    business_type: str
    registration_number: str = None
    tax_id: str = None
    address: str
    city: str
    state: str
    postal_code: str
    country: str
    bank_name: str = None
    account_number: str = None
    routing_number: str = None
    status: ApplicationStatus
    submitted_at: datetime
    vendor_id: str = None
    user_email: str
    user_phone: str = None
    documents: List[dict] = []
    
    class Config:
        from_attributes = True

@router.get("/applications", response_model=List[ApplicationListResponse])
async def get_applications(
    status: Optional[ApplicationStatus] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    admin_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    query = db.query(VendorApplication).join(User)
    
    if status:
        query = query.filter(VendorApplication.status == status)
    
    if search:
        query = query.filter(
            or_(
                VendorApplication.business_name.ilike(f"%{search}%"),
                VendorApplication.application_id.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )
    
    applications = query.order_by(VendorApplication.submitted_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for app in applications:
        result.append({
            "id": app.id,
            "application_id": app.application_id,
            "business_name": app.business_name,
            "user_email": app.user.email,
            "status": app.status,
            "submitted_at": app.submitted_at,
            "reviewed_at": app.reviewed_at
        })
    
    return result

@router.get("/applications/{application_id}", response_model=ApplicationDetailResponse)
async def get_application_detail(
    application_id: str,
    admin_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    application = db.query(VendorApplication).filter(
        VendorApplication.application_id == application_id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    documents = [
        {
            "id": doc.id,
            "document_type": doc.document_type,
            "filename": doc.filename,
            "file_path": doc.file_path,
            "uploaded_at": doc.uploaded_at
        }
        for doc in application.documents
    ]
    
    return {
        "id": application.id,
        "application_id": application.application_id,
        "business_name": application.business_name,
        "business_type": application.business_type,
        "registration_number": application.registration_number,
        "tax_id": application.tax_id,
        "address": application.address,
        "city": application.city,
        "state": application.state,
        "postal_code": application.postal_code,
        "country": application.country,
        "bank_name": application.bank_name,
        "account_number": application.account_number,
        "routing_number": application.routing_number,
        "status": application.status,
        "submitted_at": application.submitted_at,
        "vendor_id": application.vendor_id,
        "user_email": application.user.email,
        "user_phone": application.user.phone,
        "documents": documents
    }

@router.put("/applications/{application_id}/review")
async def review_application(
    application_id: str,
    review: ApplicationReview,
    admin_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    application = db.query(VendorApplication).filter(
        VendorApplication.application_id == application_id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Update application status
    application.status = review.status
    application.reviewed_at = datetime.utcnow()
    
    # Generate vendor ID if approved
    if review.status == ApplicationStatus.APPROVED:
        vendor_id = f"V{datetime.now().strftime('%Y')}{str(uuid.uuid4())[:8].upper()}"
        application.vendor_id = vendor_id
        application.approved_at = datetime.utcnow()
    
    # Create audit log
    audit_log = AuditLog(
        application_id=application.id,
        user_id=admin_user.id,
        action=f"Application {review.status.value}",
        details=review.rejection_reason if review.rejection_reason else None
    )
    
    db.add(audit_log)
    db.commit()
    
    # Send notification to vendor
    notification_template = "application_approved" if review.status == ApplicationStatus.APPROVED else "application_rejected"
    notification_data = {
        "application_id": application_id,
        "business_name": application.business_name,
        "vendor_id": application.vendor_id if application.vendor_id else None,
        "rejection_reason": review.rejection_reason
    }
    
    await send_notification(
        notification_template,
        application.user.email,
        application.user.phone,
        notification_data
    )
    
    return {"message": f"Application {review.status.value} successfully"}

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    admin_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    total_applications = db.query(VendorApplication).count()
    pending_applications = db.query(VendorApplication).filter(
        VendorApplication.status.in_([ApplicationStatus.PENDING, ApplicationStatus.PAYMENT_PENDING, ApplicationStatus.UNDER_REVIEW])
    ).count()
    approved_applications = db.query(VendorApplication).filter(
        VendorApplication.status == ApplicationStatus.APPROVED
    ).count()
    rejected_applications = db.query(VendorApplication).filter(
        VendorApplication.status == ApplicationStatus.REJECTED
    ).count()
    
    return {
        "total_applications": total_applications,
        "pending_applications": pending_applications,
        "approved_applications": approved_applications,
        "rejected_applications": rejected_applications
    }

@router.get("/audit-logs/{application_id}")
async def get_audit_logs(
    application_id: str,
    admin_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    application = db.query(VendorApplication).filter(
        VendorApplication.application_id == application_id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    audit_logs = db.query(AuditLog).filter(
        AuditLog.application_id == application.id
    ).order_by(AuditLog.timestamp.desc()).all()
    
    return [
        {
            "id": log.id,
            "action": log.action,
            "details": log.details,
            "user_email": log.user.email,
            "timestamp": log.timestamp
        }
        for log in audit_logs
    ]