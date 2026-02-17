import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const start = Date.now()
  const checks: Record<string, { status: string; time?: number; error?: string }> = {}
  
  // Check 1: Database connection
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.database = { status: 'ok', time: Date.now() - dbStart }
  } catch (error) {
    checks.database = { 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Database connection failed' 
    }
  }

  // Check 2: Environment variables
  const envVars = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
  }
  checks.environment = { 
    status: Object.values(envVars).every(v => v) ? 'ok' : 'warning',
    ...envVars 
  }

  const totalTime = Date.now() - start
  const allOk = checks.database.status === 'ok'
  
  return NextResponse.json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime?.() || 0,
    responseTime: totalTime,
    checks,
    version: '1.0.0'
  }, { status: allOk ? 200 : 503 })
}

// Also handle HEAD request for health checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
