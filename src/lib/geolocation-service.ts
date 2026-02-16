import { NextRequest } from 'next/server'
import { Pays } from '@prisma/client'

/**
 * SERVICE DE GÉOLOCALISATION
 * OBLIGATOIRE: Validation pays (FRANCE, BELGIQUE, SUISSE, LUXEMBOURG)
 */

export interface GeolocationResult {
    pays: Pays
    paysDetecte: string
    confiance: number
    isVPN: boolean
    ipAddress: string
}

export function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }
    return '127.0.0.1'
}

export async function detecterPaysClient(ip: string): Promise<GeolocationResult> {
    // En dev ou localhost
    if (ip === '127.0.0.1' || ip === '::1' || process.env.NODE_ENV === 'development') {
        return {
            pays: Pays.FRANCE,
            paysDetecte: 'FR',
            confiance: 1.0,
            isVPN: false,
            ipAddress: ip
        }
    }

    try {
        const response = await fetch(`https://api.ipstack.com/${ip}?access_key=${process.env.IPSTACK_KEY}`)
        const data = await response.json()

        const countryCode = data.country_code
        let pays: Pays = Pays.FRANCE

        switch (countryCode) {
            case 'FR': pays = Pays.FRANCE; break
            case 'BE': pays = Pays.BELGIQUE; break
            case 'CH': pays = Pays.SUISSE; break
            case 'LU': pays = Pays.LUXEMBOURG; break
            default: pays = Pays.FRANCE // Fallback
        }

        return {
            pays,
            paysDetecte: countryCode,
            confiance: 0.9,
            isVPN: data.security?.is_vpn || false,
            ipAddress: ip
        }
    } catch (error) {
        console.error('Erreur ipstack:', error)
        return {
            pays: Pays.FRANCE,
            paysDetecte: 'UNKNOWN',
            confiance: 0.5,
            isVPN: false,
            ipAddress: ip
        }
    }
}
