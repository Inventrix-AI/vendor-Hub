import { NextRequest, NextResponse } from 'next/server';
import { VendorApplicationDB, AuditLogDB } from '@/lib/db';
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

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const data = await request.json();
    const { applicationId, section, notes } = data;

    if (!applicationId || !section) {
      return NextResponse.json(
        { error: 'Missing applicationId or section' },
        { status: 400 }
      );
    }

    if (section !== 'personal' && section !== 'business') {
      return NextResponse.json(
        { error: 'Invalid section. Must be "personal" or "business"' },
        { status: 400 }
      );
    }

    // Update verification status
    const updatedApplication = await VendorApplicationDB.updateVerification(
      applicationId,
      section,
      user.id,
      notes
    );

    if (!updatedApplication) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Log the verification action
    await AuditLogDB.create({
      application_id: updatedApplication.id,
      user_id: user.id,
      action: `${section.charAt(0).toUpperCase() + section.slice(1)} Verification Completed`,
      entity_type: 'application',
      entity_id: updatedApplication.id,
      new_values: {
        section,
        verified: true,
        verified_by: user.email,
        notes
      }
    });

    return NextResponse.json({
      success: true,
      application: updatedApplication
    });
  } catch (error) {
    console.error('Verify section error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Missing applicationId' },
        { status: 400 }
      );
    }

    // Get verification status
    const verificationStatus = await VendorApplicationDB.getVerificationStatus(applicationId);

    if (!verificationStatus) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(verificationStatus);
  } catch (error) {
    console.error('Get verification status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
