import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { UserDB, VendorApplicationDB, DocumentDB, PaymentDB, AuditLogDB, VendorSubscriptionDB, PendingRegistrationDB, executeQuery } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { SupabaseStorageService } from '@/lib/supabase-storage';

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

    // Retrieve pending registration data from database
    const pendingRegistration = await PendingRegistrationDB.findByOrderId(razorpay_order_id);
    
    if (!pendingRegistration) {
      return NextResponse.json(
        { error: 'Registration data not found or expired' },
        { status: 404 }
      );
    }
    
    const registrationData = pendingRegistration.registration_data;

    console.log('Creating user account after successful payment verification...');

    // Create user account
    const hashedPassword = await bcrypt.hash(registrationData.userData.temporaryPassword, 12);

    const user = await UserDB.create({
      email: registrationData.userData.email,
      password_hash: hashedPassword,
      full_name: registrationData.userData.full_name,
      phone: registrationData.userData.phone,
      role: registrationData.userData.role
    });

    if (!user) {
      throw new Error('Failed to create user account');
    }

    // Create vendor application
    const application = await VendorApplicationDB.create({
      ...registrationData.applicationData,
      user_id: user.id
    });

    if (!application) {
      throw new Error('Failed to create vendor application');
    }

    // Handle file uploads to Supabase Storage
    const uploadedFiles = [];
    const filesToUpload = [
      { file: registrationData.files.id_document, type: 'id_document', name: 'ID Document' },
      { file: registrationData.files.photo, type: 'photo', name: 'Photo' },
      { file: registrationData.files.shop_document, type: 'shop_document', name: 'Shop Document' },
      { file: registrationData.files.shop_photo, type: 'shop_photo', name: 'Shop Photo' }
    ];

    for (const item of filesToUpload) {
      if (item.file && item.file.size > 0) {
        try {
          const fileExtension = item.file.name.split('.').pop();
          const documentReference = `DOC_${uuidv4().toUpperCase()}`;
          const fileName = `${documentReference}.${fileExtension}`;

          // Upload to Supabase Storage
          const uploadResult = await SupabaseStorageService.uploadDocument(
            registrationData.applicationData.application_id,
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

    // Create payment record
    await PaymentDB.create({
      application_id: (application as any).id,
      razorpay_order_id: razorpay_order_id,
      amount: 15100, // ₹151 in paise
      currency: 'INR',
      payment_reference: `PAY_${registrationData.applicationData.application_id}_${Date.now()}`,
      payment_type: 'vendor_registration'
    });

    // Update payment status to success
    await PaymentDB.updateByOrderId(razorpay_order_id, {
      razorpay_payment_id: razorpay_payment_id,
      status: 'success',
      payment_reference: razorpay_signature
    });

    // Update application status to payment completed
    await VendorApplicationDB.updateById((application as any).id, {
      payment_status: 'paid',
      status: 'under_review'
    });

    // Create vendor subscription
    const currentDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(currentDate.getFullYear() + 1); // 1 year subscription

    await VendorSubscriptionDB.create({
      vendor_id: registrationData.applicationData.vendor_id,
      application_id: (application as any).id,
      subscription_status: 'active',
      activated_at: currentDate,
      expires_at: expiryDate
    });

    // Log the registration and payment verification
    await AuditLogDB.create({
      application_id: (application as any).id,
      user_id: (user as any).id,
      action: 'Vendor Registration Completed',
      entity_type: 'application',
      entity_id: (application as any).id,
      new_values: {
        ...registrationData.applicationData,
        files_uploaded: uploadedFiles.length,
        payment_verified: true,
        razorpay_order_id,
        razorpay_payment_id,
        verified_at: new Date().toISOString()
      }
    });

    // Clean up temporary registration data from database
    await PendingRegistrationDB.deleteByOrderId(razorpay_order_id);
    
    console.log(`Registration completed successfully for vendor ${registrationData.applicationData.vendor_id}`);

    return NextResponse.json({
      success: true,
      message: 'Payment verified and registration completed successfully',
      paymentId: razorpay_payment_id,
      applicationId: registrationData.applicationData.application_id,
      vendorId: registrationData.applicationData.vendor_id,
      username: registrationData.applicationData.vendor_id, // Use vendor ID as username
      email: registrationData.userData.email,
      temporaryPassword: registrationData.userData.temporaryPassword,
      status: 'under_review',
      uploaded_files: uploadedFiles
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