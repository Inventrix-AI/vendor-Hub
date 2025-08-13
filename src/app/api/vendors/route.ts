import { NextRequest, NextResponse } from 'next/server';
import { IdGenerator } from '@/lib/vendorId';
import { VendorApplicationDB, AuditLogDB } from '@/lib/database';

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

    // For now, using a mock user ID (1) - in production, get from JWT token
    const userId = 1;

    const applicationData = {
      application_id: applicationId,
      user_id: userId,
      company_name,
      contact_email,
      phone,
      business_type,
      business_description: data.business_description || '',
      registration_number: data.registration_number,
      tax_id: data.tax_id,
      address: data.address,
      city: data.city,
      state: data.state,
      postal_code: data.postal_code,
      country: data.country,
      bank_name: data.bank_name,
      account_number: data.account_number,
      ifsc_code: data.ifsc_code,
      routing_number: data.routing_number
    };

    // Save to database
    const result = VendorApplicationDB.create(applicationData);
    
    // Log the action
    AuditLogDB.create({
      application_id: result.lastInsertRowid as number,
      user_id: userId,
      action: 'Application Submitted',
      entity_type: 'application',
      entity_id: result.lastInsertRowid as number,
      new_values: applicationData
    });

    const application = {
      id: applicationId,
      ...applicationData,
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const applicationId = searchParams.get('id');
  
  if (applicationId) {
    // Get specific application
    const application = VendorApplicationDB.findByApplicationId(applicationId);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json(application);
  }
  
  // Get all applications for the user (mock user ID 1 for now)
  const userId = 1;
  const applications = VendorApplicationDB.findByUserId(userId);
  return NextResponse.json(applications);
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