// ============================================
// FLASHJURIS - SERVICE DE LOCALISATION
// Détection du pays via IP et téléphone
// ============================================

import type { CountryCode, CountryConfig, COUNTRY_CONFIGS } from './countries'

// Indicatifs téléphoniques par pays
const PHONE_PREFIXES: Record<string, CountryCode> = {
  '+33': 'FR',
  '0033': 'FR',
  '+32': 'BE',
  '0032': 'BE',
  '+41': 'CH',
  '0041': 'CH',
  '+352': 'LU',
  '00352': 'LU',
}

// Plages IP par pays (simplifié - en production utiliser une base GeoIP)
const IP_RANGES: Record<CountryCode, string[]> = {
  FR: ['2.', '5.', '17.', '31.', '37.', '41.', '46.', '51.', '62.', '77.', '78.', '79.', '80.', '81.', '82.', '83.', '84.', '85.', '86.', '87.', '88.', '89.', '90.', '91.', '92.', '93.', '94.', '95.', '109.', '128.', '129.', '130.', '131.', '132.', '134.', '137.', '138.', '140.', '141.', '143.', '144.', '145.', '146.', '147.', '149.', '150.', '151.', '152.', '153.', '154.', '155.', '156.', '157.', '158.', '159.', '160.', '161.', '162.', '163.', '164.', '165.', '166.', '171.', '176.', '178.', '185.', '188.', '190.', '193.', '194.', '195.', '212.', '213.', '217.', '194.'],
  BE: ['2.', '5.', '31.', '46.', '62.', '77.', '78.', '79.', '80.', '81.', '83.', '84.', '85.', '87.', '88.', '91.', '109.', '130.', '134.', '138.', '141.', '143.', '146.', '147.', '149.', '151.', '152.', '153.', '157.', '159.', '171.', '178.', '185.', '188.', '193.', '217.'],
  CH: ['2.', '5.', '31.', '46.', '62.', '77.', '78.', '80.', '81.', '83.', '84.', '85.', '88.', '91.', '109.', '130.', '138.', '141.', '146.', '149.', '151.', '152.', '157.', '159.', '178.', '185.', '188.', '193.', '217.'],
  LU: ['2.', '5.', '31.', '46.', '77.', '80.', '81.', '83.', '84.', '85.', '88.', '91.', '109.', '130.', '138.', '141.', '146.', '149.', '151.', '157.', '159.', '178.', '185.', '188.', '193.', '217.'],
}

/**
 * Détecte le pays à partir d'une adresse IP
 */
export function detectCountryFromIP(ip: string): CountryCode {
  // IPs locales
  if (ip === 'localhost' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return 'FR' // Défaut pour le développement
  }
  
  // Vérifier les plages IP
  const firstOctets = ip.split('.').slice(0, 2).join('.')
  const firstOctet = ip.split('.')[0] + '.'
  
  for (const [country, ranges] of Object.entries(IP_RANGES)) {
    if (ranges.some(range => firstOctets.startsWith(range) || firstOctet === range)) {
      return country as CountryCode
    }
  }
  
  // Défaut
  return 'FR'
}

/**
 * Détecte le pays à partir d'un numéro de téléphone
 */
export function detectCountryFromPhone(phone: string): CountryCode | null {
  // Nettoyer le numéro
  const cleanPhone = phone.replace(/\s/g, '').replace(/^00/, '+')
  
  // Chercher l'indicatif
  for (const [prefix, country] of Object.entries(PHONE_PREFIXES)) {
    if (cleanPhone.startsWith(prefix)) {
      return country
    }
  }
  
  return null
}

/**
 * Détecte le pays à partir de l'email (domaine)
 */
export function detectCountryFromEmail(email: string): CountryCode | null {
  const domain = email.split('@')[1]?.toLowerCase()
  
  if (!domain) return null
  
  // Domaines par pays
  if (domain.endsWith('.fr')) return 'FR'
  if (domain.endsWith('.be')) return 'BE'
  if (domain.endsWith('.ch')) return 'CH'
  if (domain.endsWith('.lu')) return 'LU'
  
  // Domaines spécifiques
  if (domain.includes('belgique') || domain.includes('belgium')) return 'BE'
  if (domain.includes('suisse') || domain.includes('swiss') || domain.includes('schweiz')) return 'CH'
  if (domain.includes('luxembourg') || domain.includes('luxemburg')) return 'LU'
  
  return null
}

/**
 * Détecte le pays automatiquement (combinaison de méthodes)
 */
export function detectCountry(data: {
  ip?: string
  phone?: string
  email?: string
}): CountryCode {
  // Priorité 1: Téléphone
  if (data.phone) {
    const fromPhone = detectCountryFromPhone(data.phone)
    if (fromPhone) return fromPhone
  }
  
  // Priorité 2: Email
  if (data.email) {
    const fromEmail = detectCountryFromEmail(data.email)
    if (fromEmail) return fromEmail
  }
  
  // Priorité 3: IP
  if (data.ip) {
    return detectCountryFromIP(data.ip)
  }
  
  // Défaut
  return 'FR'
}

/**
 * Valide un numéro de téléphone selon le pays
 */
export function validatePhoneForCountry(phone: string, country: CountryCode): { valid: boolean; formatted?: string; error?: string } {
  const cleanPhone = phone.replace(/\s/g, '').replace(/^00/, '+')
  
  const patterns: Record<CountryCode, RegExp> = {
    FR: /^\+33[1-9]\d{8}$/,
    BE: /^\+32[1-9]\d{7,8}$/,
    CH: /^\+41[1-9]\d{8}$/,
    LU: /^\+352[1-9]\d{4,8}$/,
  }
  
  const pattern = patterns[country]
  
  if (!pattern.test(cleanPhone)) {
    // Essayer de formater
    const digits = phone.replace(/\D/g, '')
    let formatted = ''
    
    switch (country) {
      case 'FR':
        if (digits.length === 10 && digits.startsWith('0')) {
          formatted = `+33${digits.slice(1)}`
        } else if (digits.length === 9) {
          formatted = `+33${digits}`
        }
        break
      case 'BE':
        if (digits.length >= 9) {
          formatted = `+32${digits.slice(-9)}`
        }
        break
      case 'CH':
        if (digits.length >= 9) {
          formatted = `+41${digits.slice(-9)}`
        }
        break
      case 'LU':
        if (digits.length >= 5) {
          formatted = `+352${digits}`
        }
        break
    }
    
    if (formatted && pattern.test(formatted)) {
      return { valid: true, formatted }
    }
    
    return { 
      valid: false, 
      error: `Numéro invalide pour ${country}. Format attendu: ${country === 'CH' ? '+41 XX XXX XX XX' : '+XX X XX XX XX XX'}` 
    }
  }
  
  return { valid: true, formatted: cleanPhone }
}

/**
 * Formate un prix selon le pays
 */
export function formatPrice(amountCents: number, country: CountryCode): string {
  const currency = country === 'CH' ? 'CHF' : 'EUR'
  const locale = country === 'CH' ? 'fr-CH' : `fr-${country}`
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amountCents / 100)
}

/**
 * Obtient la configuration complète d'un pays
 */
export function getCountryConfig(country: CountryCode): CountryConfig {
  const configs = require('./countries').COUNTRY_CONFIGS
  return configs[country]
}
