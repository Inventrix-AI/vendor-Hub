import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
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

// GET /api/admin/vendors - Get all vendor users
export async function GET(request: NextRequest) {
  try {
    // Verify admin or super_admin role
    const currentUser = getUserFromToken(request);
    if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all users with vendor role
    const result = await executeQuery(`
      SELECT id, email, full_name, phone, role, is_active, created_at, updated_at
      FROM users
      WHERE role = 'vendor'
      ORDER BY created_at DESC
    `);

    return NextResponse.json(
      {
        vendors: result.rows
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch vendors error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch vendors',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
