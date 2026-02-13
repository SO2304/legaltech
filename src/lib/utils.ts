// ============================================
// FLASHJURIS - UTILITAIRES COMMUNS
// Fonctions réutilisables dans tout le projet
// ============================================

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ============================================
// STYLING
// ============================================

/**
 * Combine les classes Tailwind de manière intelligente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// FORMATAGE DATES
// ============================================

const DATE_FORMATTERS: Record<string, Intl.DateTimeFormat> = {}

/**
 * Formate une date selon la locale du pays
 */
export function formatDate(
  date: Date | string | null | undefined,
  locale: string = 'fr-FR',
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return ''
  
  const cacheKey = `${locale}-${JSON.stringify(options)}`
  
  if (!DATE_FORMATTERS[cacheKey]) {
    DATE_FORMATTERS[cacheKey] = new Intl.DateTimeFormat(locale, options)
  }
  
  return DATE_FORMATTERS[cacheKey].format(d)
}

/**
 * Formate une date pour affichage court (JJ/MM/AAAA)
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  return formatDate(date, 'fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, 'fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Calcule la différence en jours entre deux dates
 */
export function daysDifference(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Ajoute des jours à une date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// ============================================
// FORMATAGE NOMS
// ============================================

/**
 * Capitalise la première lettre de chaque mot
 */
export function capitalizeName(name: string): string {
  if (!name) return ''
  
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Formate un nom complet (prénom nom)
 */
export function formatFullName(firstName: string, lastName: string): string {
  const first = capitalizeName(firstName?.trim() || '')
  const last = lastName?.toUpperCase().trim() || ''
  
  if (!first && !last) return ''
  if (!first) return last
  if (!last) return first
  
  return `${first} ${last}`
}

/**
 * Retourne les initiales d'un nom
 */
export function getInitials(name: string): string {
  if (!name) return ''
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

// ============================================
// FORMATAGE TAILLES FICHIERS
// ============================================

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB']

/**
 * Formate une taille de fichier en unités lisibles
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  
  return `${size.toFixed(i > 0 ? 1 : 0)} ${SIZE_UNITS[i]}`
}

// ============================================
// FORMATAGE PRIX
// ============================================

/**
 * Formate un prix en centimes vers une chaîne lisible
 */
export function formatPrice(
  cents: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(cents / 100)
}

/**
 * Calcule le montant de commission
 */
export function calculateCommission(
  priceCents: number,
  ratePercent: number = 20
): number {
  return Math.round(priceCents * (ratePercent / 100))
}

// ============================================
// VALIDATION
// ============================================

/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valide un numéro de téléphone français
 */
export function isValidPhoneFR(phone: string): boolean {
  const cleanPhone = phone.replace(/\s/g, '')
  return /^(?:\+33|0)[1-9]\d{8}$/.test(cleanPhone)
}

/**
 * Nettoie un numéro de téléphone
 */
export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

// ============================================
// GÉNÉRATION
// ============================================

/**
 * Génère une référence unique
 */
export function generateReference(prefix: string = 'DJ'): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Génère un ID court
 */
export function generateShortId(length: number = 8): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
    .toUpperCase()
}

// ============================================
// SÉCURITÉ
// ============================================

/**
 * Masque un email pour l'affichage
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email
  
  const [localPart, domain] = email.split('@')
  const masked = localPart.charAt(0) + '***' + localPart.charAt(localPart.length - 1)
  
  return `${masked}@${domain}`
}

/**
 * Masque un numéro de téléphone
 */
export function maskPhone(phone: string): string {
  if (!phone) return ''
  
  const cleaned = cleanPhone(phone)
  if (cleaned.length < 4) return phone
  
  return cleaned.slice(0, 2) + '****' + cleaned.slice(-2)
}

// ============================================
// RGPD / ANONYMISATION
// ============================================

/**
 * Anonymise les données personnelles
 */
export function anonymizePersonalData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'clientName', 'clientEmail', 'clientPhone', 'clientAddress', 
    'clientCity', 'clientPostalCode', 'caseDescription',
    'nom', 'prenom', 'email', 'telephone', 'adresse'
  ]
  
  const result: Record<string, unknown> = { ...data }
  
  for (const field of sensitiveFields) {
    if (field in result) {
      result[field] = null
    }
  }
  
  // Ajouter un marqueur d'anonymisation
  result['anonymizedAt'] = new Date().toISOString()
  result['_anonymized'] = true
  
  return result
}

// ============================================
// SLUG
// ============================================

/**
 * Convertit une chaîne en slug URL-friendly
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}
