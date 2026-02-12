// ============================================
// TYPES DOCUMENT - DIVORCE SAAS LEGALTECH
// ============================================

import type { Timestamps, WithId, JsonValue } from './common'

export type DocumentType =
  | 'CARTE_IDENTITE_EPOUX'
  | 'CARTE_IDENTITE_EPOUSE'
  | 'PASSEPORT_EPOUX'
  | 'PASSEPORT_EPOUSE'
  | 'ACTE_MARIAGE'
  | 'LIVRET_FAMILLE'
  | 'ACTE_NAISSANCE_ENFANTS'
  | 'BULLETIN_SALAIRE_EPOUX'
  | 'BULLETIN_SALAIRE_EPOUSE'
  | 'AVIS_IMPOSITION'
  | 'DECLARATION_IMPOTS'
  | 'TITRE_PROPRIETE'
  | 'HYPOTHEQUE'
  | 'RELEVE_BANCAIRE'
  | 'RELEVE_EPARGNE'
  | 'RELEVE_ASSURANCE_VIE'
  | 'PRET_IMMOBILIER'
  | 'PRET_CONSOMMATION'
  | 'DETTES'
  | 'AUTRE'

export interface DocumentInfo extends WithId {
  type: DocumentType
  nomOriginal: string
  nomStockage: string
  mimeType: string
  taille: number
  hash: string
  cheminStockage: string
  estChiffre: boolean
  metadonneesIA: JsonValue | null
  dateUpload: Date
  datePurge: Date
  estPurge: boolean
  datePurgeEffective: Date | null
  createdAt: Date
  dossierId: string
  avocatId: string
}

// Upload input
export interface UploadDocumentInput {
  file: File
  type: DocumentType
  dossierId: string
  avocatId: string
}

// Métadonnées extraites par l'IA
export interface DocumentMetadataAI {
  typeDocument: string
  dateDocument: string | null
  noms: string[]
  montants: number[]
  adresse: string | null
  siren: string | null
  resume: string
  confidence: number // 0-1
}

// Labels pour l'affichage
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CARTE_IDENTITE_EPOUX: 'Carte d\'identité (Époux)',
  CARTE_IDENTITE_EPOUSE: 'Carte d\'identité (Épouse)',
  PASSEPORT_EPOUX: 'Passeport (Époux)',
  PASSEPORT_EPOUSE: 'Passeport (Épouse)',
  ACTE_MARIAGE: 'Acte de mariage',
  LIVRET_FAMILLE: 'Livret de famille',
  ACTE_NAISSANCE_ENFANTS: 'Acte(s) de naissance des enfants',
  BULLETIN_SALAIRE_EPOUX: 'Bulletin(s) de salaire (Époux)',
  BULLETIN_SALAIRE_EPOUSE: 'Bulletin(s) de salaire (Épouse)',
  AVIS_IMPOSITION: 'Avis d\'imposition',
  DECLARATION_IMPOTS: 'Déclaration d\'impôts',
  TITRE_PROPRIETE: 'Titre de propriété',
  HYPOTHEQUE: 'Acte d\'hypothèque',
  RELEVE_BANCAIRE: 'Relevé bancaire',
  RELEVE_EPARGNE: 'Relevé d\'épargne',
  RELEVE_ASSURANCE_VIE: 'Relevé d\'assurance vie',
  PRET_IMMOBILIER: 'Prêt immobilier',
  PRET_CONSOMMATION: 'Prêt à la consommation',
  DETTES: 'Documents relatifs aux dettes',
  AUTRE: 'Autre document',
}

// Catégories pour regrouper les documents
export type DocumentCategory = 'IDENTITE' | 'ETAT_CIVIL' | 'FINANCIER' | 'PATRIMOINE' | 'DETTES' | 'AUTRE'

export const DOCUMENT_CATEGORIES: Record<DocumentCategory, DocumentType[]> = {
  IDENTITE: ['CARTE_IDENTITE_EPOUX', 'CARTE_IDENTITE_EPOUSE', 'PASSEPORT_EPOUX', 'PASSEPORT_EPOUSE'],
  ETAT_CIVIL: ['ACTE_MARIAGE', 'LIVRET_FAMILLE', 'ACTE_NAISSANCE_ENFANTS'],
  FINANCIER: ['BULLETIN_SALAIRE_EPOUX', 'BULLETIN_SALAIRE_EPOUSE', 'AVIS_IMPOSITION', 'DECLARATION_IMPOTS'],
  PATRIMOINE: ['TITRE_PROPRIETE', 'HYPOTHEQUE', 'RELEVE_BANCAIRE', 'RELEVE_EPARGNE', 'RELEVE_ASSURANCE_VIE'],
  DETTES: ['PRET_IMMOBILIER', 'PRET_CONSOMMATION', 'DETTES'],
  AUTRE: ['AUTRE'],
}

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  IDENTITE: 'Pièces d\'identité',
  ETAT_CIVIL: 'État civil',
  FINANCIER: 'Documents financiers',
  PATRIMOINE: 'Patrimoine',
  DETTES: 'Dettes',
  AUTRE: 'Autres documents',
}
