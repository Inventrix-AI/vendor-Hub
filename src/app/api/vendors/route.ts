import { NextRequest, NextResponse } from 'next/server';

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

    const application = {
      id: Date.now(),
      company_name,
      contact_email,
      phone,
      business_type,
      business_description: data.business_description || '',
      status: 'pending',
      submitted_at: new Date().toISOString(),
      documents: data.documents || []
    };

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