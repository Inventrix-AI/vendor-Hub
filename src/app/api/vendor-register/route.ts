import { NextRequest, NextResponse } from 'next/server';
import { IdGenerator } from '@/lib/vendorId';
import { UserDB, VendorApplicationDB, DocumentDB, PaymentDB, AuditLogDB, executeQuery } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import Razorpay from 'razorpay';
import { SupabaseStorageService } from '@/lib/supabase-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form data
    const data = {
      // Step 1 - Personal Information
      name: formData.get('name') as string,
      age: parseInt(formData.get('age') as string),
      mobile: formData.get('mobile') as string,
      email: formData.get('email') as string,
      gender: formData.get('gender') as string,
      id_type: formData.get('id_type') as string,
      id_document: formData.get('id_document') as File,
      photo: formData.get('photo') as File,

      // Step 2 - Business Details  
      shop_name: formData.get('shop_name') as string,
      business_type: formData.get('business_type') as string,

      // Step 3 - Address & Documents
      address_line1: formData.get('address_line1') as string,
      address_line2: formData.get('address_line2') as string,
      landmark: formData.get('landmark') as string,
      pincode: formData.get('pincode') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      shop_document_type: formData.get('shop_document_type') as string,
      shop_document: formData.get('shop_document') as File,
      shop_photo: formData.get('shop_photo') as File,
    };

    // Validate required fields
    const requiredFields = ['name', 'age', 'mobile', 'gender', 'shop_name', 'business_type', 'address_line1', 'pincode', 'city', 'state'];
    const missingFields = requiredFields.filter(field => !data[field as keyof typeof data]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate age
    if (data.age < 18) {
      return NextResponse.json(
        { error: 'Must be at least 18 years old' },
        { status: 400 }
      );
    }

    // Validate mobile number format
    if (!/^[0-9]{10}$/.test(data.mobile)) {
      return NextResponse.json(
        { error: 'Invalid mobile number. Must be 10 digits.' },
        { status: 400 }
      );
    }

    // Check for duplicate mobile number
    const existingMobile = await executeQuery(
      'SELECT id FROM users WHERE phone = $1',
      [data.mobile]
    );
    if (existingMobile.rows.length > 0) {
      return NextResponse.json(
        { error: 'Mobile number already registered. Please use a different mobile number.' },
        { status: 400 }
      );
    }

    // Check for duplicate email if provided
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

    // Create user account first
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    const user = await UserDB.create({
      email: data.email || `${vendorId}@vendor.local`, // Create a local email if no email provided
      password_hash: hashedPassword,
      full_name: data.name,
      phone: data.mobile,
      role: 'vendor'
    });

    if (!user) {
      throw new Error('Failed to create user account');
    }

    // Create full address string
    const fullAddress = [
      data.address_line1,
      data.address_line2,
      data.landmark && `Near ${data.landmark}`,
      `${data.city} - ${data.pincode}`,
      data.state
    ].filter(Boolean).join(', ');

    // Create vendor application
    const applicationData = {
      application_id: applicationId,
      user_id: user.id,
      vendor_id: vendorId,
      company_name: data.shop_name,
      business_name: data.shop_name,
      contact_email: data.email || `${vendorId}@vendor.local`, // Use email if provided, otherwise create local email
      phone: data.mobile,
      business_type: data.business_type,
      business_description: '',
      registration_number: null,
      tax_id: null,
      address: fullAddress,
      city: data.city,
      state: data.state,
      postal_code: data.pincode,
      country: 'India',
      bank_name: null,
      account_number: null,
      ifsc_code: null,
      routing_number: null
    };

    const application = await VendorApplicationDB.create(applicationData);
    if (!application) {
      throw new Error('Failed to create vendor application');
    }

    // Handle file uploads to Supabase Storage
    const uploadedFiles = [];
    const filesToUpload = [
      { file: data.id_document, type: 'id_document', name: 'ID Document' },
      { file: data.photo, type: 'photo', name: 'Photo' },
      { file: data.shop_document, type: 'shop_document', name: 'Shop Document' },
      { file: data.shop_photo, type: 'shop_photo', name: 'Shop Photo' }
    ];

    for (const item of filesToUpload) {
      if (item.file && item.file.size > 0) {
        try {
          const fileExtension = item.file.name.split('.').pop();
          const documentReference = `DOC_${uuidv4().toUpperCase()}`;
          const fileName = `${documentReference}.${fileExtension}`;

          // Upload to Supabase Storage
          const uploadResult = await SupabaseStorageService.uploadDocument(
            applicationId,
            item.type,
            item.file,
            fileName
          );

          // Save document record
          await DocumentDB.create({
            document_reference: documentReference,
            application_id: (application as any).id,
            document_type: item.type,
            file_name: fileName,
            file_path: uploadResult.path,
            file_size: item.file.size,
            mime_type: item.file.type,
            uploaded_by: (user as any).id,
            storage_url: uploadResult.publicUrl
          });

          uploadedFiles.push({
            type: item.type,
            name: item.name,
            filename: fileName,
            reference: documentReference
          });
        } catch (error) {
          console.error(`Failed to upload ${item.name}:`, error);
        }
      }
    }

    // Create Razorpay order for payment (₹151)
    const paymentAmount = 15100; // ₹151 in paise

    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials missing:', {
        has_key_id: !!process.env.RAZORPAY_KEY_ID,
        has_secret: !!process.env.RAZORPAY_KEY_SECRET
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Payment gateway not configured. Please contact support.',
        },
        { status: 500 }
      );
    }

    // Validate Razorpay key format
    if (!process.env.RAZORPAY_KEY_ID.startsWith('rzp_')) {
      console.error('Invalid Razorpay Key ID format:', process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment gateway configuration.',
        },
        { status: 500 }
      );
    }

    // Create actual Razorpay order
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
        paymentType: 'initial',
        purpose: 'vendor_onboarding_fee'
      }
    };

    let razorpayOrder;
    try {
      console.log('Creating Razorpay order with data:', {
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        key_id: process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...',
        has_secret: !!process.env.RAZORPAY_KEY_SECRET
      });

      razorpayOrder = await razorpay.orders.create(orderData);
      console.log('Razorpay order created successfully:', razorpayOrder.id);
    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', {
        error: razorpayError.message,
        code: razorpayError.error?.code,
        description: razorpayError.error?.description,
        statusCode: razorpayError.statusCode
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Payment gateway error. Please try again.',
          details: process.env.NODE_ENV === 'development' ? {
            message: razorpayError.message,
            code: razorpayError.error?.code,
            description: razorpayError.error?.description
          } : undefined
        },
        { status: 500 }
      );
    }

    await PaymentDB.create({
      application_id: application.id,
      razorpay_order_id: razorpayOrder.id,
      amount: paymentAmount,
      currency: 'INR',
      payment_reference: `PAY_${applicationId}_${Date.now()}`
    });

    // Log the registration
    await AuditLogDB.create({
      application_id: application.id,
      user_id: user.id,
      action: 'Vendor Registration',
      entity_type: 'application',
      entity_id: application.id,
      new_values: {
        ...applicationData,
        vendor_id: vendorId,
        files_uploaded: uploadedFiles.length
      }
    });

    // Response with all necessary information
    const response = {
      success: true,
      application_id: applicationId,
      vendor_id: vendorId,
      username: vendorId, // Use vendor ID as username instead of email
      temporary_password: temporaryPassword,
      payment: {
        order_id: razorpayOrder.id,
        amount: paymentAmount,
        currency: 'INR',
        razorpay_key: process.env.RAZORPAY_KEY_ID
      },
      uploaded_files: uploadedFiles,
      message: 'Registration successful. Please complete payment to activate your account.',
      instructions: {
        en: 'Your account has been created successfully. Please complete the payment to activate your membership. You can login with your Vendor ID and the provided password.',
        hi: 'आपका खाता सफलतापूर्वक बनाया गया है। कृपया सदस्यता सक्रिय करने के लिए भुगतान पूरा करें। आप अपने विक्रेता ID और दिए गए पासवर्ड से लॉगिन कर सकते हैं।'
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Vendor registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET method to check registration status
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

    const application = await VendorApplicationDB.findByApplicationId(applicationId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Get payment status
    const payments = await PaymentDB.findByApplicationId(application.id);
    const latestPayment = payments[0];

    // Get documents
    const documents = await DocumentDB.findByApplicationId(application.id);

    const response = {
      application_id: application.application_id,
      vendor_id: application.vendor_id,
      status: application.status,
      payment_status: application.payment_status,
      shop_name: application.business_name,
      submitted_at: application.created_at,
      documents: documents.map(doc => ({
        type: doc.document_type,
        filename: doc.file_name,
        uploaded_at: doc.created_at
      })),
      payment: latestPayment ? {
        amount: latestPayment.amount,
        status: latestPayment.status,
        order_id: latestPayment.razorpay_order_id
      } : null
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get registration status error:', error);
    return NextResponse.json(
      { error: 'Failed to get registration status' },
      { status: 500 }
    );
  }
}