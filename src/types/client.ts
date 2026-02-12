// ============================================
// TYPES CLIENT - DIVORCE SAAS LEGALTECH
// ============================================

import type { Timestamps, WithId } from './common'

export interface ClientInfo extends WithId, Timestamps {
  email: string
  telephone: string | null
  nom: string
  prenom: string
  dateNaissance: Date | null
  lieuNaissance: string | null
  adresse: string | null
  codePostal: string | null
  ville: string | null
  profession: string | null
}

// Données pour création
export interface CreateClientInput {
  email: string
  telephone?: string
  nom: string
  prenom: string
  dateNaissance?: Date
  lieuNaissance?: string
  adresse?: string
  codePostal?: string
  ville?: string
  profession?: string
}

// Données pour mise à jour
export interface UpdateClientInput {
  email?: string
  telephone?: string
  nom?: string
  prenom?: string
  dateNaissance?: Date
  lieuNaissance?: Date
  adresse?: string
  codePostal?: string
  ville?: string
  profession?: string
}
