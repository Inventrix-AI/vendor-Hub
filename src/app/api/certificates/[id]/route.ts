import { NextRequest, NextResponse } from 'next/server';
import { VendorApplicationDB, CertificateDB, DocumentDB } from '@/lib/db';
import { generateIDCardPNG, imageUrlToBase64 } from '@/lib/certificateGenerator';
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
      console.log('[ID Card] Found documents:', documents.map((d: any) => ({
        type: d.document_type,
        hasUrl: !!d.file_url
      })));

      // Look for photo document - check multiple possible names
      const passportPhoto = documents.find((doc: any) => {
        const docType = doc.document_type.toLowerCase();
        return docType.includes('passport') ||
               docType.includes('photo') ||
               docType.includes('picture') ||
               docType.includes('image') ||
               docType === 'vendor_photo' ||
               docType === 'profile_photo';
      });

      console.log('[ID Card] Found photo document:', passportPhoto ? passportPhoto.document_type : 'none');

      if (passportPhoto && passportPhoto.file_url) {
        // Get signed URL from Supabase if using Supabase storage
        if (passportPhoto.file_url.includes('supabase')) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          // Extract bucket and path from the URL
          const urlParts = passportPhoto.file_url.split('/storage/v1/object/public/');
          if (urlParts.length > 1) {
            const pathParts = urlParts[1].split('/');
            const bucket = pathParts[0];
            const filePath = pathParts.slice(1).join('/');

            const { data } = await supabase.storage
              .from(bucket)
              .createSignedUrl(filePath, 3600); // 1 hour validity

            if (data?.signedUrl) {
              vendorPhotoBase64 = await imageUrlToBase64(data.signedUrl);
            }
          }
        } else {
          // Direct URL
          vendorPhotoBase64 = await imageUrlToBase64(passportPhoto.file_url);
        }
      }
    } catch (photoError) {
      console.error('Error fetching vendor photo:', photoError);
      // Continue without photo - it will use placeholder
    }

    // Prepare ID card data
    const idCardData = {
      certificateNumber: certificate.certificate_number,
      vendorId: (application as any).vendor_id || certificate.vendor_id,
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
      vendorPhotoBase64
    };

    // Generate PNG ID Card
    const pngBuffer = await generateIDCardPNG(idCardData);

    // Update download count
    await CertificateDB.incrementDownloadCount(certificate.id);

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pngBuffer);

    // Return PNG as response
    const response = new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="IDCard-${certificate.vendor_id}.png"`,
        'Content-Length': pngBuffer.byteLength.toString(),
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
