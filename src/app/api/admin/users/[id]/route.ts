import { NextRequest, NextResponse } from 'next/server';
import { UserDB } from '@/lib/db';
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

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify super_admin role
    const currentUser = getUserFromToken(request);
    if (!currentUser || currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Prevent self-modification of role
    if (currentUser.id === userId) {
      const body = await request.json();
      if (body.role) {
        return NextResponse.json(
          { error: 'Cannot change your own role' },
          { status: 403 }
        );
      }
    }

    // Check if user exists
    const existingUser = await UserDB.findById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { role, is_active, full_name, phone } = body;

    // Validate role if provided
    if (role) {
      const validRoles = ['vendor', 'admin', 'super_admin'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await UserDB.update(userId, {
      role,
      is_active,
      full_name,
      phone
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Remove sensitive fields
    const { password_hash, ...userWithoutPassword } = updatedUser as any;

    return NextResponse.json(
      {
        message: 'User updated successfully',
        user: userWithoutPassword
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update user',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Deactivate user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify super_admin role
    const currentUser = getUserFromToken(request);
    if (!currentUser || currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Prevent self-deactivation
    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 403 }
      );
    }

    // Check if user exists
    const existingUser = await UserDB.findById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Deactivate user
    const deactivatedUser = await UserDB.update(userId, {
      is_active: false
    });

    if (!deactivatedUser) {
      return NextResponse.json(
        { error: 'Failed to deactivate user' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'User deactivated successfully',
        user: {
          id: deactivatedUser.id,
          email: deactivatedUser.email,
          is_active: deactivatedUser.is_active
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Deactivate user error:', error);
    return NextResponse.json(
      {
        error: 'Failed to deactivate user',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
