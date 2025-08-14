import { NextRequest, NextResponse } from 'next/server'
import { RenewalService } from '@/lib/renewalService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const action = searchParams.get('action')

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      )
    }

    if (action === 'status') {
      // Get subscription status for vendor dashboard
      const status = RenewalService.getSubscriptionStatus(vendorId)
      return NextResponse.json(status)
    }

    if (action === 'subscription') {
      // Get full subscription details
      const subscription = RenewalService.getSubscriptionByVendorId(vendorId)
      if (!subscription) {
        return NextResponse.json(
          { error: 'No subscription found' },
          { status: 404 }
        )
      }
      return NextResponse.json(subscription)
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Renewal GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch renewal data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, vendorId, applicationId, paymentId } = body

    if (action === 'create-subscription') {
      // Create initial subscription after successful payment
      if (!vendorId || !applicationId || !paymentId) {
        return NextResponse.json(
          { error: 'Vendor ID, application ID, and payment ID are required' },
          { status: 400 }
        )
      }

      const subscription = await RenewalService.createSubscription(
        vendorId,
        applicationId,
        paymentId
      )

      return NextResponse.json({
        message: 'Subscription created successfully',
        subscription
      })
    }

    if (action === 'renew') {
      // Renew existing subscription
      if (!vendorId || !paymentId) {
        return NextResponse.json(
          { error: 'Vendor ID and payment ID are required' },
          { status: 400 }
        )
      }

      const subscription = await RenewalService.processRenewalPayment(vendorId, paymentId)

      return NextResponse.json({
        message: 'Subscription renewed successfully',
        subscription
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Renewal POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process renewal request' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'update-statuses') {
      // Update subscription statuses (called by cron job)
      await RenewalService.updateSubscriptionStatuses()
      
      return NextResponse.json({
        message: 'Subscription statuses updated successfully'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Renewal PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update renewal data' },
      { status: 500 }
    )
  }
}