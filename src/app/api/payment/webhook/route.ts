import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PendingRegistrationDB } from '@/lib/db';
import { completeRegistration } from '@/lib/registrationService';

/**
 * Razorpay webhook — server-side fallback for completing registrations.
 *
 * Why this exists: previously a customer was only written to the DB when their
 * browser called /api/payment/verify AFTER paying. If the browser closed, lost
 * network, or the UPI app didn't redirect back, the payment was captured by
 * Razorpay but no customer record was ever created (money in, no vendor).
 *
 * This endpoint receives payment.captured / order.paid events directly from
 * Razorpay's servers and materialises the customer from the staged
 * pending_registration — no browser involvement required. It is idempotent, so
 * it's safe if the client verify also runs.
 *
 * Setup: Razorpay Dashboard → Settings → Webhooks → add
 *   URL:    https://<your-domain>/api/payment/webhook
 *   Secret: value of RAZORPAY_WEBHOOK_SECRET
 *   Events: payment.captured, order.paid
 */
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Read the raw body — signature is computed over the exact bytes Razorpay sent.
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Constant-time comparison
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.warn('[Webhook] Invalid signature — rejecting');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event: string = payload.event;
    console.log(`[Webhook] Received event: ${event}`);

    // We only act on successful-payment events.
    if (event !== 'payment.captured' && event !== 'order.paid') {
      return NextResponse.json({ received: true, ignored: event });
    }

    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;
    const razorpayOrderId: string | undefined = paymentEntity?.order_id || orderEntity?.id;
    const razorpayPaymentId: string | undefined = paymentEntity?.id;

    if (!razorpayOrderId) {
      console.warn('[Webhook] No order_id in payload');
      return NextResponse.json({ received: true, error: 'no order_id' });
    }

    const pendingRegistration = await PendingRegistrationDB.findByOrderIdIgnoreExpiry(razorpayOrderId);
    if (!pendingRegistration) {
      // Already materialised (client verify won the race) or not a registration
      // order (e.g. a renewal). Nothing to do — ack so Razorpay stops retrying.
      console.log(`[Webhook] No staged registration for order ${razorpayOrderId} — already processed or N/A`);
      return NextResponse.json({ received: true, processed: false });
    }

    const result = await completeRegistration({
      pendingRegistration,
      razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId || 'webhook',
      source: 'webhook',
    });

    console.log(`[Webhook] ${result.created ? 'Created' : 'Already existed'}: vendor ${result.vendorId}`);
    return NextResponse.json({
      received: true,
      processed: true,
      created: result.created,
      vendorId: result.vendorId,
      applicationId: result.applicationId,
    });

  } catch (error) {
    console.error('[Webhook] Processing failed:', error);
    // Return 500 so Razorpay retries later (it retries failed webhooks).
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
