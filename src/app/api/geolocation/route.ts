// ============================================
// API GÉOLOCALISATION - DÉTECTION PAYS CLIENT
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { detecterPaysClient, getClientIP } from '@/lib/geolocation-service'

// ============================================
// GET /api/geolocation
// ============================================
export async function GET(request: NextRequest) {
  try {
    // 1. Extraire l'IP du client
    const ip = getClientIP(request)

    console.log('🌍 Détection pays pour IP:', ip)

    // 2. Détecter le pays
    const result = await detecterPaysClient(ip)

    // 3. Log pour monitoring
    console.log('✅ Géolocalisation:', {
      ip,
      pays: result.pays,
      confiance: result.confiance,
      isVPN: result.isVPN,
    })

    // 4. Retourner le résultat
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('❌ Erreur API Géolocalisation:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
