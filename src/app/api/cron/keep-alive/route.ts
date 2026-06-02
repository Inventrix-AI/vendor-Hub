import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

// Keep-alive endpoint hit by a daily Vercel Cron job.
// Running a trivial query counts as database activity, which prevents
// Supabase free-tier projects from auto-pausing after 7 days of inactivity.
export async function GET() {
  try {
    const result = await executeQuery('SELECT 1 AS ok')

    return NextResponse.json({
      status: 'healthy',
      database: result?.rows?.[0]?.ok === 1 ? 'reachable' : 'unexpected-response',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Keep-alive DB ping failed:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'unreachable',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
