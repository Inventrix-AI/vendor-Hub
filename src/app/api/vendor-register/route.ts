import { NextRequest, NextResponse } from 'next/server';
import { IdGenerator } from '@/lib/vendorId';
import { executeQuery, PendingRegistrationDB, VendorApplicationDB, DocumentDB, PaymentDB } from '@/lib/db';
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

    // Helper function to convert File to base64 for database storage
    const fileToBase64 = async (file: File | null): Promise<{ name: string; type: string; size: number; data: string } | null> => {
      if (!file || file.size === 0) return null;
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return {
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64
      };
    };

    // DEBUG: Log incoming files from form data
    console.log('[Vendor Register] DEBUG - Incoming files from form:');
    console.log('[Vendor Register] id_document:', {
      exists: !!data.id_document,
      name: data.id_document?.name,
      size: data.id_document?.size,
      type: data.id_document?.type
    });
    console.log('[Vendor Register] photo:', {
      exists: !!data.photo,
      name: data.photo?.name,
      size: data.photo?.size,
      type: data.photo?.type
    });
    console.log('[Vendor Register] shop_document:', {
      exists: !!data.shop_document,
      name: data.shop_document?.name,
      size: data.shop_document?.size,
      type: data.shop_document?.type
    });
    console.log('[Vendor Register] shop_photo:', {
      exists: !!data.shop_photo,
      name: data.shop_photo?.name,
      size: data.shop_photo?.size,
      type: data.shop_photo?.type
    });

    // Convert files to base64 for storage in database
    const [id_document_b64, photo_b64, shop_document_b64, shop_photo_b64] = await Promise.all([
      fileToBase64(data.id_document),
      fileToBase64(data.photo),
      fileToBase64(data.shop_document),
      fileToBase64(data.shop_photo)
    ]);

    // DEBUG: Log converted files
    console.log('[Vendor Register] DEBUG - Converted files to base64:');
    console.log('[Vendor Register] id_document_b64:', {
      exists: !!id_document_b64,
      has_data: !!(id_document_b64?.data),
      data_length: id_document_b64?.data?.length || 0
    });
    console.log('[Vendor Register] photo_b64:', {
      exists: !!photo_b64,
      has_data: !!(photo_b64?.data),
      data_length: photo_b64?.data?.length || 0
    });
    console.log('[Vendor Register] shop_document_b64:', {
      exists: !!shop_document_b64,
      has_data: !!(shop_document_b64?.data),
      data_length: shop_document_b64?.data?.length || 0
    });
    console.log('[Vendor Register] shop_photo_b64:', {
      exists: !!shop_photo_b64,
      has_data: !!(shop_photo_b64?.data),
      data_length: shop_photo_b64?.data?.length || 0
    });

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
        id_document: id_document_b64,
        id_document_type: data.id_type,  // Store specific ID type (aadhaar_card, voter_id, etc.)
        photo: photo_b64,
        shop_document: shop_document_b64,
        shop_document_type: data.shop_document_type,  // Store specific shop document type
        shop_photo: shop_photo_b64
      }
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

// GET method for tracking application status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Find the application by application_id
    const application = await VendorApplicationDB.findByApplicationId(applicationId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Get documents for this application
    const documents = await DocumentDB.findByApplicationId(application.id);

    // Get payment details
    const payments = await PaymentDB.findByApplicationId(application.id);
    const latestPayment = payments.length > 0 ? payments[0] : null;

    // Format the response
    const response = {
      application_id: application.application_id,
      vendor_id: application.status === 'approved' ? application.vendor_id : undefined,
      status: application.status,
      payment_status: application.payment_status,
      shop_name: application.company_name || application.business_name,
      business_type: application.business_type,
      applicant_name: application.user_full_name,
      phone: application.user_phone || application.phone,
      email: application.user_email || application.contact_email,
      address: application.address,
      city: application.city,
      state: application.state,
      submitted_at: application.created_at,
      rejection_reason: application.rejection_reason,
      documents: documents.map((doc: any) => ({
        type: doc.document_type,
        filename: doc.file_name,
        uploaded_at: doc.created_at
      })),
      payment: latestPayment ? {
        amount: latestPayment.amount,
        status: latestPayment.status,
        order_id: latestPayment.razorpay_order_id
      } : undefined
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application details' },
      { status: 500 }
    );
  }
}

// Export the pending registrations for access from payment verification
// Pending registrations are now stored in database table