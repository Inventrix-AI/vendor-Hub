import {
  UserDB,
  VendorApplicationDB,
  DocumentDB,
  PaymentDB,
  AuditLogDB,
  VendorSubscriptionDB,
  PendingRegistrationDB,
} from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { SupabaseStorageService } from '@/lib/supabase-storage';

export type RegistrationSource = 'client_verify' | 'webhook' | 'reconcile_cron';

export interface CompleteRegistrationResult {
  created: boolean;            // true if this call created the records, false if they already existed
  vendorId: string;
  applicationId: string;
  email: string;
  temporaryPassword?: string;  // only returned when freshly created
  uploadedFiles: Array<{ type: string; name: string; filename: string; reference: string }>;
  skippedFiles: string[];
}

/**
 * Idempotently turn a staged pending_registration into real records
 * (user + application + documents + payment + subscription + audit log).
 *
 * This is the single source of truth for "a payment succeeded, materialise the
 * customer". It is called by:
 *   - the client-side /api/payment/verify (happy path)
 *   - the Razorpay /api/payment/webhook  (server-side fallback if the browser
 *     never called verify — the original cause of lost paying customers)
 *   - the /api/cron/reconcile-payments safety net
 *
 * Idempotency: keyed on applicationData.application_id. If an application with
 * that id already exists, we treat the registration as already completed, make
 * sure the staged row is cleaned up, and return created=false. This makes it
 * safe for verify + webhook + cron to race or fire more than once.
 */
export async function completeRegistration(params: {
  pendingRegistration: any; // row from pending_registrations, with parsed registration_data
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  source: RegistrationSource;
}): Promise<CompleteRegistrationResult> {
  const { pendingRegistration, razorpayOrderId, razorpayPaymentId, razorpaySignature, source } = params;
  const registrationData = pendingRegistration.registration_data;
  const applicationIdStr: string = registrationData.applicationData.application_id;
  const vendorId: string = registrationData.applicationData.vendor_id;

  // ---- Idempotency guard ---------------------------------------------------
  const existing = await VendorApplicationDB.findByApplicationId(applicationIdStr);
  if (existing) {
    console.log(`[completeRegistration] (${source}) application ${applicationIdStr} already exists — no-op`);
    // Ensure the staged row is gone so it can't be reprocessed
    await PendingRegistrationDB.deleteByOrderId(razorpayOrderId).catch(() => {});
    return {
      created: false,
      vendorId,
      applicationId: applicationIdStr,
      email: registrationData.userData.email,
      uploadedFiles: [],
      skippedFiles: [],
    };
  }

  console.log(`[completeRegistration] (${source}) creating records for vendor ${vendorId} / ${applicationIdStr}`);

  // ---- User ----------------------------------------------------------------
  const hashedPassword = await bcrypt.hash(registrationData.userData.temporaryPassword, 12);
  const user = await UserDB.create({
    email: registrationData.userData.email,
    password_hash: hashedPassword,
    full_name: registrationData.userData.full_name,
    phone: registrationData.userData.phone,
    role: registrationData.userData.role,
  });
  if (!user) throw new Error('Failed to create user account');

  // ---- Application ---------------------------------------------------------
  const application = await VendorApplicationDB.create({
    ...registrationData.applicationData,
    user_id: (user as any).id,
  });
  if (!application) throw new Error('Failed to create vendor application');

  // ---- Documents (base64 -> Supabase Storage) ------------------------------
  const uploadedFiles: CompleteRegistrationResult['uploadedFiles'] = [];
  const files = registrationData.files || {};
  const filesToUpload = [
    { file: files.id_document, type: files.id_document_type || 'aadhaar_card', name: 'ID Document' },
    { file: files.photo, type: 'passport_photo', name: 'Photo' },
    { file: files.shop_document, type: files.shop_document_type || 'shop_document', name: 'Shop Document' },
    { file: files.shop_photo, type: 'shop_photo', name: 'Shop Photo' },
  ];

  for (const item of filesToUpload) {
    if (item.file && item.file.data && item.file.size > 0) {
      try {
        const fileExtension = item.file.name.split('.').pop();
        const documentReference = `DOC_${uuidv4().toUpperCase()}`;
        const fileName = `${documentReference}.${fileExtension}`;
        const fileBuffer = Buffer.from(item.file.data, 'base64');

        const uploadResult = await SupabaseStorageService.uploadDocumentBuffer(
          registrationData.applicationData.application_id,
          item.type,
          fileBuffer,
          fileName,
          item.file.type
        );

        await DocumentDB.create({
          document_reference: documentReference,
          application_id: (application as any).id,
          document_type: item.type,
          file_name: fileName,
          file_path: uploadResult.path,
          file_size: item.file.size,
          mime_type: item.file.type,
          uploaded_by: (user as any).id,
          storage_url: uploadResult.publicUrl,
        });

        uploadedFiles.push({ type: item.type, name: item.name, filename: fileName, reference: documentReference });
      } catch (error) {
        console.error(`[completeRegistration] Failed to upload ${item.name}:`, error instanceof Error ? error.message : error);
      }
    }
  }

  const skippedFiles = filesToUpload
    .filter((item) => !item.file || !item.file.data || item.file.size === 0)
    .map((item) => item.name);

  // ---- Payment -------------------------------------------------------------
  await PaymentDB.create({
    application_id: (application as any).id,
    razorpay_order_id: razorpayOrderId,
    amount: 15100, // ₹151 in paise
    currency: 'INR',
    payment_reference: `PAY_${registrationData.applicationData.application_id}_${Date.now()}`,
    payment_type: 'vendor_registration',
  });

  await PaymentDB.updateByOrderId(razorpayOrderId, {
    razorpay_payment_id: razorpayPaymentId,
    status: 'success',
    payment_reference: razorpaySignature || razorpayPaymentId,
  });

  // ---- Application status ---------------------------------------------------
  await VendorApplicationDB.updateById((application as any).id, {
    payment_status: 'paid',
    status: 'under_review',
  });

  // ---- Subscription --------------------------------------------------------
  const currentDate = new Date();
  const expiryDate = new Date();
  expiryDate.setFullYear(currentDate.getFullYear() + 1);
  await VendorSubscriptionDB.create({
    vendor_id: registrationData.applicationData.vendor_id,
    application_id: (application as any).id,
    subscription_status: 'active',
    activated_at: currentDate,
    expires_at: expiryDate,
  });

  // ---- Audit ---------------------------------------------------------------
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
      registration_source: source,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      verified_at: new Date().toISOString(),
    },
  });

  // ---- Cleanup staged data -------------------------------------------------
  await PendingRegistrationDB.deleteByOrderId(razorpayOrderId);

  console.log(`[completeRegistration] (${source}) completed for vendor ${vendorId}`);

  return {
    created: true,
    vendorId,
    applicationId: applicationIdStr,
    email: registrationData.userData.email,
    temporaryPassword: registrationData.userData.temporaryPassword,
    uploadedFiles,
    skippedFiles,
  };
}
