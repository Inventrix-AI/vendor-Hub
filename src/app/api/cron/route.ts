import { NextRequest, NextResponse } from 'next/server'
import { RenewalService } from '@/lib/renewalService'
import { NotificationService } from '@/lib/notificationService'

export async function POST(request: NextRequest) {
  try {
    // Verify cron job secret to prevent unauthorized access
    const cronSecret = request.headers.get('x-cron-secret')
    const expectedSecret = process.env.CRON_SECRET || 'default-cron-secret'
    
    if (cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { action } = await request.json()

    if (action === 'process-renewals') {
      // Run all renewal-related automated tasks
      
      console.log('Starting automated renewal processing...')
      
      // 1. Update subscription statuses
      await RenewalService.updateSubscriptionStatuses()
      console.log('✓ Updated subscription statuses')
      
      // 2. Send renewal reminder notifications
      await NotificationService.sendRenewalReminders()
      console.log('✓ Processed renewal reminders')
      
      // 3. Get statistics for logging
      const stats = RenewalService.getRenewalStats()
      console.log('✓ Renewal stats:', stats)

      return NextResponse.json({
        message: 'Renewal processing completed successfully',
        stats,
        timestamp: new Date().toISOString()
      })
    }

    if (action === 'health-check') {
      // Health check endpoint for monitoring
      const stats = RenewalService.getRenewalStats()
      
      return NextResponse.json({
        status: 'healthy',
        stats,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { 
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Allow GET for health checks
export async function GET() {
  try {
    const stats = RenewalService.getRenewalStats()
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Renewal system operational',
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}