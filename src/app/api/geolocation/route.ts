import { NextRequest, NextResponse } from 'next/server'
import { detecterPaysClient, getClientIP } from '@/lib/geolocation-service'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const result = await detecterPaysClient(ip)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Géolocalisation échouée' }, { status: 500 })
  }
}
