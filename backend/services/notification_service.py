import os
import smtplib
from email.mime.text import MIMEText as MimeText
from email.mime.multipart import MIMEMultipart as MimeMultipart
from twilio.rest import Client
from sqlalchemy.orm import Session
from models import NotificationTemplate
from database import SessionLocal
from typing import Dict, Optional
from dotenv import load_dotenv

load_dotenv()

# Email configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

# Twilio configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

# Default templates
DEFAULT_TEMPLATES = {
    "application_submitted": {
        "subject": "Application Submitted Successfully",
        "email_template": """
        Dear {business_name} Team,

        Your vendor application has been submitted successfully.
        Application ID: {application_id}

        Next steps:
        1. Complete the payment process
        2. Our team will review your application
        3. You will receive updates via email and SMS

        Thank you for choosing our platform.

        Best regards,
        Vendor Onboarding Team
        """,
        "sms_template": "Your vendor application {application_id} has been submitted successfully. Complete payment to proceed with review."
    },
    "payment_success": {
        "subject": "Payment Confirmed - Application Under Review",
        "email_template": """
        Dear Customer,

        Your payment of ₹{amount} for application {application_id} has been confirmed.

        Your application is now under review. We will notify you once the review is complete.

        Best regards,
        Vendor Onboarding Team
        """,
        "sms_template": "Payment confirmed for application {application_id}. Your application is now under review."
    },
    "payment_failed": {
        "subject": "Payment Failed - Action Required",
        "email_template": """
        Dear Customer,

        We were unable to process your payment for application {application_id}.

        Please try again or contact support if you continue to face issues.

        Best regards,
        Vendor Onboarding Team
        """,
        "sms_template": "Payment failed for application {application_id}. Please try again or contact support."
    },
    "application_approved": {
        "subject": "Congratulations! Your Application is Approved",
        "email_template": """
        Dear {business_name} Team,

        Congratulations! Your vendor application {application_id} has been approved.

        Your Vendor ID: {vendor_id}

        You can now access our vendor portal and start working with us.

        Welcome aboard!

        Best regards,
        Vendor Onboarding Team
        """,
        "sms_template": "Congratulations! Your application {application_id} is approved. Vendor ID: {vendor_id}"
    },
    "application_rejected": {
        "subject": "Application Update Required",
        "email_template": """
        Dear {business_name} Team,

        We have reviewed your application {application_id}, and we need you to address the following:

        {rejection_reason}

        Please resubmit your application with the required changes.

        Best regards,
        Vendor Onboarding Team
        """,
        "sms_template": "Your application {application_id} needs updates. Please check your email for details."
    }
}

def get_template(template_name: str) -> Dict[str, str]:
    """Get notification template from database or default"""
    try:
        db = SessionLocal()
        template = db.query(NotificationTemplate).filter(
            NotificationTemplate.name == template_name
        ).first()
        
        if template:
            return {
                "subject": template.subject,
                "email_template": template.email_template,
                "sms_template": template.sms_template
            }
        else:
            # Return default template
            return DEFAULT_TEMPLATES.get(template_name, {
                "subject": "Notification",
                "email_template": "You have a new notification.",
                "sms_template": "You have a new notification."
            })
    except Exception as e:
        print(f"Error getting template: {str(e)}")
        return DEFAULT_TEMPLATES.get(template_name, {
            "subject": "Notification",
            "email_template": "You have a new notification.",
            "sms_template": "You have a new notification."
        })
    finally:
        if 'db' in locals():
            db.close()

async def send_email(to_email: str, subject: str, body: str):
    """Send email notification"""
    if not SMTP_USER or not SMTP_PASSWORD:
        print("Email configuration not found, skipping email notification")
        return
    
    try:
        msg = MimeMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MimeText(body, 'plain'))
        
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_USER, to_email, text)
        server.quit()
        
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {str(e)}")

async def send_sms(to_phone: str, message: str):
    """Send SMS notification"""
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        print("SMS configuration not found, skipping SMS notification")
        return
    
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        # Ensure phone number has country code
        if not to_phone.startswith('+'):
            to_phone = f"+91{to_phone}"  # Assuming Indian numbers
        
        message = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to_phone
        )
        
        print(f"SMS sent successfully to {to_phone}")
    except Exception as e:
        print(f"Failed to send SMS: {str(e)}")

async def send_notification(
    template_name: str,
    email: str,
    phone: Optional[str],
    data: Dict[str, str]
):
    """Send both email and SMS notifications"""
    template = get_template(template_name)
    
    # Format email content
    subject = template["subject"].format(**data)
    email_body = template["email_template"].format(**data)
    
    # Send email
    await send_email(email, subject, email_body)
    
    # Send SMS if phone number is provided
    if phone and template.get("sms_template"):
        sms_message = template["sms_template"].format(**data)
        await send_sms(phone, sms_message)