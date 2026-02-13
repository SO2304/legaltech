// ============================================
// TYPES DOSSIER - DIVORCE SAAS LEGALTECH
// ============================================

import type { Timestamps, WithId, JsonValue } from './common'
import type { ClientInfo } from './client'
import type { DocumentInfo } from './document'

// Enums correspondant à Prisma
export type DossierStatus =
  | 'BROUILLON'
  | 'EN_ATTENTE'
  | 'EN_ANALYSE'
  | 'ANALYSE_TERMINEE'
  | 'NOTIFIE'
  | 'ARCHIVE'
  | 'PURGE'

export type TypeProcedure =
  | 'CONSENTEMENT_MUTUEL'
  | 'ACCEPTATION_PRINCIPE'
  | 'FAUTE'
  | 'RUPTURE_VIE_COMMUNE'

export type RegimeMatrimonial =
  | 'COMMUNAUTE_REDUITE_ACQUETS'
  | 'COMMUNAUTE_UNIVERSELLE'
  | 'SEPARATION_DE_BIENS'
  | 'PARTICIPATION_AUX_ACQUETS'
  | 'INDETERMINE'

// Interface principale
export interface DossierInfo extends WithId, Timestamps {
  reference: string
  statut: DossierStatus
  typeProcedure: TypeProcedure
  regimeMatrimonial: RegimeMatrimonial
  dateMariage: Date | null
  lieuMariage: string | null
  dateSeparation: Date | null
  motifDivorce: string | null
  conjoint: JsonValue | null
  enfants: JsonValue | null
  patrimoine: JsonValue | null
  pensions: JsonValue | null
  analyseIA: JsonValue | null
  syntheseHTML: string | null
  dateSoumission: Date | null
  dateAnalyse: Date | null
  dateNotification: Date | null
  datePurge: Date | null
  montantEstime: number | null
  commissionDue: number | null
  consentementRGPD: boolean
  dateConsentement: Date | null
  ipConsentement: string | null
  avocatId: string
  clientId: string
}

// Dossier avec relations
export interface DossierWithRelations extends DossierInfo {
  client: ClientInfo
  documents: DocumentInfo[]
}

// Données du conjoint (structure JSON)
export interface ConjointData {
  nom: string
  prenom: string
  dateNaissance: string
  lieuNaissance: string
  profession: string
  adresse: string
  telephone: string
  email: string
}

// Données des enfants (structure JSON array)
export interface EnfantData {
  nom: string
  prenom: string
  dateNaissance: string
  aCharge: boolean
  regimeGarde: 'CONJOINTE' | 'ALTERNEE' | 'EXCLUSIVE_EPOUX' | 'EXCLUSIVE_EPOUSE' | null
}

// Patrimoine (structure JSON)
export interface PatrimoineData {
  immobilier: BienImmobilier[]
  financier: BienFinancier[]
  dettes: Dette[]
}

export interface BienImmobilier {
  type: 'RESIDENCE_PRINCIPALE' | 'RESIDENCE_SECONDAIRE' | 'INVESTISSEMENT' | 'TERRAIN'
  adresse: string
  valeurEstimee: number
  proprietaire: 'COMMUN' | 'EPOUX' | 'EPOUSE'
  hypotheque: boolean
}

export interface BienFinancier {
  type: 'COMPTE_COURANT' | 'EPARGNE' | 'ASSURANCE_VIE' | 'PEA' | 'ACTION'
  banque: string
  montant: number
  titulaire: 'COMMUN' | 'EPOUX' | 'EPOUSE'
}

export interface Dette {
  type: 'PRET_IMMOBILIER' | 'PRET_CONSO' | 'CREDIT' | 'AUTRE'
  crediteur: string
  montantRestant: number
  mensualite: number
  contractant: 'COMMUN' | 'EPOUX' | 'EPOUSE'
}

// Pensions alimentaires
export interface PensionData {
  pensionEnfants: PensionEnfant[]
  pensionConjoint: PensionConjoint | null
}

export interface PensionEnfant {
  enfantId: number // index dans le tableau enfants
  montant: number
  indexation: boolean
}

export interface PensionConjoint {
  montant: number
  duree: number // en mois
  motif: string
}

// Création de dossier
export interface CreateDossierInput {
  typeProcedure: TypeProcedure
  regimeMatrimonial: RegimeMatrimonial
  dateMariage?: Date
  lieuMariage?: string
  dateSeparation?: Date
  motifDivorce?: string
  conjoint?: ConjointData
  enfants?: EnfantData[]
  patrimoine?: PatrimoineData
  pensions?: PensionData
  consentementRGPD: boolean
  ipConsentement: string
}

// Labels pour l'affichage
export const DOSSIER_STATUS_LABELS: Record<DossierStatus, string> = {
  BROUILLON: 'Brouillon',
  EN_ATTENTE: 'En attente',
  EN_ANALYSE: 'En cours d\'analyse',
  ANALYSE_TERMINEE: 'Analyse terminée',
  NOTIFIE: 'Avocat notifié',
  ARCHIVE: 'Archivé',
  PURGE: 'Documents purgés',
}

export const TYPE_PROCEDURE_LABELS: Record<TypeProcedure, string> = {
  CONSENTEMENT_MUTUEL: 'Consentement mutuel',
  ACCEPTATION_PRINCIPE: 'Acceptation du principe de la rupture',
  FAUTE: 'Divorce pour faute',
  RUPTURE_VIE_COMMUNE: 'Rupture de la vie commune',
}

export const REGIME_MATRIMONIAL_LABELS: Record<RegimeMatrimonial, string> = {
  COMMUNAUTE_REDUITE_ACQUETS: 'Communauté réduite aux acquêts',
  COMMUNAUTE_UNIVERSELLE: 'Communauté universelle',
  SEPARATION_DE_BIENS: 'Séparation de biens',
  PARTICIPATION_AUX_ACQUETS: 'Participation aux acquêts',
  INDETERMINE: 'Indéterminé',
}
