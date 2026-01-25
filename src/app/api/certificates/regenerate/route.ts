import { NextRequest, NextResponse } from 'next/server';
import { VendorApplicationDB, CertificateDB, AuditLogDB } from '@/lib/db';
import { determineCertificateTypes } from '@/lib/certificateGenerator';
import jwt from 'jsonwebtoken';

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

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (admin only)
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
    }

    const data = await request.json();
    const { applicationId } = data;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Get the application
    const application = await VendorApplicationDB.findByApplicationId(applicationId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if application is approved
    if ((application as any).status !== 'approved') {
      return NextResponse.json(
        { error: 'Certificates can only be generated for approved applications' },
        { status: 400 }
      );
    }

    const appData = application as any;

    // Delete existing certificates for this application
    const existingCertificates = await CertificateDB.findAllByApplicationId(appData.id);

    if (existingCertificates && existingCertificates.length > 0) {
      console.log('[Certificate Regeneration] Deleting existing certificates:', existingCertificates.length);

      for (const cert of existingCertificates) {
        await CertificateDB.updateStatus(cert.id, 'revoked', 'Regenerating certificates with updated logic');

        await AuditLogDB.create({
          application_id: appData.id,
          user_id: user.id,
          action: `Certificate Revoked for Regeneration - ${cert.certificate_type}`,
          entity_type: 'certificate',
          entity_id: cert.id,
          old_values: {
            certificate_number: cert.certificate_number,
            certificate_type: cert.certificate_type,
            status: 'active'
          },
          new_values: {
            status: 'revoked',
            revoked_reason: 'Regenerating certificates with updated logic'
          }
        });
      }
    }

    // Determine which certificate types to generate based on gender and city
    const gender = appData.gender || 'male'; // Default to male if not specified
    const city = appData.city || '';

    const certificateTypes = determineCertificateTypes(gender, city);
    console.log('[Certificate Regeneration] Generating new certificates:', {
      applicationId,
      gender,
      city,
      types: certificateTypes
    });

    // Calculate validity (1 year from now)
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    // Create new certificate records for each type
    const certificates = [];
    for (const certType of certificateTypes) {
      // Generate unique certificate number for each certificate
      const certificateNumber = await CertificateDB.generateCertificateNumber();

      const certificate = await CertificateDB.create({
        certificate_number: certificateNumber,
        application_id: appData.id,
        vendor_id: appData.vendor_id,
        valid_until: validUntil,
        issued_by: user.id,
        certificate_type: certType
      });

      certificates.push(certificate);

      // Log the action
      await AuditLogDB.create({
        application_id: appData.id,
        user_id: user.id,
        action: `Certificate Generated (Regeneration) - ${certType}`,
        entity_type: 'certificate',
        entity_id: certificate.id,
        new_values: {
          certificate_number: certificateNumber,
          certificate_type: certType,
          vendor_id: appData.vendor_id,
          valid_until: validUntil.toISOString()
        }
      });
    }

    return NextResponse.json({
      success: true,
      certificates: certificates.map(cert => ({
        id: cert.id,
        certificate_number: cert.certificate_number,
        certificate_type: cert.certificate_type,
        vendor_id: cert.vendor_id,
        issued_at: cert.issued_at,
        valid_until: cert.valid_until,
        status: cert.status
      })),
      message: `Successfully regenerated ${certificates.length} certificate(s)`,
      regenerated: true,
      oldCertificatesRevoked: existingCertificates?.length || 0
    });
  } catch (error) {
    console.error('Certificate regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate certificates', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
