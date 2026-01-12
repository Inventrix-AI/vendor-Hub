import { NextRequest, NextResponse } from 'next/server';
import { VendorApplicationDB, CertificateDB, DocumentDB, AuditLogDB } from '@/lib/db';
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
    // Authenticate user
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        { error: 'Certificate can only be generated for approved applications' },
        { status: 400 }
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

    // Check if certificate already exists
    const existingCertificate = await CertificateDB.findByApplicationId((application as any).id);

    if (existingCertificate) {
      return NextResponse.json({
        success: true,
        certificate: existingCertificate,
        message: 'Certificate already exists'
      });
    }

    // Generate certificate number
    const certificateNumber = await CertificateDB.generateCertificateNumber();

    // Calculate validity (1 year from now)
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    // Create certificate record
    const certificate = await CertificateDB.create({
      certificate_number: certificateNumber,
      application_id: (application as any).id,
      vendor_id: (application as any).vendor_id,
      valid_until: validUntil,
      issued_by: user.id
    });

    // Log the action
    await AuditLogDB.create({
      application_id: (application as any).id,
      user_id: user.id,
      action: 'Certificate Generated',
      entity_type: 'certificate',
      entity_id: certificate.id,
      new_values: {
        certificate_number: certificateNumber,
        vendor_id: (application as any).vendor_id,
        valid_until: validUntil.toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        certificate_number: certificate.certificate_number,
        vendor_id: certificate.vendor_id,
        issued_at: certificate.issued_at,
        valid_until: certificate.valid_until,
        status: certificate.status
      }
    });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}
