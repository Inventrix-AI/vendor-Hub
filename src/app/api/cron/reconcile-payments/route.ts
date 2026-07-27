import { NextRequest, NextResponse } from 'next/server';
import { PendingRegistrationDB } from '@/lib/db';
import { completeRegistration } from '@/lib/registrationService';

/**
 * Reconciliation safety-net.
 *
 * Walks every staged pending_registration, asks Razorpay whether that order was
 * actually paid (captured), and materialises any customer that paid but whose
 * record was never created — the same class of bug that lost paying customers
 * when the browser never called /api/payment/verify and no webhook existed.
 *
 * This backstops the webhook: if a webhook delivery is ever missed, this cron
 * catches it on the next run. It is idempotent (completeRegistration is keyed on
 * application_id), so re-running is safe.
 *
 * Auth: send `Authorization: Bearer <CRON_SECRET>` or header `x-cron-secret`.
 * Scheduled via vercel.json.
 */
export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  // ---- Auth ----------------------------------------------------------------
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization') || '';
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const headerSecret = request.headers.get('x-cron-secret') || '';
    if (bearer !== cronSecret && headerSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'Razorpay credentials not configured' }, { status: 500 });
  }
  const auth = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  try {
    const pending = await PendingRegistrationDB.findAll();
    const recovered: Array<{ vendorId: string; paymentId: string }> = [];
    const errors: Array<{ order: string; error: string }> = [];
    let checked = 0;
    let unpaid = 0;

    for (const row of pending) {
      const orderId: string = row.razorpay_order_id;
      checked++;
      try {
        const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}/payments`, {
          headers: { Authorization: auth },
        });
        if (!res.ok) {
          errors.push({ order: orderId, error: `razorpay ${res.status}` });
          continue;
        }
        const data = await res.json();
        const captured = (data.items || []).find((p: any) => p.status === 'captured');
        if (!captured) {
          unpaid++;
          continue;
        }

        const result = await completeRegistration({
          pendingRegistration: row,
          razorpayOrderId: orderId,
          razorpayPaymentId: captured.id,
          source: 'reconcile_cron',
        });
        if (result.created) {
          recovered.push({ vendorId: result.vendorId, paymentId: captured.id });
        }
      } catch (e) {
        errors.push({ order: orderId, error: e instanceof Error ? e.message : String(e) });
      }
    }

    console.log(`[Reconcile] checked=${checked} recovered=${recovered.length} unpaid=${unpaid} errors=${errors.length}`);
    return NextResponse.json({
      status: 'completed',
      checked,
      recovered_count: recovered.length,
      recovered,
      unpaid,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Reconcile] failed:', error);
    return NextResponse.json(
      { error: 'Reconciliation failed', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}
