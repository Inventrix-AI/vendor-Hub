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

// POST /api/admin/vendors/[id]/reset-password - Admin reset vendor password with self-verification
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
    const { admin_password, new_password } = body;

    // Validate request body
    if (!admin_password || !new_password) {
      return NextResponse.json(
        { error: 'Missing required fields: admin_password and new_password' },
        { status: 400 }
      );
    }

    // Validate new password length
    if (new_password.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // SECURITY: Verify admin's own password before allowing reset
    const adminRecord = await UserDB.findById(adminUser.id);
    if (!adminRecord) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    const isAdminPasswordValid = await AuthService.verifyPassword(
      admin_password,
      (adminRecord as any).password_hash
    );

    if (!isAdminPasswordValid) {
      return NextResponse.json(
        { error: 'Your admin password is incorrect' },
        { status: 401 }
      );
    }

    // Fetch target vendor user
    const targetUser = await UserDB.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // SECURITY: Verify target user is a vendor (prevent using this endpoint on admin accounts)
    if ((targetUser as any).role !== 'vendor') {
      return NextResponse.json(
        { error: 'This endpoint can only be used to reset vendor passwords. Use the admin users endpoint for admin accounts.' },
        { status: 403 }
      );
    }

    // Hash the new password
    const hashedPassword = await AuthService.hashPassword(new_password);

    // Update vendor password in database
    const updatedUser = await UserDB.updatePassword(targetUserId, hashedPassword);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      );
    }

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = updatedUser as any;

    // Log the action for security audit
    console.log(`[SECURITY] Admin ${adminUser.id} (${adminUser.email}) reset password for vendor ${targetUserId} (${targetUser.email})`);

    return NextResponse.json(
      {
        message: 'Vendor password reset successfully',
        user: userWithoutPassword
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Vendor password reset error:', error);
    return NextResponse.json(
      {
        error: 'Failed to reset vendor password',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
