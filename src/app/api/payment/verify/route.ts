import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PendingRegistrationDB } from '@/lib/db';
import { completeRegistration } from '@/lib/registrationService';

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification parameters' },
        { status: 400 }
      );
    }

    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeySecret) {
      return NextResponse.json(
        { error: 'Razorpay configuration missing' },
        { status: 500 }
      );
    }

    // Verify the payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Retrieve staged registration data. Use the ignore-expiry lookup: the
    // signature is already cryptographically verified above, so even if the
    // 30-minute staging window elapsed (slow UPI redirect, retried verify) the
    // paying customer must still be materialised rather than lost.
    const pendingRegistration = await PendingRegistrationDB.findByOrderIdIgnoreExpiry(razorpay_order_id);

    if (!pendingRegistration) {
      // No staged row: either already processed (webhook / prior verify) or it
      // never existed.
      return NextResponse.json(
        { error: 'Registration data not found or already processed' },
        { status: 404 }
      );
    }

    const result = await completeRegistration({
      pendingRegistration,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      source: 'client_verify',
    });

    return NextResponse.json({
      success: true,
      message: result.created
        ? 'Payment verified and registration completed successfully'
        : 'Registration already completed',
      paymentId: razorpay_payment_id,
      applicationId: result.applicationId,
      vendorId: result.vendorId,
      username: result.vendorId,
      email: result.email,
      temporaryPassword: result.temporaryPassword,
      status: 'under_review',
      uploaded_files: result.uploadedFiles,
      skipped_files: result.skippedFiles,
      file_upload_summary: {
        total_expected: 4,
        successfully_uploaded: result.uploadedFiles.length,
        skipped: result.skippedFiles.length,
      },
    });

  } catch (error) {
    console.error('Payment verification and registration failed:', error);
    return NextResponse.json(
      {
        error: 'Payment verification failed',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ?
          error.message : undefined
      },
      { status: 500 }
    );
  }
}
