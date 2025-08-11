from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from database import get_db
from models import NotificationTemplate
from routers.auth import get_current_user
from routers.admin import admin_required

router = APIRouter()

class NotificationTemplateCreate(BaseModel):
    name: str
    subject: str
    email_template: str = None
    sms_template: str = None

class NotificationTemplateResponse(BaseModel):
    id: int
    name: str
    subject: str
    email_template: str = None
    sms_template: str = None
    
    class Config:
        from_attributes = True

@router.get("/templates", response_model=List[NotificationTemplateResponse])
async def get_notification_templates(
    admin_user = Depends(admin_required),
    db: Session = Depends(get_db)
):
    templates = db.query(NotificationTemplate).all()
    return templates

@router.post("/templates", response_model=NotificationTemplateResponse)
async def create_notification_template(
    template: NotificationTemplateCreate,
    admin_user = Depends(admin_required),
    db: Session = Depends(get_db)
):
    existing_template = db.query(NotificationTemplate).filter(
        NotificationTemplate.name == template.name
    ).first()
    
    if existing_template:
        raise HTTPException(status_code=400, detail="Template with this name already exists")
    
    db_template = NotificationTemplate(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    return db_template

@router.put("/templates/{template_id}", response_model=NotificationTemplateResponse)
async def update_notification_template(
    template_id: int,
    template: NotificationTemplateCreate,
    admin_user = Depends(admin_required),
    db: Session = Depends(get_db)
):
    db_template = db.query(NotificationTemplate).filter(
        NotificationTemplate.id == template_id
    ).first()
    
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    for field, value in template.dict().items():
        setattr(db_template, field, value)
    
    db.commit()
    db.refresh(db_template)
    
    return db_template