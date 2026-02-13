// ============================================
// API - PURGE AUTOMATIQUE DES DONNÉES (CRON)
// Exécuter toutes les heures via Vercel Cron ou Render Cron
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { RGPDService } from '@/lib/rgpd-service'

export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret CRON (sécurité)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Exécuter la purge automatique
    const report = await RGPDService.runAutoPurge()
    
    console.log(`[CRON] Purge complete: ${report.casesProcessed} cases, ${report.documentsPurged} documents`)
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...report,
    })
    
  } catch (error) {
    console.error('[CRON] Purge error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Support POST pour les webhooks manuels
export async function POST(request: NextRequest) {
  return GET(request)
}
