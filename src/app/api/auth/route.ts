import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/authService';

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

      try {
        const { user, token } = await AuthService.register({
          email,
          password,
          full_name,
          role: 'vendor'
        });

        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            is_active: user.is_active
          },
          access_token: token,
          token_type: 'bearer'
        }, { status: 201 });
      } catch (error) {
        if ((error as Error).message === 'User already exists') {
          return NextResponse.json(
            { error: 'User already exists' },
            { status: 409 }
          );
        }
        throw error;
      }
    }

    if (action === 'login') {
      const loginEmail = username || email;
      if (!loginEmail || !password) {
        return NextResponse.json(
          { error: 'Missing credentials' },
          { status: 400 }
        );
      }

      try {
        const result = await AuthService.login(loginEmail, password);
        
        if (!result) {
          return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          );
        }

        const { user, token } = result;

        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            is_active: user.is_active
          },
          access_token: token,
          token_type: 'bearer'
        });
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Auth API error:', error);
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