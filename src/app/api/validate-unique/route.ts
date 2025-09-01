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

    let query = '';
    let params = [value];

    switch (type) {
      case 'mobile':
        query = 'SELECT id FROM users WHERE phone = $1';
        break;
      case 'email':
        query = 'SELECT id FROM users WHERE email = $1';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid validation type' },
          { status: 400 }
        );
    }

    const result = await executeQuery(query, params);
    const isUnique = result.rows.length === 0;

    return NextResponse.json({ isUnique });

  } catch (error) {
    console.error('Validation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}