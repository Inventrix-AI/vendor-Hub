import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import jwt from 'jsonwebtoken';

function getUserFromToken(request: NextRequest): { id: number; email: string } | null {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('access_token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as any;
    return { id: decoded.userId || decoded.user_id, email: decoded.email };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// GET payment history for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get all applications for this user
    const applicationsResult = await executeQuery(
      'SELECT id FROM vendor_applications WHERE user_id = $1',
      [userId]
    );

    if (applicationsResult.rows.length === 0) {
      return NextResponse.json([]);
    }

    // Get application IDs
    const applicationIds = applicationsResult.rows.map((row: any) => row.id);

    // Fetch payments for all user's applications
    const paymentsResult = await executeQuery(
      `SELECT p.*, va.application_id as app_id, va.business_name
       FROM payments p
       JOIN vendor_applications va ON p.application_id = va.id
       WHERE p.application_id = ANY($1)
       ORDER BY p.created_at DESC
       LIMIT 10`,
      [applicationIds]
    );

    // Format the response
    const payments = paymentsResult.rows.map((payment: any) => ({
      id: payment.id,
      amount: payment.amount / 100, // Convert from paise to rupees
      currency: payment.currency || 'INR',
      status: payment.status,
      razorpay_order_id: payment.razorpay_order_id,
      razorpay_payment_id: payment.razorpay_payment_id,
      payment_type: payment.payment_type,
      application_id: payment.app_id,
      business_name: payment.business_name,
      created_at: payment.created_at,
      updated_at: payment.updated_at
    }));

    return NextResponse.json(payments);

  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}
