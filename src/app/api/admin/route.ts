import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'applications') {
    const applications = [
      {
        id: 1,
        company_name: 'Tech Solutions Inc',
        contact_email: 'contact@techsolutions.com',
        business_type: 'Technology',
        status: 'pending',
        submitted_at: '2024-01-15T10:30:00Z',
        documents: ['business_license.pdf', 'tax_certificate.pdf']
      },
      {
        id: 2,
        company_name: 'Green Supplies Co',
        contact_email: 'info@greensupplies.com',
        business_type: 'Environmental',
        status: 'approved',
        submitted_at: '2024-01-16T14:20:00Z',
        documents: ['license.pdf']
      }
    ];

    return NextResponse.json(applications);
  }

  // Default: dashboard stats
  const stats = {
    total_applications: 15,
    pending_applications: 8,
    approved_applications: 5,
    rejected_applications: 2
  };

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