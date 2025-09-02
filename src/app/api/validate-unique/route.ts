import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, value } = body;

    if (!type || !value) {
      return NextResponse.json(
        { error: 'Missing type or value' },
        { status: 400 }
      );
    }

    // Validate input format
    if (type === 'mobile' && !/^\+?[\d\s-()]+$/.test(value)) {
      return NextResponse.json(
        { error: 'Invalid mobile number format' },
        { status: 400 }
      );
    }

    if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    let query = '';
    let params = [value];

    switch (type) {
      case 'mobile':
        // Check both users and vendor_applications tables
        // Use COALESCE to handle cases where columns might not exist yet
        query = `
          SELECT 1 FROM (
            SELECT id FROM users WHERE COALESCE(phone, '') = $1 AND phone IS NOT NULL AND phone != ''
            UNION ALL
            SELECT id FROM vendor_applications WHERE COALESCE(phone, '') = $1 AND phone IS NOT NULL AND phone != ''
          ) AS combined
          LIMIT 1
        `;
        break;
      case 'email':
        // Check both users and vendor_applications tables
        query = `
          SELECT 1 FROM (
            SELECT id FROM users WHERE COALESCE(email, '') = $1 AND email IS NOT NULL AND email != ''
            UNION ALL
            SELECT id FROM vendor_applications WHERE COALESCE(contact_email, '') = $1 AND contact_email IS NOT NULL AND contact_email != ''
          ) AS combined
          LIMIT 1
        `;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid validation type' },
          { status: 400 }
        );
    }

    console.log(`Validating ${type}: ${value}`);
    const result = await executeQuery(query, params);
    const isUnique = result.rows.length === 0;

    console.log(`Validation result for ${type} ${value}: ${isUnique ? 'unique' : 'duplicate'}`);

    return NextResponse.json({ isUnique });

  } catch (error) {
    console.error('Validation API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : 
          undefined
      },
      { status: 500 }
    );
  }
}