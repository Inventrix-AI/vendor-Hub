import { NextRequest, NextResponse } from 'next/server';
import { IdGenerator } from '@/lib/vendorId';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { company_name, contact_email, phone, business_type } = data;

    // Validate required fields
    if (!company_name || !contact_email || !phone || !business_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique application ID
    const applicationId = IdGenerator.applicationId();

    const application = {
      id: applicationId,
      company_name,
      contact_email,
      phone,
      business_type,
      business_description: data.business_description || '',
      status: 'pending',
      submitted_at: new Date().toISOString(),
      documents: data.documents || [],
      payment_status: 'pending',
      payment_reference: null,
      vendor_id: null // Will be generated after approval
    };

    // Send application received notification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          recipient: contact_email,
          templateId: 'application_received',
          applicationId: applicationId,
          data: {
            vendorName: company_name,
            applicationId: applicationId
          }
        })
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Mock data for demo
  const vendors = [
    {
      id: 1,
      company_name: 'Tech Solutions Inc',
      contact_email: 'contact@techsolutions.com',
      phone: '+1234567890',
      business_type: 'Technology',
      status: 'approved',
      submitted_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      company_name: 'Green Supplies Co',
      contact_email: 'info@greensupplies.com',
      phone: '+1234567891',
      business_type: 'Environmental',
      status: 'pending',
      submitted_at: '2024-01-16T14:20:00Z'
    }
  ];

  return NextResponse.json(vendors);
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, status } = data;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing vendor ID or status' },
        { status: 400 }
      );
    }

    const updatedVendor = {
      id,
      status,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(updatedVendor);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}