import { NextRequest, NextResponse } from 'next/server'

/**
 * Point d'entrée de l'API FlashJuris
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    name: 'FlashJuris API',
    version: '1.0.0',
    description: 'API pour la plateforme de préparation de dossiers de divorce FlashJuris',
    endpoints: {
      health: '/api/health',
      geolocation: '/api/geolocation',
      dossiers: {
        list: 'GET /api/dossiers',
        get: 'GET /api/dossiers/[id]',
      },
      upload: 'POST /api/upload',
      analyse: 'POST /api/analyse/dossier'
    }
  })
}
