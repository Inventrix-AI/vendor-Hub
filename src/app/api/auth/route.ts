import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/authService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Hardcoded users for Vercel deployment (demo purposes)
const DEMO_USERS = [
  {
    id: 1,
    email: 'admin@vendorhub.com',
    full_name: 'System Administrator',
    role: 'super_admin',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123
    is_active: 1
  },
  {
    id: 2,
    email: 'test@vendor.com',
    full_name: 'Test Vendor',
    role: 'vendor',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // test123
    is_active: 1
  }
];

// Check if we're in Vercel environment
const isVercelEnvironment = process.env.VERCEL || process.env.NODE_ENV === 'production';

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
      const loginIdentifier = username || email;
      if (!loginIdentifier || !password) {
        return NextResponse.json(
          { error: 'Missing credentials' },
          { status: 400 }
        );
      }

      try {
        let result: { user: any; token: string } | null;
        
        if (isVercelEnvironment) {
          // Use hardcoded users for Vercel deployment
          const user = DEMO_USERS.find(u => u.email === loginIdentifier);
          
          if (!user || !await bcrypt.compare(password, user.password_hash)) {
            return NextResponse.json(
              { error: 'Invalid credentials' },
              { status: 401 }
            );
          }

          // Generate JWT token
          const token = jwt.sign(
            { 
              userId: user.id, 
              email: user.email, 
              role: user.role 
            },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '24h' }
          );

          result = { user, token };
        } else {
          // Use database for local development - support both email and vendor ID login
          const { UserDB, VendorApplicationDB } = await import('@/lib/database');
          
          let user = null;
          
          // First try to find by email
          if (loginIdentifier.includes('@')) {
            user = UserDB.findByEmail(loginIdentifier);
          } else {
            // Try to find by vendor ID or application ID
            if (loginIdentifier.startsWith('PVS') || loginIdentifier.startsWith('APP')) {
              const application = VendorApplicationDB.findByApplicationId(loginIdentifier);
              if (application) {
                user = UserDB.findById(application.user_id);
              }
            }
          }
          
          if (!user || !await bcrypt.compare(password, user.password_hash)) {
            return NextResponse.json(
              { error: 'Invalid credentials' },
              { status: 401 }
            );
          }

          // Generate JWT token
          const token = jwt.sign(
            { 
              userId: user.id, 
              email: user.email, 
              role: user.role 
            },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '24h' }
          );

          result = { user, token };
        }
        
        if (!result) {
          return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          );
        }

        const { user, token } = result;

        return NextResponse.json({
          success: true,
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
        console.error('Login error:', error);
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