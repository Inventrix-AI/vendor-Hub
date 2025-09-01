import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { PaymentDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'INR', applicationId, vendorId, paymentType = 'initial' } = await request.json();

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    if (paymentType === 'initial' && !applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required for initial payments' },
        { status: 400 }
      );
    }

    if (paymentType === 'renewal' && !vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required for renewal payments' },
        { status: 400 }
      );
    }

    // Razorpay credentials from environment
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json(
        { error: 'Razorpay credentials not configured' },
        { status: 500 }
      );
    }

    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret
    });

    // Create Razorpay order
    const identifier = applicationId || vendorId;
    const purpose = paymentType === 'renewal' ? 'vendor_renewal_fee' : 'vendor_onboarding_fee';
    
    const orderData = {
      amount: amount, // amount in paise
      currency: currency,
      receipt: `rcpt_${Date.now().toString().slice(-8)}`, // Razorpay receipt max 40 chars
      notes: {
        applicationId: applicationId || null,
        vendorId: vendorId || null,
        paymentType: paymentType,
        purpose: purpose
      }
    };

    // Create actual Razorpay order
    const order = await razorpay.orders.create(orderData);

    // Store order in database if applicationId is provided
    if (applicationId) {
      try {
        const application = await import('@/lib/db').then(db => 
          db.VendorApplicationDB.findByApplicationId(applicationId)
        );
        
        if (application) {
          await PaymentDB.create({
            application_id: application.id,
            razorpay_order_id: order.id,
            amount: amount,
            currency: currency,
            payment_type: paymentType,
            payment_reference: `PAY_${applicationId}_${Date.now()}`
          });
        }
      } catch (dbError) {
        console.error('Failed to store payment record:', dbError);
        // Continue with order creation even if DB storage fails
      }
    }

    console.log('Created Razorpay order:', order.id);

    return NextResponse.json({
      id: order.id,
      entity: order.entity,
      amount: order.amount,
      amount_paid: order.amount_paid,
      amount_due: order.amount_due,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      created_at: order.created_at,
      notes: order.notes,
      key: razorpayKeyId // Include the key for frontend
    });

  } catch (error) {
    console.error('Order creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}