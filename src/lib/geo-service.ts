/**
 * SERVICE DE GÉOLOCALISATION
 * OBLIGATOIRE: Validation pays (FR, BE, CH, LU)
 */

export type PaysCode = 'FRANCE' | 'BELGIQUE' | 'SUISSE' | 'LUXEMBOURG';

export async function detectUserCountry(ip: string): Promise<PaysCode> {
    // En dev, on simule FRANCE
    if (process.env.NODE_ENV === 'development' || ip === '::1' || ip === '127.0.0.1') {
        return 'FRANCE';
    }

    try {
        const response = await fetch(`https://api.ipstack.com/${ip}?access_key=${process.env.IPSTACK_KEY}`);
        const data = await response.json();

        const countryCode = data.country_code;

        switch (countryCode) {
            case 'FR': return 'FRANCE';
            case 'BE': return 'BELGIQUE';
            case 'CH': return 'SUISSE';
            case 'LU': return 'LUXEMBOURG';
            default: return 'FRANCE'; // Default
        }
    } catch (error) {
        console.error('Erreur détection pays:', error);
        return 'FRANCE';
    }
}

export function getCurrencyForPays(pays: PaysCode): 'EUR' | 'CHF' {
    return pays === 'SUISSE' ? 'CHF' : 'EUR';
}

export function getPriceForPays(pays: PaysCode): number {
    switch (pays) {
        case 'FRANCE': return 149.00;
        case 'BELGIQUE': return 149.00;
        case 'SUISSE': return 189.00;
        case 'LUXEMBOURG': return 159.00;
        default: return 149.00;
    }
}
