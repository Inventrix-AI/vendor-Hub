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
  },
  {
    id: 3,
    email: 'anupam@lyzr.ai',
    full_name: 'Anupam Parashar',
    role: 'super_admin',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123
    is_active: 1
  },
  {
    id: 4,
    email: 'anupam@inventrix.ai',
    full_name: 'Anupam Parashar',
    role: 'super_admin',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123
    is_active: 1
  }
];

// Check if we're in Vercel environment
const isVercelEnvironment = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production' || process.env.VERCEL_URL || process.env.VERCEL_ENV;

// Debug logging
console.log('Environment check:', {
  VERCEL: process.env.VERCEL,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
  isVercelEnvironment
});

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
      console.log('Login request received:', { action, username, email, password: password ? '[REDACTED]' : 'missing' });
      const loginIdentifier = username || email;
      console.log('Login identifier:', loginIdentifier);

      if (!loginIdentifier || !password) {
        console.log('Missing credentials:', { loginIdentifier: !!loginIdentifier, password: !!password });
        return NextResponse.json(
          { error: 'Missing credentials' },
          { status: 400 }
        );
      }

      try {
        let result: { user: any; token: string } | null;

        // Force hardcoded users for now to fix the issue
        const useHardcodedUsers = true;

        if (isVercelEnvironment || useHardcodedUsers) {
          // Use hardcoded users for Vercel deployment
          console.log('Using Vercel environment - hardcoded users');
          console.log('Looking for user:', loginIdentifier);
          console.log('Available users:', DEMO_USERS.map(u => u.email));

          const user = DEMO_USERS.find(u => u.email === loginIdentifier);
          console.log('Found user:', user);

          if (!user || !await bcrypt.compare(password, user.password_hash)) {
            console.log('Authentication failed for:', loginIdentifier);
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
          // Use database for local/production - support both email and vendor ID login
          console.log('Using database environment');

          try {
            console.log('Attempting to import database modules...');
            const { UserDB, VendorApplicationDB } = await import('@/lib/db');
            console.log('Database modules imported successfully');

            let user = null;

            // First try to find by email
            if (loginIdentifier.includes('@')) {
              console.log('Looking up user by email:', loginIdentifier);
              user = await UserDB.findByEmail(loginIdentifier);
              console.log('User found in database:', user ? 'Yes' : 'No');
              if (user) {
                console.log('User data:', { id: user.id, email: user.email, role: user.role, hasPasswordHash: !!user.password_hash });
              }
            } else {
              // Try to find by vendor ID (PVS prefix)
              if (loginIdentifier.startsWith('PVS')) {
                const application = await VendorApplicationDB.findByVendorId(loginIdentifier);
                if (application) {
                  user = await UserDB.findById((application as any).user_id);
                }
              }
            }

            if (!user) {
              console.log('User not found in database for:', loginIdentifier);
              return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
              );
            }

            console.log('User found, comparing password...');
            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            console.log('Password match result:', passwordMatch);

            if (!passwordMatch) {
              console.log('Password comparison failed');
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
          } catch (dbError) {
            console.log('Database connection failed, falling back to hardcoded users:', dbError);

            // Fallback to hardcoded users
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
          }
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