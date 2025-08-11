from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import uuid
import os
from datetime import datetime

from database import get_db
from models import User, VendorApplication, Document, ApplicationStatus
from routers.auth import get_current_user
from services.file_service import upload_file
from services.notification_service import send_notification

router = APIRouter()

class VendorApplicationCreate(BaseModel):
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

class VendorApplicationResponse(BaseModel):
    id: int
    application_id: str
    business_name: str
    status: ApplicationStatus
    submitted_at: datetime
    vendor_id: str = None
    
    class Config:
        from_attributes = True

@router.post("/applications", response_model=VendorApplicationResponse)
async def create_application(
    application: VendorApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user already has a pending application
    existing_app = db.query(VendorApplication).filter(
        VendorApplication.user_id == current_user.id,
        VendorApplication.status.in_([ApplicationStatus.PENDING, ApplicationStatus.PAYMENT_PENDING, ApplicationStatus.UNDER_REVIEW])
    ).first()
    
    if existing_app:
        raise HTTPException(status_code=400, detail="You already have a pending application")
    
    application_id = f"VND{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
    
    db_application = VendorApplication(
        application_id=application_id,
        user_id=current_user.id,
        **application.dict()
    )
    
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    
    # Send notification
    await send_notification(
        "application_submitted",
        current_user.email,
        current_user.phone,
        {"application_id": application_id, "business_name": application.business_name}
    )
    
    return db_application

@router.post("/applications/{application_id}/documents")
async def upload_document(
    application_id: str,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = db.query(VendorApplication).filter(
        VendorApplication.application_id == application_id,
        VendorApplication.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Upload file
    file_path = await upload_file(file, f"applications/{application_id}")
    
    document = Document(
        application_id=application.id,
        document_type=document_type,
        filename=file.filename,
        file_path=file_path,
        file_size=file.size,
        mime_type=file.content_type
    )
    
    db.add(document)
    db.commit()
    
    return {"message": "Document uploaded successfully", "document_id": document.id}

@router.get("/applications", response_model=List[VendorApplicationResponse])
async def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    applications = db.query(VendorApplication).filter(
        VendorApplication.user_id == current_user.id
    ).order_by(VendorApplication.submitted_at.desc()).all()
    
    return applications

@router.get("/applications/{application_id}", response_model=VendorApplicationResponse)
async def get_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = db.query(VendorApplication).filter(
        VendorApplication.application_id == application_id,
        VendorApplication.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return application