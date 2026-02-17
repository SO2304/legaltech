// ============================================
// FLASHJURIS - VALIDATION SCHEMAS
// Zod schemas for type-safe validation
// ============================================

import { z } from 'zod'

// ============================================
// CLIENT VALIDATION
// ============================================

export const ClientInfoSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire').max(100),
  prenom: z.string().min(1, 'Le prénom est obligatoire').max(100),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  dateNaissance: z.string().optional(),
  lieuNaissance: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  profession: z.string().optional(),
})

export type ClientInfoInput = z.infer<typeof ClientInfoSchema>

// ============================================
// CASE/DOSSIER VALIDATION
// ============================================

export const CaseCreateSchema = z.object({
  lawyerId: z.string().cuid('ID avocat invalide'),
  country: z.enum(['FR', 'BE', 'CH', 'LU']).default('FR'),
  clientName: z.string().min(1, 'Le nom du client est obligatoire').max(200),
  clientEmail: z.string().email('Email client invalide'),
  clientPhone: z.string().optional(),
  caseType: z.string().optional(),
  caseDescription: z.string().max(2000).optional(),
})

export type CaseCreateInput = z.infer<typeof CaseCreateSchema>

// ============================================
// LAWYER VALIDATION
// ============================================

export const LawyerRegisterSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(200),
  firm: z.string().max(200).optional(),
  phone: z.string().optional(),
  country: z.enum(['FR', 'BE', 'CH', 'LU']).default('FR'),
  barreau: z.string().optional(),
  barNumber: z.string().optional(),
})

export type LawyerRegisterInput = z.infer<typeof LawyerRegisterSchema>

// ============================================
// DOCUMENT VALIDATION
// ============================================

export const DocumentUploadSchema = z.object({
  caseId: z.string().cuid('ID dossier invalide'),
  files: z.array(z.custom<File>((file) => file instanceof File, 'Fichier invalide'))
    .min(1, 'Au moins un fichier est requis')
    .max(10, 'Maximum 10 fichiers autorisés'),
})

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return { valid: false, error: `Type de fichier non autorisé: ${file.type}` }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(2)} MB (max 10 MB)` }
  }
  return { valid: true }
}

// ============================================
// PHONE VALIDATION BY COUNTRY
// ============================================

const PHONE_PATTERNS: Record<string, RegExp> = {
  FR: /^(\+33|0)[1-9](\d{2}){4}$/,
  BE: /^(\+32|0)[1-9](\d{2}){3,4}$/,
  CH: /^(\+41|0)[1-9](\d{2}){4}$/,
  LU: /^(\+352|\+352)\d{5,8}$/,
}

export function validatePhoneForCountry(phone: string, country: string): boolean {
  const pattern = PHONE_PATTERNS[country]
  if (!pattern) return true // Skip validation for unknown countries
  return pattern.test(phone.replace(/\s/g, ''))
}

// ============================================
// SANITIZATION HELPERS
// ============================================

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .slice(0, 10000) // Limit length
}

export function sanitizeForSQL(input: string): string {
  return input.replace(/['";\\]/g, '')
}
