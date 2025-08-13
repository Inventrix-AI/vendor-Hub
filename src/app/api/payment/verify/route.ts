import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      applicationId
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification parameters' },
        { status: 400 }
      );
    }

    // Razorpay secret key
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_1234567890';

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

    // Payment is verified - update application status
    const paymentRecord = {
      id: crypto.randomUUID(),
      applicationId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      status: 'completed',
      amount: 500, // Should get from order
      currency: 'INR',
      verifiedAt: new Date().toISOString(),
      signature: razorpay_signature
    };

    // Store payment record (mock implementation)
    console.log('Payment verified and stored:', paymentRecord);

    // Update application status to "payment_completed"
    // This would typically update the database
    console.log(`Application ${applicationId} payment completed`);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id
    });

  } catch (error) {
    console.error('Payment verification failed:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}