import { NextRequest, NextResponse } from 'next/server';
import { VendorApplicationDB, CertificateDB, DocumentDB } from '@/lib/db';
import { generateIDCardPDF, imageUrlToBase64 } from '@/lib/certificateGenerator';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getUserFromToken(request: NextRequest): { id: number; email: string; role: string } | null {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('access_token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as any;
    return { id: decoded.userId || decoded.user_id, email: decoded.email, role: decoded.role };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the certificate
    const certificate = await CertificateDB.findById(parseInt(id));

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Check certificate status
    if (certificate.status === 'revoked') {
      return NextResponse.json(
        { error: 'Certificate has been revoked' },
        { status: 400 }
      );
    }

    // Get the associated application
    const application = await VendorApplicationDB.findById(certificate.application_id);

    if (!application) {
      return NextResponse.json(
        { error: 'Associated application not found' },
        { status: 404 }
      );
    }

    // Check if user has permission (admin or application owner)
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const isOwner = (application as any).user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get vendor's passport photo
    let vendorPhotoBase64: string | undefined;
    try {
      const documents = await DocumentDB.findByApplicationId(certificate.application_id);
      console.log('[ID Card] Found documents for application:', certificate.application_id);

      // Look for vendor's personal photo (NOT shop_photo)
      // ONLY match exact types: passport_photo or photo
      const passportPhoto = documents.find((doc: any) => {
        const docType = doc.document_type.toLowerCase();
        // ONLY exact matches for personal vendor photo
        // Explicitly exclude shop_photo
        return (docType === 'passport_photo' || docType === 'photo') &&
               !docType.includes('shop');
      });

      // Debug: Log all documents found
      console.log('[ID Card] Documents found:', documents.map((d: any) => ({
        id: d.id,
        type: d.document_type,
        storage_url: d.storage_url,
        file_path: d.file_path
      })));

      if (passportPhoto) {
        // Use storage_url (correct column name from DB schema)
        const photoUrl = passportPhoto.storage_url || passportPhoto.file_url;
        console.log('[ID Card] Found photo document:', {
          document_type: passportPhoto.document_type,
          storage_url: passportPhoto.storage_url,
          file_path: passportPhoto.file_path,
          photoUrl: photoUrl
        });

        if (photoUrl) {
          console.log('[ID Card] Processing photo URL...');

          // Since Supabase storage is public, we can use the public URL directly
          // No need for signed URLs if the bucket is public
          try {
            console.log('[ID Card] Fetching photo from:', photoUrl.substring(0, 80) + '...');
            vendorPhotoBase64 = await imageUrlToBase64(photoUrl);
            console.log('[ID Card] ✅ Photo converted to base64, length:', vendorPhotoBase64?.length || 0);

            if (!vendorPhotoBase64 || vendorPhotoBase64.length === 0) {
              console.error('[ID Card] ❌ Photo base64 is empty!');
            }
          } catch (photoFetchError) {
            console.error('[ID Card] ❌ Failed to fetch/convert photo:', photoFetchError);

            // Fallback: Try with signed URL if direct access fails
            try {
              if (photoUrl.includes('supabase')) {
                console.log('[ID Card] Trying signed URL approach...');
                const supabase = createClient(supabaseUrl, supabaseServiceKey);

                const urlParts = photoUrl.split('/storage/v1/object/public/');
                if (urlParts.length > 1) {
                  const pathParts = urlParts[1].split('/');
                  const bucket = pathParts[0];
                  const filePath = pathParts.slice(1).join('/');

                  console.log('[ID Card] Bucket:', bucket, 'Path:', filePath);

                  const { data, error } = await supabase.storage
                    .from(bucket)
                    .createSignedUrl(filePath, 3600);

                  if (error) {
                    console.error('[ID Card] Signed URL error:', error);
                  } else if (data?.signedUrl) {
                    console.log('[ID Card] Got signed URL, retrying...');
                    vendorPhotoBase64 = await imageUrlToBase64(data.signedUrl);
                    console.log('[ID Card] ✅ Photo fetched via signed URL, length:', vendorPhotoBase64?.length || 0);
                  }
                }
              }
            } catch (signedUrlError) {
              console.error('[ID Card] Signed URL fallback also failed:', signedUrlError);
            }
          }
        } else {
          console.log('[ID Card] Photo document found but no URL available');
        }
      } else {
        console.log('[ID Card] No passport photo document found');
      }
    } catch (photoError) {
      console.error('[ID Card] Error fetching vendor photo:', photoError);
      // Continue without photo
    }

    // Prepare ID card data
    // Use vendor_id (PVS format) as the primary ID on the certificate
    // Check multiple possible field names for vendor ID
    // Priority: certificate.vendor_id (most reliable) > application.vendor_id
    const appData = application as any;

    console.log('[ID Card] Checking vendor IDs:', {
      cert_vendor_id: certificate.vendor_id,
      app_vendor_id: appData.vendor_id,
      app_vendorId: appData.vendorId,
    });

    // Find the best vendor ID - prefer certificate's vendor_id as it's set during approval
    let vendorIdForCert: string;
    const certVendorId = certificate.vendor_id;
    const appVendorId = appData.vendor_id || appData.vendorId;

    if (certVendorId && certVendorId.startsWith('PVS')) {
      // Certificate has a valid PVS vendor ID
      vendorIdForCert = certVendorId;
    } else if (appVendorId && appVendorId.startsWith('PVS')) {
      // Application has a valid PVS vendor ID
      vendorIdForCert = appVendorId;
    } else if (certVendorId && certVendorId.length > 5) {
      // Certificate has some vendor ID (not PVS format but long enough)
      vendorIdForCert = certVendorId;
    } else if (appVendorId && appVendorId.length > 5) {
      // Application has some vendor ID
      vendorIdForCert = appVendorId;
    } else {
      // Fallback: Generate PVS format with 6-digit padded application ID
      vendorIdForCert = `PVS${String(appData.id || Date.now()).slice(-6).padStart(6, '0')}`;
    }

    console.log('[ID Card] Using vendor ID for cert:', vendorIdForCert);
    console.log('[ID Card] Application data:', {
      vendor_id: appData.vendor_id,
      vendorId: appData.vendorId,
      cert_vendor_id: certificate.vendor_id,
      business_type: appData.business_type,
      business_name: appData.business_name,
      user_full_name: appData.user_full_name
    });

    const idCardData = {
      certificateNumber: certificate.certificate_number,
      vendorId: vendorIdForCert,
      vendorName: (application as any).user_full_name || (application as any).company_name || 'Vendor',
      businessName: (application as any).business_name || (application as any).company_name || 'Business',
      businessType: (application as any).business_type || 'General',
      address: (application as any).address || '',
      city: (application as any).city || '',
      state: (application as any).state || '',
      postalCode: (application as any).postal_code || '',
      country: (application as any).country || 'India',
      phone: (application as any).user_phone || (application as any).phone || '',
      registrationNumber: (application as any).registration_number,
      issuedAt: new Date(certificate.issued_at),
      validUntil: new Date(certificate.valid_until),
      vendorPhotoBase64,
      certificateType: certificate.certificate_type || 'mp' // Pass certificate type for template selection
    };

    console.log('[ID Card] Generating PDF with type:', certificate.certificate_type);

    // Generate PDF ID Card
    const pdfBuffer = await generateIDCardPDF(idCardData);

    // Update download count
    await CertificateDB.incrementDownloadCount(certificate.id);

    // Convert ArrayBuffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pdfBuffer);

    // Generate filename based on certificate type
    const certType = certificate.certificate_type || 'mp';
    const certTypeLabel = certType === 'mp' ? 'MP' :
                         certType === 'mahila_ekta' ? 'MahilaEkta' :
                         certType.charAt(0).toUpperCase() + certType.slice(1);
    const filename = `${certTypeLabel}-Certificate-${certificate.vendor_id}.pdf`;

    // Return PDF as response
    const response = new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });

    return response;
  } catch (error) {
    console.error('ID Card download error:', error);
    return NextResponse.json(
      { error: 'Failed to download ID card', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
