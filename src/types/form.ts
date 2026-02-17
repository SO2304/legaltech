// ============================================
// TYPES FORMULAIRE - DIVORCE SAAS LEGALTECH
// Pour le formulaire multi-étapes
// ============================================

import type { 
  TypeProcedure, 
  RegimeMatrimonial, 
  ConjointData, 
  EnfantData, 
  PatrimoineData,
  PensionData 
} from './dossier'
import type { CreateClientInput } from './client'
import type { DocumentType } from './document'

// Données complètes du formulaire
export interface DivorceFormData {
  // Étape 1: Informations du demandeur
  demandeur: CreateClientInput
  
  // Étape 2: Informations du conjoint
  conjoint: ConjointData
  
  // Étape 3: Informations sur le mariage
  mariage: MariageInfo
  
  // Étape 4: Enfants
  enfants: EnfantData[]
  hasEnfants: boolean
  
  // Étape 5: Patrimoine
  patrimoine: PatrimoineData
  hasPatrimoine: boolean
  
  // Étape 6: Documents
  documents: DocumentUpload[]
  
  // Consentement RGPD
  consentement: ConsentementData
}

export interface MariageInfo {
  typeProcedure: TypeProcedure
  regimeMatrimonial: RegimeMatrimonial
  dateMariage: string
  lieuMariage: string
  dateSeparation: string | null
  motifDivorce: string | null
}

export interface DocumentUpload {
  file: File | null
  type: DocumentType
  uploaded: boolean
  uploadProgress: number
  error: string | null
}

export interface ConsentementData {
  accepte: boolean
  date: string
  ip: string
}

// Étapes du formulaire
export type FormStep = 
  | 'demandeur'
  | 'conjoint'
  | 'mariage'
  | 'enfants'
  | 'patrimoine'
  | 'documents'
  | 'recapitulatif'
  | 'confirmation'

export const FORM_STEPS: { id: FormStep; label: string; description: string }[] = [
  { id: 'demandeur', label: 'Vos informations', description: 'Identité et coordonnées' },
  { id: 'conjoint', label: 'Votre conjoint', description: 'Informations sur l\'époux(se)' },
  { id: 'mariage', label: 'Le mariage', description: 'Date, lieu et régime' },
  { id: 'enfants', label: 'Les enfants', description: 'Enfants du couple' },
  { id: 'patrimoine', label: 'Le patrimoine', description: 'Biens et dettes' },
  { id: 'documents', label: 'Les documents', description: 'Pièces justificatives' },
  { id: 'recapitulatif', label: 'Récapitulatif', description: 'Vérification avant envoi' },
  { id: 'confirmation', label: 'Confirmation', description: 'Dossier envoyé' },
]

// Validation des étapes
export interface StepValidation {
  isValid: boolean
  errors: Record<string, string>
}

// État du formulaire
export interface FormState {
  currentStep: FormStep
  completedSteps: FormStep[]
  isSubmitting: boolean
  submitError: string | null
  dossierId: string | null
  reference: string | null
}

// Données envoyées au webhook n8n
export interface DossierSubmitPayload {
  avocatSlug: string
  demandeur: CreateClientInput
  conjoint: ConjointData
  mariage: MariageInfo
  enfants: EnfantData[]
  patrimoine: PatrimoineData
  documents: {
    type: DocumentType
    nom: string
    cheminStockage: string
    hash: string
  }[]
  consentement: ConsentementData
  metadata: {
    submittedAt: string
    userAgent: string
    ip: string
  }
}
