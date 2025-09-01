import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PaymentDB, VendorApplicationDB, VendorSubscriptionDB, AuditLogDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      application_id
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification parameters' },
        { status: 400 }
      );
    }

    // Razorpay secret key
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeySecret) {
      return NextResponse.json(
        { error: 'Razorpay configuration missing' },
        { status: 500 }
      );
    }

    // Create signature for verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body.toString())
      .digest('hex');

    // Verify signature
    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Find the application
    const application = application_id 
      ? await VendorApplicationDB.findByApplicationId(application_id)
      : null;

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update payment record
    await PaymentDB.updateByOrderId(razorpay_order_id, {
      razorpay_payment_id: razorpay_payment_id,
      status: 'success',
      payment_reference: razorpay_signature
    });

    // Update application status to payment completed
    await VendorApplicationDB.updateById(application.id, {
      payment_status: 'paid',
      status: 'under_review'
    });

    // Create vendor subscription
    const currentDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(currentDate.getFullYear() + 1); // 1 year subscription

    // Generate vendor_id if it doesn't exist
    const vendorId = application.vendor_id || `VEN_${Date.now().toString().slice(-6)}`;
    
    // Update application with vendor_id if it was generated
    if (!application.vendor_id) {
      await VendorApplicationDB.updateById(application.id, {
        vendor_id: vendorId
      });
    }

    await VendorSubscriptionDB.create({
      vendor_id: vendorId,
      application_id: application.id,
      subscription_status: 'active',
      activated_at: currentDate,
      expires_at: expiryDate
    });

    // Log the payment verification
    await AuditLogDB.create({
      application_id: application.id,
      user_id: application.user_id,
      action: 'Payment Verified',
      entity_type: 'payment',
      entity_id: application.id,
      new_values: {
        razorpay_order_id,
        razorpay_payment_id,
        payment_status: 'success',
        verified_at: new Date().toISOString()
      }
    });

    console.log(`Payment verified for application ${application_id}`);

    // Get the updated application with vendor_id
    const updatedApplication = await VendorApplicationDB.findByApplicationId(application_id);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      applicationId: application_id,
      vendorId: updatedApplication?.vendor_id,
      email: updatedApplication?.email,
      temporaryPassword: updatedApplication?.temporary_password,
      status: 'under_review'
    });

  } catch (error) {
    console.error('Payment verification failed:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}