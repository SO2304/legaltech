import { Pays } from '@prisma/client'

interface GeolocationResult {
  pays: Pays
  paysDetecte: Pays
  confiance: number
  isVPN: boolean
  ipAddress: string
}

export async function detecterPaysClient(ipAddress: string): Promise<GeolocationResult> {
  try {
    const response = await fetch(`http://api.ipstack.com/${ipAddress}?access_key=${process.env.IPSTACK_KEY}`)
    const data = await response.json()
    
    const pays = mapCountryCodeToPays(data.country_code)
    const isVPN = data.connection_type === 'vpn' || data.connection_type === 'proxy'
    const confiance = isVPN ? 0.3 : 0.9
    
    return { pays, paysDetecte: pays, confiance, isVPN, ipAddress }
  } catch (error) {
    console.error('Géolocalisation error:', error)
    return {
      pays: Pays.FRANCE,
      paysDetecte: Pays.FRANCE,
      confiance: 0,
      isVPN: false,
      ipAddress
    }
  }
}

function mapCountryCodeToPays(code: string): Pays {
  const mapping: Record<string, Pays> = {
    'FR': Pays.FRANCE,
    'BE': Pays.BELGIQUE,
    'CH': Pays.SUISSE,
    'LU': Pays.LUXEMBOURG
  }
  return mapping[code] || Pays.FRANCE
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP
  
  return '127.0.0.1'
}
