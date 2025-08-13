import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { 
      type, 
      recipient, 
      templateId, 
      data,
      applicationId 
    } = await request.json();

    if (!type || !recipient || !templateId) {
      return NextResponse.json(
        { error: 'Missing required notification parameters' },
        { status: 400 }
      );
    }

    // Send notification based on type
    let result;
    switch (type) {
      case 'email':
        result = await sendEmail(recipient, templateId, data);
        break;
      case 'sms':
        result = await sendSMS(recipient, templateId, data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    // Log notification (in production, store in database)
    console.log('Notification sent:', {
      id: result.id,
      type,
      recipient,
      templateId,
      applicationId,
      sentAt: new Date().toISOString(),
      status: 'sent'
    });

    return NextResponse.json({
      success: true,
      notificationId: result.id,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Notification failed:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

async function sendEmail(email: string, templateId: string, data: any) {
  // Email templates
  const templates = {
    'application_received': {
      subject: 'Application Received - Vendor Onboarding',
      body: `Dear ${data.vendorName},\n\nYour vendor onboarding application (ID: ${data.applicationId}) has been received successfully.\n\nWe will review your application and notify you of the status within 2-3 business days.\n\nThank you for choosing us!\n\nBest regards,\nVendor Onboarding Team`
    },
    'payment_confirmation': {
      subject: 'Payment Successful - Vendor Onboarding',
      body: `Dear ${data.vendorName},\n\nYour payment of ₹${data.amount} has been processed successfully.\n\nPayment ID: ${data.paymentId}\nApplication ID: ${data.applicationId}\n\nYour application is now under review.\n\nBest regards,\nVendor Onboarding Team`
    },
    'application_approved': {
      subject: 'Application Approved - Welcome!',
      body: `Dear ${data.vendorName},\n\nCongratulations! Your vendor application has been approved.\n\nVendor ID: ${data.vendorId}\nApplication ID: ${data.applicationId}\n\nYou can now access your vendor dashboard and start using our services.\n\nWelcome aboard!\n\nBest regards,\nVendor Onboarding Team`
    },
    'application_rejected': {
      subject: 'Application Status Update',
      body: `Dear ${data.vendorName},\n\nThank you for your interest in becoming a vendor.\n\nUnfortunately, we cannot approve your application at this time.\n\nReason: ${data.rejectionReason || 'Please contact support for details'}\n\nYou may reapply after addressing the concerns mentioned above.\n\nBest regards,\nVendor Onboarding Team`
    }
  };

  const template = templates[templateId as keyof typeof templates];
  if (!template) {
    throw new Error('Invalid email template');
  }

  // Mock email sending (in production, use a service like SendGrid, AWS SES, etc.)
  console.log('Sending email to:', email);
  console.log('Subject:', template.subject);
  console.log('Body:', template.body);

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'sent'
  };
}

async function sendSMS(phone: string, templateId: string, data: any) {
  // SMS templates
  const templates = {
    'application_received': `Hi ${data.vendorName}, your vendor application (${data.applicationId}) has been received. You'll hear from us within 2-3 business days.`,
    'payment_confirmation': `Payment successful! Amount: ₹${data.amount}, Payment ID: ${data.paymentId}. Your application is under review.`,
    'application_approved': `Congratulations! Your vendor application has been approved. Vendor ID: ${data.vendorId}. Welcome aboard!`,
    'application_rejected': `Your vendor application could not be approved at this time. Reason: ${data.rejectionReason || 'Please contact support'}. You may reapply.`
  };

  const message = templates[templateId as keyof typeof templates];
  if (!message) {
    throw new Error('Invalid SMS template');
  }

  // Mock SMS sending (in production, use Twilio, AWS SNS, etc.)
  console.log('Sending SMS to:', phone);
  console.log('Message:', message);

  // Simulate SMS sending delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    id: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'sent'
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID required' },
        { status: 400 }
      );
    }

    // Mock notification history
    const notifications = [
      {
        id: '1',
        type: 'email',
        recipient: 'vendor@example.com',
        templateId: 'application_received',
        applicationId,
        sentAt: new Date().toISOString(),
        status: 'sent'
      },
      {
        id: '2',
        type: 'sms',
        recipient: '+919999999999',
        templateId: 'application_received',
        applicationId,
        sentAt: new Date().toISOString(),
        status: 'sent'
      }
    ];

    return NextResponse.json({ notifications });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get notification history' },
      { status: 500 }
    );
  }
}