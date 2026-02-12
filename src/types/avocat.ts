// ============================================
// TYPES AVOCAT - DIVORCE SAAS LEGALTECH
// ============================================

import type { Timestamps, WithId } from './common'

// Types publics (sans données sensibles)
export interface AvocatPublic {
  slug: string
  nom: string
  prenom: string
  cabinet: string | null
  adresse: string | null
  codePostal: string | null
  ville: string | null
  telephone: string | null
}

export interface Avocat extends AvocatPublic, WithId, Timestamps {
  email: string
  passwordHash: string
  totpSecret: string | null
  webhookSecret: string
  commissionRate: number
  isActive: boolean
  emailVerified: Date | null
}

// Données pour création
export interface CreateAvocatInput {
  slug: string
  email: string
  password: string
  nom: string
  prenom: string
  cabinet?: string
  adresse?: string
  codePostal?: string
  ville?: string
  telephone?: string
  commissionRate?: number
}

// Données pour mise à jour
export interface UpdateAvocatInput {
  nom?: string
  prenom?: string
  cabinet?: string
  adresse?: string
  codePostal?: string
  ville?: string
  telephone?: string
  commissionRate?: number
}

// Authentification
export interface AvocatLoginInput {
  email: string
  password: string
  totpCode?: string
}

export interface AvocatSession {
  id: string
  slug: string
  email: string
  nom: string
  prenom: string
  cabinet: string | null
}

// Dashboard stats
export interface AvocatDashboardStats {
  totalDossiers: number
  dossiersEnAttente: number
  dossiersEnAnalyse: number
  dossiersTermines: number
  commissionsTotal: number
  commissionsEnAttente: number
}
