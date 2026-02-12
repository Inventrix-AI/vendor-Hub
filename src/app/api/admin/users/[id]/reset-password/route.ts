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

// POST /api/admin/users/[id]/reset-password - Admin reset user password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract admin user from JWT token
    const adminUser = getUserFromToken(request);

    // Verify admin or super_admin role
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const targetUserId = parseInt(id);

    // Validate user ID
    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { new_password } = body;

    // Validate request body
    if (!new_password) {
      return NextResponse.json(
        { error: 'Missing required field: new_password' },
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

    // Fetch target user
    const targetUser = await UserDB.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Optional: Prevent regular admin from resetting super_admin passwords
    if (adminUser.role === 'admin' && (targetUser as any).role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot reset super admin password' },
        { status: 403 }
      );
    }

    // Hash the new password
    const hashedPassword = await AuthService.hashPassword(new_password);

    // Update password in database
    const updatedUser = await UserDB.updatePassword(targetUserId, hashedPassword);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      );
    }

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = updatedUser as any;

    // Log the action (optional - if AuditLogDB is available)
    console.log(`Admin ${adminUser.id} (${adminUser.email}) reset password for user ${targetUserId} (${targetUser.email})`);

    return NextResponse.json(
      {
        message: 'Password reset successfully',
        user: userWithoutPassword
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      {
        error: 'Failed to reset password',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
