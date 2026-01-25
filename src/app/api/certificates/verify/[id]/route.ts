import { NextRequest, NextResponse } from 'next/server';
import { VendorApplicationDB, CertificateDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find certificate by certificate number
    const certificate = await CertificateDB.findByCertificateNumber(id);

    if (!certificate) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Certificate not found',
          message: 'This certificate number does not exist in our records.'
        },
        { status: 404 }
      );
    }

    // Get the associated application
    const application = await VendorApplicationDB.findById(certificate.application_id);

    // Check if certificate is still valid
    const now = new Date();
    const validUntil = new Date(certificate.valid_until);
    const isExpired = now > validUntil;
    const isRevoked = certificate.status === 'revoked';

    // Determine validity status
    let valid = true;
    let status = 'active';
    let message = 'This certificate is valid and active.';

    if (isRevoked) {
      valid = false;
      status = 'revoked';
      message = 'This certificate has been revoked.';
    } else if (isExpired) {
      valid = false;
      status = 'expired';
      message = 'This certificate has expired.';
    }

    // Build response with limited public information
    const response = {
      valid,
      status,
      message,
      certificate: {
        certificate_number: certificate.certificate_number,
        certificate_type: certificate.certificate_type || 'mp',
        vendor_id: certificate.vendor_id,
        vendor_name: application ?
          ((application as any).user_full_name || (application as any).company_name || 'N/A') : 'N/A',
        business_name: application ?
          ((application as any).business_name || (application as any).company_name || 'N/A') : 'N/A',
        business_type: application ? ((application as any).business_type || 'N/A') : 'N/A',
        city: application ? ((application as any).city || 'N/A') : 'N/A',
        state: application ? ((application as any).state || 'N/A') : 'N/A',
        issued_at: certificate.issued_at,
        valid_until: certificate.valid_until,
      }
    };

    // Add revocation info if applicable
    if (isRevoked && certificate.revoked_at) {
      (response as any).revoked_at = certificate.revoked_at;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Certificate verification error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Failed to verify certificate',
        message: 'An error occurred while verifying the certificate.'
      },
      { status: 500 }
    );
  }
}
