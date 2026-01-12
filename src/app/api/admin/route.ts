import { NextRequest, NextResponse } from 'next/server';
import { VendorApplicationDB, DocumentDB, executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'applications') {
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    
    const filters: any = {};
    if (status) filters.status = status;
    if (search) filters.search = search;
    if (limit) filters.limit = parseInt(limit);
    
    const applications = await VendorApplicationDB.findAll(filters);
    return NextResponse.json(applications);
  }

  // Debug endpoint to check pending_registrations table
  if (type === 'debug-pending-registrations') {
    try {
      const pendingRegs = await executeQuery(`
        SELECT
          id,
          razorpay_order_id,
          application_id,
          vendor_id,
          created_at,
          expires_at,
          registration_data->'files' as files_info
        FROM pending_registrations
        ORDER BY created_at DESC
        LIMIT 10
      `);

      // Check file data structure for each registration
      const regDetails = pendingRegs.rows.map((reg: any) => {
        const filesInfo = reg.files_info || {};
        return {
          ...reg,
          files_analysis: {
            id_document: filesInfo.id_document ? {
              has_data: !!filesInfo.id_document.data,
              name: filesInfo.id_document.name,
              size: filesInfo.id_document.size,
              type: filesInfo.id_document.type,
              data_length: filesInfo.id_document.data?.length || 0
            } : null,
            photo: filesInfo.photo ? {
              has_data: !!filesInfo.photo.data,
              name: filesInfo.photo.name,
              size: filesInfo.photo.size,
              type: filesInfo.photo.type,
              data_length: filesInfo.photo.data?.length || 0
            } : null,
            shop_document: filesInfo.shop_document ? {
              has_data: !!filesInfo.shop_document.data,
              name: filesInfo.shop_document.name,
              size: filesInfo.shop_document.size,
              type: filesInfo.shop_document.type,
              data_length: filesInfo.shop_document.data?.length || 0
            } : null,
            shop_photo: filesInfo.shop_photo ? {
              has_data: !!filesInfo.shop_photo.data,
              name: filesInfo.shop_photo.name,
              size: filesInfo.shop_photo.size,
              type: filesInfo.shop_photo.type,
              data_length: filesInfo.shop_photo.data?.length || 0
            } : null
          }
        };
      });

      return NextResponse.json({
        count: pendingRegs.rows.length,
        registrations: regDetails,
        message: 'Pending registrations (last 10)'
      });
    } catch (error) {
      console.error('[Debug Pending Registrations] Error:', error);
      return NextResponse.json({ error: 'Debug query failed', details: String(error) }, { status: 500 });
    }
  }

  // Debug endpoint to show ALL documents in the database
  if (type === 'debug-all-documents') {
    try {
      const allDocs = await executeQuery(`
        SELECT d.id, d.application_id, d.document_type, d.file_name, d.is_current,
               va.application_id as string_app_id
        FROM documents d
        LEFT JOIN vendor_applications va ON d.application_id = va.id
        ORDER BY d.id DESC
        LIMIT 50
      `);

      return NextResponse.json({
        totalDocuments: allDocs.rows.length,
        documents: allDocs.rows,
        message: 'All documents in database (last 50)'
      });
    } catch (error) {
      console.error('[Debug All Documents] Error:', error);
      return NextResponse.json({ error: 'Debug query failed', details: String(error) }, { status: 500 });
    }
  }

  // Debug endpoint to check document data
  if (type === 'debug-documents') {
    const applicationId = searchParams.get('id');
    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    try {
      // Get all documents (including soft-deleted)
      const allDocs = await executeQuery(`
        SELECT d.*, va.application_id as string_app_id, va.id as numeric_app_id
        FROM documents d
        LEFT JOIN vendor_applications va ON d.application_id = va.id
        WHERE va.application_id = $1
      `, [applicationId]);

      // Get count of documents per is_current status
      const docStats = await executeQuery(`
        SELECT d.is_current, COUNT(*) as count
        FROM documents d
        JOIN vendor_applications va ON d.application_id = va.id
        WHERE va.application_id = $1
        GROUP BY d.is_current
      `, [applicationId]);

      // Get total documents in the entire database
      const totalDocs = await executeQuery(`
        SELECT COUNT(*) as total FROM documents
      `);

      // Get documents without matching application
      const orphanedDocs = await executeQuery(`
        SELECT d.id, d.application_id, d.document_type, d.file_name, d.is_current
        FROM documents d
        LEFT JOIN vendor_applications va ON d.application_id = va.id
        WHERE va.id IS NULL
      `);

      return NextResponse.json({
        applicationId,
        allDocuments: allDocs.rows,
        documentStats: docStats.rows,
        totalDocsInDatabase: totalDocs.rows[0]?.total || 0,
        orphanedDocuments: orphanedDocs.rows,
        message: 'Debug info for documents'
      });
    } catch (error) {
      console.error('[Debug Documents] Error:', error);
      return NextResponse.json({ error: 'Debug query failed', details: String(error) }, { status: 500 });
    }
  }

  if (type === 'application') {
    const applicationId = searchParams.get('id');
    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    const application = await VendorApplicationDB.findByApplicationId(applicationId);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // DEBUG: Log the application's numeric ID being used for document lookup
    console.log('[Admin API] Looking up documents for application:', {
      applicationId: applicationId,
      numericId: (application as any).id,
      userId: (application as any).user_id
    });

    // Get documents for this application
    const documents = await DocumentDB.findByApplicationId((application as any).id);

    // DEBUG: Log the documents found
    console.log('[Admin API] Documents found:', {
      count: documents?.length || 0,
      documentIds: documents?.map((d: any) => d.id)
    });

    // Return application with documents
    const applicationWithDocs = {
      ...(application as any),
      documents
    };

    return NextResponse.json(applicationWithDocs);
  }

  // Default: dashboard stats
  const stats = await VendorApplicationDB.getStats();
  return NextResponse.json(stats);
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, status, rejection_reason, application_data } = data;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing application ID or status' },
        { status: 400 }
      );
    }

    // Fetch the application data if not provided
    let appData = application_data;
    if (!appData) {
      const existingApp = await VendorApplicationDB.findByApplicationId(id);
      if (!existingApp) {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }
      appData = existingApp;
    }

    let updatedApplication: any = {
      status
    };

    // If approved, generate vendor ID
    if (status === 'approved') {
      const { IdGenerator } = await import('@/lib/vendorId');
      const vendorId = IdGenerator.vendorId(
        (appData as any).company_name || (appData as any).business_name || 'Vendor',
        (appData as any).business_type || 'General'
      );

      updatedApplication.vendor_id = vendorId;

      // Send approval notification
      try {
        const contactEmail = (appData as any).contact_email || (appData as any).user_email;
        if (contactEmail) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'email',
              recipient: contactEmail,
              templateId: 'application_approved',
              applicationId: id,
              data: {
                vendorName: (appData as any).company_name || (appData as any).business_name,
                applicationId: id,
                vendorId: vendorId
              }
            })
          });
        }
      } catch (notificationError) {
        console.error('Failed to send approval notification:', notificationError);
      }
    }

    // If rejected, send rejection notification
    if (status === 'rejected') {
      updatedApplication.rejection_reason = rejection_reason || 'Application requirements not met';

      try {
        const contactEmail = (appData as any).contact_email || (appData as any).user_email;
        if (contactEmail) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'email',
              recipient: contactEmail,
              templateId: 'application_rejected',
              applicationId: id,
              data: {
                vendorName: (appData as any).company_name || (appData as any).business_name,
                applicationId: id,
                rejectionReason: updatedApplication.rejection_reason
              }
            })
          });
        }
      } catch (notificationError) {
        console.error('Failed to send rejection notification:', notificationError);
      }
    }

    // Update the application in the database
    const result = await VendorApplicationDB.update(id, updatedApplication);

    return NextResponse.json(result || { ...updatedApplication, application_id: id });
  } catch (error) {
    console.error('Admin PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}