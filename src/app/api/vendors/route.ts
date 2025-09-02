import { NextRequest, NextResponse } from 'next/server';
import { IdGenerator } from '@/lib/vendorId';
import { VendorApplicationDB, AuditLogDB, UserDB, DocumentDB } from '@/lib/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { company_name, business_type } = data;

    // Validate required fields (simplified for street vendors)
    if (!company_name || !business_type) {
      return NextResponse.json(
        { error: 'Missing required fields: shop name and business type' },
        { status: 400 }
      );
    }

    // Generate unique IDs
    const applicationId = IdGenerator.applicationId();
    const vendorId = `PVS${Date.now().toString().slice(-6)}`;
    const temporaryPassword = Math.random().toString(36).slice(-8);

    // Create user account first
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    const user = await UserDB.create({
      email: `${vendorId.toLowerCase()}@pathvikreta.org`, // Auto-generated email
      password_hash: hashedPassword,
      full_name: company_name, // Use shop name as full name initially
      phone: data.phone || '', // Optional phone number
      role: 'vendor'
    });

    const applicationData = {
      application_id: applicationId,
      user_id: (user as any).id,
      vendor_id: vendorId,
      company_name,
      business_name: company_name,
      contact_email: (user as any).email,
      phone: data.phone || '',
      business_type,
      business_description: '',
      registration_number: null,
      tax_id: null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || 'Madhya Pradesh',
      postal_code: data.postal_code || null,
      country: 'India',
      bank_name: null,
      account_number: null,
      ifsc_code: null,
      routing_number: null
    };

    // Save to database
    const application = await VendorApplicationDB.create(applicationData);

    // Log the action
    await AuditLogDB.create({
      application_id: (application as any).id,
      user_id: (user as any).id,
      action: 'Vendor Registration',
      entity_type: 'application',
      entity_id: (application as any).id,
      new_values: {
        ...applicationData,
        vendor_id: vendorId,
        temporary_password: temporaryPassword
      }
    });

    const response = {
      success: true,
      application_id: applicationId,
      vendor_id: vendorId,
      email: (user as any).email,
      temporary_password: temporaryPassword,
      status: 'pending',
      submitted_at: (application as any).created_at,
      message: 'Registration successful. Please use your Vendor ID and password to login.',
      instructions: {
        en: 'Your account has been created successfully. You can login with your Vendor ID and the provided password.',
        hi: 'आपका खाता सफलतापूर्वक बनाया गया है। आप अपने विक्रेता ID और दिए गए पासवर्ड से लॉगिन कर सकते हैं।'
      }
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Vendor registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

function getUserFromToken(request: NextRequest): { id: number; email: string } | null {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('access_token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
    return { id: decoded.userId || decoded.user_id, email: decoded.email };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('id');
    
    // Get authenticated user
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (applicationId) {
      // Get specific application
      const application = VendorApplicationDB.findByApplicationId(applicationId);
      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
      
      // Check if user owns this application (for security)
      if ((application as any).user_id !== (user as any).id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      
      // Add documents to the application
      const documents = await DocumentDB.findByApplicationId((application as any).id);
      const applicationWithDocs = {
        ...(application as any),
        documents
      };
      
      return NextResponse.json(applicationWithDocs);
    }

    // Get applications for the current user only
    const applications = VendorApplicationDB.findByUserId(user.id);
    return NextResponse.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
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