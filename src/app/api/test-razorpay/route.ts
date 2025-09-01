import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function GET(request: NextRequest) {
    try {
        // Check if credentials are present
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json({
                success: false,
                error: 'Razorpay credentials not found',
                has_key_id: !!process.env.RAZORPAY_KEY_ID,
                has_secret: !!process.env.RAZORPAY_KEY_SECRET
            });
        }

        // Validate key format
        if (!process.env.RAZORPAY_KEY_ID.startsWith('rzp_')) {
            return NextResponse.json({
                success: false,
                error: 'Invalid Razorpay Key ID format',
                key_id: process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...'
            });
        }

        // Initialize Razorpay
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        // Test with a minimal order
        const testOrder = await razorpay.orders.create({
            amount: 100, // 1 rupee in paise
            currency: 'INR',
            receipt: `test_${Date.now()}`
        });

        return NextResponse.json({
            success: true,
            message: 'Razorpay credentials are working',
            test_order_id: testOrder.id,
            key_id: process.env.RAZORPAY_KEY_ID.substring(0, 10) + '...'
        });

    } catch (error: any) {
        console.error('Razorpay test failed:', error);
        return NextResponse.json({
            success: false,
            error: 'Razorpay test failed',
            details: {
                message: error.message,
                code: error.error?.code,
                description: error.error?.description
            }
        }, { status: 500 });
    }
}
