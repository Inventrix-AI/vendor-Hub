import { NextRequest, NextResponse } from 'next/server';
import { DocumentDB, AuditLogDB } from '@/lib/db';
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

    // Check if user is admin
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const data = await request.json();
    const { documentId, reason, status } = data;

    // For verification, reason is optional; for flagging, reason is required
    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing documentId' },
        { status: 400 }
      );
    }

    // If status is 'verified', we're verifying the document (no reason needed)
    // Otherwise, we're flagging (reason required)
    const isVerification = status === 'verified';

    if (!isVerification && !reason) {
      return NextResponse.json(
        { error: 'Missing reason for flagging document' },
        { status: 400 }
      );
    }

    // Get the document first to check if it exists
    const document = await DocumentDB.findById(parseInt(documentId));
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    let updatedDocument;

    if (isVerification) {
      // Verify the document
      updatedDocument = await DocumentDB.verifyDocument(
        parseInt(documentId),
        user.id
      );

      // Log the verification action
      await AuditLogDB.create({
        application_id: (document as any).application_id,
        user_id: user.id,
        action: `Document Verified - ${(document as any).document_type}`,
        entity_type: 'document',
        entity_id: parseInt(documentId),
        old_values: {
          verification_status: (document as any).verification_status
        },
        new_values: {
          verification_status: 'verified',
          verified_by: user.email
        }
      });
    } else {
      // Flag the document
      updatedDocument = await DocumentDB.flagDocument(
        parseInt(documentId),
        reason,
        user.id
      );

      // Log the flag action
      await AuditLogDB.create({
        application_id: (document as any).application_id,
        user_id: user.id,
        action: `Document Flagged - ${(document as any).document_type}`,
        entity_type: 'document',
        entity_id: parseInt(documentId),
        old_values: {
          verification_status: (document as any).verification_status
        },
        new_values: {
          verification_status: 'flagged',
          flag_reason: reason,
          flagged_by: user.email
        }
      });
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument
    });
  } catch (error) {
    console.error('Flag document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
