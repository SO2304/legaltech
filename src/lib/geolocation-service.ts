// ============================================
// SERVICE GÉOLOCALISATION
// Détection automatique du pays via IP (IPStack)
// ============================================

import { Pays } from '@prisma/client'

// ============================================
// TYPES
// ============================================
export interface GeolocationResult {
  pays: Pays
  paysDetecte: string
  confiance: number
  isVPN: boolean
  details?: {
    countryCode: string
    countryName: string
    city?: string
    ip: string
  }
}

// ============================================
// MAPPING CODE PAYS → ENUM PAYS
// ============================================
function mapCountryToPays(countryCode: string): Pays {
  const mapping: Record<string, Pays> = {
    'FR': Pays.FRANCE,
    'BE': Pays.BELGIQUE,
    'CH': Pays.SUISSE,
    'LU': Pays.LUXEMBOURG,
  }

  return mapping[countryCode] || Pays.FRANCE
}

// ============================================
// FONCTION PRINCIPALE: DÉTECTER PAYS CLIENT
// ============================================
export async function detecterPaysClient(ip: string): Promise<GeolocationResult> {
  // En dev ou localhost
  if (ip === '127.0.0.1' || ip === '::1' || process.env.NODE_ENV === 'development') {
    return {
      pays: Pays.FRANCE,
      paysDetecte: 'FR',
      confiance: 1.0,
      isVPN: false,
    }
  }

  try {
    // 1. Appeler IPStack API
    const apiKey = process.env.IPSTACK_API_KEY || process.env.IPSTACK_KEY

    if (!apiKey) {
      console.warn('⚠️  IPSTACK_API_KEY manquante, utilisation du fallback France')
      return {
        pays: Pays.FRANCE,
        paysDetecte: 'FR',
        confiance: 0.5,
        isVPN: false,
      }
    }

    const response = await fetch(
      `http://api.ipstack.com/${ip}?access_key=${apiKey}&fields=country_code,country_name,city,connection`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`IPStack API error: ${response.status}`)
    }

    const data = await response.json()

    // 2. Mapper le code pays
    const pays = mapCountryToPays(data.country_code)

    // 3. Détecter VPN
    const isVPN = detectVPN(data)

    // 4. Calculer confiance
    const confiance = isVPN ? 0.3 : 0.9

    return {
      pays,
      paysDetecte: data.country_code || 'UNKNOWN',
      confiance,
      isVPN,
      details: {
        countryCode: data.country_code,
        countryName: data.country_name,
        city: data.city,
        ip,
      },
    }

  } catch (error) {
    console.error('❌ Erreur géolocalisation:', error)

    // Fallback: France par défaut
    return {
      pays: Pays.FRANCE,
      paysDetecte: 'UNKNOWN',
      confiance: 0.5,
      isVPN: false,
    }
  }
}

// ============================================
// DÉTECTION VPN
// ============================================
function detectVPN(data: any): boolean {
  const vpnKeywords = ['vpn', 'proxy', 'hosting', 'datacenter', 'cloud']
  const connection = data.connection || {}
  const isp = (connection.isp || '').toLowerCase()

  return vpnKeywords.some(keyword => isp.includes(keyword))
}

// ============================================
// HELPER: EXTRAIRE IP DU REQUEST
// ============================================
export function getClientIP(request: Request): string {
  // 1. Vérifier headers forwarded (Vercel / Reverse Proxy)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  // 2. Vérifier real-ip
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // 3. Fallback
  return '8.8.8.8'
}
