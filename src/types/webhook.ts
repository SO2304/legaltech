// ============================================
// TYPES WEBHOOK - DIVORCE SAAS LEGALTECH
// Pour l'intégration n8n
// ============================================

import type { JsonValue } from './common'

export type WebhookEventType =
  | 'DOSSIER_SUBMIT'
  | 'ANALYSIS_COMPLETE'
  | 'EMAIL_SENT'
  | 'DOCUMENT_PROCESSED'
  | 'ERROR'

export type WebhookStatus =
  | 'RECU'
  | 'EN_TRAITEMENT'
  | 'TRAITE'
  | 'ERREUR'

// Payload reçu de n8n après analyse IA
export interface WebhookAnalysisPayload {
  dossierId: string
  reference: string
  analysis: AnalysisResult
  extractedData: ExtractedData
  syntheseHTML: string
}

// Résultat de l'analyse IA
export interface AnalysisResult {
  resumeGeneral: string
  pointsAttention: PointAttention[]
  documentsManquants: string[]
  recommandations: string[]
  estimationComplexite: 'FAIBLE' | 'MOYENNE' | 'ELEVEE'
  scoreConfiance: number // 0-100
}

export interface PointAttention {
  titre: string
  description: string
  niveau: 'INFO' | 'WARNING' | 'CRITICAL'
  categorie: 'PATRIMOINE' | 'ENFANTS' | 'FINANCIER' | 'PROCEDURE' | 'AUTRE'
}

// Données extraites par l'IA des documents
export interface ExtractedData {
  revenusEpoux: RevenusInfo | null
  revenusEpouse: RevenusInfo | null
  patrimoineImmobilier: BienImmobilierExtrait[]
  patrimoineFinancier: BienFinancierExtrait[]
  dettes: DetteExtraite[]
  enfants: EnfantExtrait[]
}

export interface RevenusInfo {
  salaireNetMensuel: number
  employeur: string | null
  poste: string | null
  dateEmbauche: string | null
  primes: number | null
}

export interface BienImmobilierExtrait {
  type: string
  adresse: string
  valeurEstimee: number
  proprietaire: 'COMMUN' | 'EPOUX' | 'EPOUSE'
  encoursCredit: number | null
}

export interface BienFinancierExtrait {
  type: string
  etablissement: string
  montant: number
  titulaire: 'COMMUN' | 'EPOUX' | 'EPOUSE'
}

export interface DetteExtraite {
  type: string
  crediteur: string
  montantRestant: number
  mensualite: number
}

export interface EnfantExtrait {
  nom: string
  prenom: string
  dateNaissance: string
  aCharge: boolean
}

// Payload pour confirmation d'envoi d'email
export interface WebhookEmailPayload {
  dossierId: string
  emailType: 'NOTIFICATION_AVOCAT' | 'CONFIRMATION_CLIENT'
  recipient: string
  sentAt: string
  messageId: string
}

// Payload d'erreur
export interface WebhookErrorPayload {
  dossierId: string
  errorCode: string
  errorMessage: string
  timestamp: string
  details?: JsonValue
}

// Headers requis pour les webhooks
export interface WebhookHeaders {
  'x-webhook-secret': string
  'x-event-type': WebhookEventType
  'x-timestamp': string
  'x-signature': string
}

// Réponse API webhook
export interface WebhookResponse {
  success: boolean
  message: string
  processedAt?: string
}

// Structure d'un événement webhook en base
export interface WebhookEventRecord {
  id: string
  type: WebhookEventType
  payload: JsonValue
  response: JsonValue | null
  statut: WebhookStatus
  erreur: string | null
  tempsTraitement: number | null
  receivedAt: Date
  processedAt: Date | null
  dossierId: string
}
