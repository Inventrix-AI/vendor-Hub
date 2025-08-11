from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import razorpay
import os
from dotenv import load_dotenv

from database import get_db
from models import VendorApplication, Payment, PaymentStatus, ApplicationStatus
from routers.auth import get_current_user
from services.notification_service import send_notification

load_dotenv()

router = APIRouter()

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(
    os.getenv("RAZORPAY_KEY_ID"),
    os.getenv("RAZORPAY_KEY_SECRET")
))

class PaymentCreate(BaseModel):
    application_id: str
    amount: float

class PaymentResponse(BaseModel):
    razorpay_order_id: str
    amount: float
    currency: str
    key: str

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@router.post("/create-order", response_model=PaymentResponse)
async def create_payment_order(
    payment_data: PaymentCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = db.query(VendorApplication).filter(
        VendorApplication.application_id == payment_data.application_id,
        VendorApplication.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application.status != ApplicationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Application is not in pending status")
    
    # Create Razorpay order
    order_data = {
        "amount": int(payment_data.amount * 100),  # Amount in paise
        "currency": "INR",
        "payment_capture": 1,
        "notes": {
            "application_id": payment_data.application_id,
            "user_id": str(current_user.id)
        }
    }
    
    try:
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        # Save payment record
        payment = Payment(
            application_id=application.id,
            razorpay_order_id=razorpay_order["id"],
            amount=payment_data.amount,
            currency="INR",
            status=PaymentStatus.PENDING
        )
        
        db.add(payment)
        
        # Update application status
        application.status = ApplicationStatus.PAYMENT_PENDING
        
        db.commit()
        
        return {
            "razorpay_order_id": razorpay_order["id"],
            "amount": payment_data.amount,
            "currency": "INR",
            "key": os.getenv("RAZORPAY_KEY_ID")
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create payment order: {str(e)}")

@router.post("/verify-payment")
async def verify_payment(
    verification_data: PaymentVerification,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Verify payment signature
        params_dict = {
            'razorpay_order_id': verification_data.razorpay_order_id,
            'razorpay_payment_id': verification_data.razorpay_payment_id,
            'razorpay_signature': verification_data.razorpay_signature
        }
        
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Update payment status
        payment = db.query(Payment).filter(
            Payment.razorpay_order_id == verification_data.razorpay_order_id
        ).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        payment.razorpay_payment_id = verification_data.razorpay_payment_id
        payment.status = PaymentStatus.SUCCESS
        
        # Update application status
        application = payment.application
        application.status = ApplicationStatus.UNDER_REVIEW
        
        db.commit()
        
        # Send notification
        await send_notification(
            "payment_success",
            current_user.email,
            current_user.phone,
            {"application_id": application.application_id, "amount": payment.amount}
        )
        
        return {"message": "Payment verified successfully"}
        
    except Exception as e:
        # Update payment status to failed
        payment = db.query(Payment).filter(
            Payment.razorpay_order_id == verification_data.razorpay_order_id
        ).first()
        
        if payment:
            payment.status = PaymentStatus.FAILED
            db.commit()
        
        # Send notification
        await send_notification(
            "payment_failed",
            current_user.email,
            current_user.phone,
            {"application_id": payment.application.application_id if payment else "N/A"}
        )
        
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")

@router.get("/history")
async def get_payment_history(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payments = db.query(Payment).join(VendorApplication).filter(
        VendorApplication.user_id == current_user.id
    ).order_by(Payment.created_at.desc()).all()
    
    return [
        {
            "id": payment.id,
            "application_id": payment.application.application_id,
            "amount": payment.amount,
            "status": payment.status,
            "created_at": payment.created_at,
            "razorpay_payment_id": payment.razorpay_payment_id
        }
        for payment in payments
    ]