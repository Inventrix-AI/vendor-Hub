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
    const { id, status } = data;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing application ID or status' },
        { status: 400 }
      );
    }

    const updatedApplication = {
      id,
      status,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(updatedApplication);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}