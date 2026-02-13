// ============================================
// HEALTH CHECK ENDPOINT - Render monitoring
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth, getConnectionPoolStats } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * Health check endpoint pour Render
 * GET /api/health
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()

  try {
    // Vérifier la connexion base de données
    const isDatabaseHealthy = await checkDatabaseHealth()

    // Récupérer les stats du pool de connexions (dev uniquement)
    const poolStats = await getConnectionPoolStats()

    const status = isDatabaseHealthy ? 'healthy' : 'unhealthy'
    const statusCode = isDatabaseHealthy ? 200 : 503

    const response = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      checks: {
        database: isDatabaseHealthy ? 'ok' : 'error',
      },
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          poolStats,
          memoryUsage: process.memoryUsage(),
        },
      }),
    }

    const duration = Date.now() - startTime
    logger.httpRequest('GET', '/api/health', statusCode, duration)

    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Health check failed', error as Error, { duration })

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    )
  }
}

// ============================================
// CONFIGURATION RENDER
// ============================================

// Pour Render, configurez:
// - Health Check Path: /api/health
// - Health Check Interval: 30 secondes
// - Health Check Timeout: 5 secondes
// - Unhealthy Threshold: 3 échecs consécutifs
