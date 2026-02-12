import { NextRequest, NextResponse } from 'next/server';
import { UserDB } from '@/lib/db';
import { AuthService } from '@/lib/authService';
import jwt from 'jsonwebtoken';

function getUserFromToken(request: NextRequest): { id: number; email: string; role: string } | null {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('access_token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as any;
    return { id: decoded.userId || decoded.user_id, email: decoded.email, role: decoded.role };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// POST /api/user/change-password - Change own password
export async function POST(request: NextRequest) {
  try {
    // Extract user from JWT token
    const currentUser = getUserFromToken(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { current_password, new_password } = body;

    // Validate request body
    if (!current_password || !new_password) {
      return NextResponse.json(
        { error: 'Missing required fields: current_password and new_password' },
        { status: 400 }
      );
    }

    // Validate new password length
    if (new_password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Prevent setting same password
    if (current_password === new_password) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Fetch user record with password hash
    const user = await UserDB.findById(currentUser.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await AuthService.verifyPassword(
      current_password,
      (user as any).password_hash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash the new password
    const hashedPassword = await AuthService.hashPassword(new_password);

    // Update password in database
    const updatedUser = await UserDB.updatePassword(currentUser.id, hashedPassword);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = updatedUser as any;

    return NextResponse.json(
      {
        message: 'Password changed successfully',
        user: userWithoutPassword
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      {
        error: 'Failed to change password',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
