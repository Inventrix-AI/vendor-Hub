import { NextRequest, NextResponse } from 'next/server';
import { VendorApplicationDB } from '@/lib/database';

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
    
    const applications = VendorApplicationDB.findAll(filters);
    return NextResponse.json(applications);
  }

  // Default: dashboard stats
  const stats = VendorApplicationDB.getStats();
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

    let updatedApplication: any = {
      id,
      status,
      updated_at: new Date().toISOString()
    };

    // If approved, generate vendor ID
    if (status === 'approved' && application_data) {
      const { IdGenerator } = await import('@/lib/vendorId');
      const vendorId = IdGenerator.vendorId(
        application_data.company_name,
        application_data.business_type
      );
      
      updatedApplication.vendor_id = vendorId;

      // Send approval notification
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'email',
            recipient: application_data.contact_email,
            templateId: 'application_approved',
            applicationId: id,
            data: {
              vendorName: application_data.company_name,
              applicationId: id,
              vendorId: vendorId
            }
          })
        });
      } catch (notificationError) {
        console.error('Failed to send approval notification:', notificationError);
      }
    }

    // If rejected, send rejection notification
    if (status === 'rejected' && application_data) {
      updatedApplication.rejection_reason = rejection_reason || 'Application requirements not met';

      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'email',
            recipient: application_data.contact_email,
            templateId: 'application_rejected',
            applicationId: id,
            data: {
              vendorName: application_data.company_name,
              applicationId: id,
              rejectionReason: updatedApplication.rejection_reason
            }
          })
        });
      } catch (notificationError) {
        console.error('Failed to send rejection notification:', notificationError);
      }
    }

    return NextResponse.json(updatedApplication);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}