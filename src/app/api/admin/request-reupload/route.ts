import { NextRequest, NextResponse } from 'next/server';
import { DocumentDB, VendorApplicationDB, AuditLogDB } from '@/lib/db';
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
    const { documentId, applicationId, documentType, reason } = data;

    // Either documentId or (applicationId + documentType) must be provided
    if (!documentId && (!applicationId || !documentType)) {
      return NextResponse.json(
        { error: 'Missing documentId or applicationId/documentType' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    let document: any;
    let application: any;

    if (documentId) {
      // Get the document by ID
      document = await DocumentDB.findById(parseInt(documentId));
      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
    }

    // Get the application details for notification
    if (applicationId) {
      application = await VendorApplicationDB.findByApplicationId(applicationId);
    } else if (document) {
      // Get application from document
      const appResult = await VendorApplicationDB.findByApplicationId(document.application_id.toString());
      application = appResult;
    }

    // Request re-upload for the document
    let updatedDocument;
    if (document) {
      updatedDocument = await DocumentDB.requestReupload(
        document.id,
        reason,
        user.id
      );
    }

    // Log the action
    await AuditLogDB.create({
      application_id: document?.application_id || (application?.id),
      user_id: user.id,
      action: `Document Re-upload Requested - ${documentType || document?.document_type}`,
      entity_type: 'document',
      entity_id: document?.id,
      new_values: {
        reupload_requested: true,
        reupload_reason: reason,
        requested_by: user.email,
        document_type: documentType || document?.document_type
      }
    });

    // Send notification email to vendor
    if (application) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'email',
            recipient: application.contact_email || application.user_email,
            templateId: 'document_reupload_requested',
            applicationId: application.application_id,
            data: {
              vendorName: application.company_name || application.business_name,
              applicationId: application.application_id,
              documentType: documentType || document?.document_type,
              reason: reason
            }
          })
        });
      } catch (notificationError) {
        console.error('Failed to send re-upload notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument,
      message: 'Re-upload request sent successfully'
    });
  } catch (error) {
    console.error('Request re-upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
