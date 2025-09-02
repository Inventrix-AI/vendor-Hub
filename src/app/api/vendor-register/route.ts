import { NextRequest, NextResponse } from 'next/server';
import { IdGenerator } from '@/lib/vendorId';
import { executeQuery, PendingRegistrationDB } from '@/lib/db';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form data
    const data = {
      // Step 1 - Personal Information
      name: formData.get('name') as string,
      age: formData.get('age') as string,
      gender: formData.get('gender') as string,
      mobile: formData.get('mobile') as string,
      email: formData.get('email') as string,
      
      // Step 2 - Business Information
      shop_name: formData.get('shop_name') as string,
      business_type: formData.get('business_type') as string,
      
      // Step 3 - Address Information
      address_line1: formData.get('address_line1') as string,
      address_line2: formData.get('address_line2') as string,
      landmark: formData.get('landmark') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      pincode: formData.get('pincode') as string,
      
      // Step 4 - Documents
      id_type: formData.get('id_type') as string,
      id_document: formData.get('id_document') as File,
      photo: formData.get('photo') as File,
      shop_document_type: formData.get('shop_document_type') as string,
      shop_document: formData.get('shop_document') as File,
      shop_photo: formData.get('shop_photo') as File,
    };

    // Validate required fields
    const requiredFields = ['name', 'mobile', 'shop_name', 'business_type', 'city', 'state', 'pincode'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if mobile number already exists
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE phone = $1',
      [data.mobile]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Mobile number already registered. Please use a different mobile number.' },
        { status: 400 }
      );
    }

    // Check email if provided
    if (data.email) {
      const existingEmail = await executeQuery(
        'SELECT id FROM users WHERE email = $1',
        [data.email]
      );
      
      if (existingEmail.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email already registered. Please use a different email address.' },
          { status: 400 }
        );
      }
    }

    // Generate unique IDs
    const applicationId = IdGenerator.applicationId();
    const vendorId = `PVS${Date.now().toString().slice(-6)}`;
    const temporaryPassword = Math.random().toString(36).slice(-8);

    // Create full address string
    const fullAddress = [
      data.address_line1,
      data.address_line2,
      data.landmark && `Near ${data.landmark}`,
      `${data.city} - ${data.pincode}`,
      data.state
    ].filter(Boolean).join(', ');

    // Store registration data temporarily (will be saved to DB after payment)
    const registrationData = {
      timestamp: new Date().toISOString(),
      userData: {
        email: data.email || `${vendorId}@vendor.local`,
        full_name: data.name,
        phone: data.mobile,
        role: 'vendor',
        temporaryPassword: temporaryPassword
      },
      applicationData: {
        application_id: applicationId,
        vendor_id: vendorId,
        company_name: data.shop_name,
        business_name: data.shop_name,
        contact_email: data.email || `${vendorId}@vendor.local`,
        phone: data.mobile,
        business_type: data.business_type,
        business_description: `${data.business_type} business`,
        address: fullAddress,
        city: data.city,
        state: data.state,
        postal_code: data.pincode,
        country: 'India'
      },
      files: {
        id_document: data.id_document,
        photo: data.photo,
        shop_document: data.shop_document,
        shop_photo: data.shop_photo
      },
      rawData: data // Keep original data for reference
    };

    // Create Razorpay order for payment (₹151)
    const paymentAmount = 15100; // ₹151 in paise

    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials missing');
      return NextResponse.json(
        {
          success: false,
          error: 'Payment gateway not configured. Please contact support.',
        },
        { status: 500 }
      );
    }

    // Create Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const orderData = {
      amount: paymentAmount,
      currency: 'INR',
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
      notes: {
        applicationId: applicationId,
        vendorId: vendorId,
        paymentType: 'vendor_registration',
        purpose: 'vendor_onboarding_fee'
      }
    };

    let razorpayOrder;
    try {
      console.log('Creating Razorpay order for registration...');
      razorpayOrder = await razorpay.orders.create(orderData);
      console.log('Razorpay order created:', razorpayOrder.id);

      // Store registration data in database with expiration
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes from now
      
      await PendingRegistrationDB.create({
        razorpay_order_id: razorpayOrder.id,
        application_id: applicationId,
        vendor_id: vendorId,
        registration_data: registrationData,
        expires_at: expiresAt
      });
      
      console.log('Stored pending registration in database:', razorpayOrder.id);

    } catch (razorpayError: any) {
      console.error('Razorpay order creation failed:', razorpayError);
      return NextResponse.json(
        {
          success: false,
          error: 'Payment gateway error. Please try again.',
          details: process.env.NODE_ENV === 'development' ? {
            message: razorpayError.message,
            code: razorpayError.error?.code
          } : undefined
        },
        { status: 500 }
      );
    }

    // Return success response with payment details (no user/application data saved yet)
    return NextResponse.json({
      success: true,
      message: 'Registration data validated. Please complete payment to finish registration.',
      payment_details: {
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        application_id: applicationId,
        vendor_id: vendorId,
        razorpay_key: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('Vendor registration preparation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Registration preparation failed. Please try again.',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? 
          error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Export the pending registrations for access from payment verification
// Pending registrations are now stored in database table