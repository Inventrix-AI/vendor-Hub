import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, full_name, username } = body;

    if (action === 'register') {
      if (!email || !password || !full_name) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const user = {
        id: Date.now(),
        email,
        full_name,
        role: 'vendor',
        is_active: true
      };

      return NextResponse.json(user, { status: 201 });
    }

    if (action === 'login') {
      const loginEmail = username || email;
      if (!loginEmail || !password) {
        return NextResponse.json(
          { error: 'Missing credentials' },
          { status: 400 }
        );
      }

      // Simple token generation (use proper JWT in production)
      const token = Buffer.from(`${loginEmail}:${Date.now()}`).toString('base64');

      return NextResponse.json({
        access_token: token,
        token_type: 'bearer'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}