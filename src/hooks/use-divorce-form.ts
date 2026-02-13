// ============================================
// STORE ZUSTAND - ÉTAT DU FORMULAIRE
// Gestion centralisée de l'état multi-étapes
// ============================================

import { create } from 'zustand'
import type { 
  FormStep, 
  DivorceFormData, 
  StepValidation,
  DocumentType 
} from '@/types'
import type { CreateClientInput } from '@/types/client'
import type { ConjointData, EnfantData, PatrimoineData, MariageInfo } from '@/types/dossier'

interface FormState {
  // État courant
  currentStep: FormStep
  completedSteps: FormStep[]
  isSubmitting: boolean
  submitError: string | null
  
  // Données du formulaire
  data: Partial<DivorceFormData>
  
  // Métadonnées
  avocatSlug: string | null
  dossierId: string | null
  reference: string | null
  
  // Validation par étape
  validations: Record<FormStep, StepValidation>
  
  // Actions
  setCurrentStep: (step: FormStep) => void
  completeStep: (step: FormStep) => void
  updateData: (data: Partial<DivorceFormData>) => void
  setDemandeur: (demandeur: CreateClientInput) => void
  setConjoint: (conjoint: ConjointData) => void
  setMariage: (mariage: MariageInfo) => void
  setEnfants: (enfants: EnfantData[], hasEnfants: boolean) => void
  setPatrimoine: (patrimoine: PatrimoineData, hasPatrimoine: boolean) => void
  addDocument: (type: DocumentType, file: File) => void
  removeDocument: (type: DocumentType) => void
  setConsentement: (accepted: boolean, ip: string) => void
  setValidation: (step: FormStep, validation: StepValidation) => void
  setSubmitting: (submitting: boolean) => void
  setSubmitError: (error: string | null) => void
  setDossierCreated: (dossierId: string, reference: string) => void
  reset: () => void
  goToNextStep: () => void
  goToPreviousStep: () => void
}

const FORM_STEPS_ORDER: FormStep[] = [
  'demandeur',
  'conjoint', 
  'mariage',
  'enfants',
  'patrimoine',
  'documents',
  'recapitulatif',
  'confirmation',
]

const initialState = {
  currentStep: 'demandeur' as FormStep,
  completedSteps: [] as FormStep[],
  isSubmitting: false,
  submitError: null,
  data: {
    demandeur: undefined,
    conjoint: undefined,
    mariage: undefined,
    enfants: [],
    hasEnfants: false,
    patrimoine: undefined,
    hasPatrimoine: false,
    documents: [],
    consentement: {
      accepte: false,
      date: '',
      ip: '',
    },
  },
  avocatSlug: null,
  dossierId: null,
  reference: null,
  validations: {} as Record<FormStep, StepValidation>,
}

export const useDivorceForm = create<FormState>((set, get) => ({
  ...initialState,
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  completeStep: (step) => set((state) => ({
    completedSteps: state.completedSteps.includes(step) 
      ? state.completedSteps 
      : [...state.completedSteps, step],
  })),
  
  updateData: (data) => set((state) => ({
    data: { ...state.data, ...data },
  })),
  
  setDemandeur: (demandeur) => set((state) => ({
    data: { ...state.data, demandeur },
  })),
  
  setConjoint: (conjoint) => set((state) => ({
    data: { ...state.data, conjoint },
  })),
  
  setMariage: (mariage) => set((state) => ({
    data: { ...state.data, mariage },
  })),
  
  setEnfants: (enfants, hasEnfants) => set((state) => ({
    data: { ...state.data, enfants, hasEnfants },
  })),
  
  setPatrimoine: (patrimoine, hasPatrimoine) => set((state) => ({
    data: { ...state.data, patrimoine, hasPatrimoine },
  })),
  
  addDocument: (type, file) => set((state) => {
    const documents = [...(state.data.documents || [])]
    const existingIndex = documents.findIndex(d => d.type === type)
    
    if (existingIndex >= 0) {
      documents[existingIndex] = { ...documents[existingIndex], file, uploaded: false }
    } else {
      documents.push({ type, file, uploaded: false, uploadProgress: 0, error: null })
    }
    
    return { data: { ...state.data, documents } }
  }),
  
  removeDocument: (type) => set((state) => ({
    data: { 
      ...state.data, 
      documents: (state.data.documents || []).filter(d => d.type !== type) 
    },
  })),
  
  setConsentement: (accepte, ip) => set((state) => ({
    data: {
      ...state.data,
      consentement: {
        accepte,
        date: new Date().toISOString(),
        ip,
      },
    },
  })),
  
  setValidation: (step, validation) => set((state) => ({
    validations: { ...state.validations, [step]: validation },
  })),
  
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  
  setSubmitError: (submitError) => set({ submitError }),
  
  setDossierCreated: (dossierId, reference) => set({ dossierId, reference }),
  
  reset: () => set(initialState),
  
  goToNextStep: () => {
    const { currentStep } = get()
    const currentIndex = FORM_STEPS_ORDER.indexOf(currentStep)
    if (currentIndex < FORM_STEPS_ORDER.length - 1) {
      const nextStep = FORM_STEPS_ORDER[currentIndex + 1]
      set({ 
        currentStep: nextStep,
        completedSteps: get().completedSteps.includes(currentStep) 
          ? get().completedSteps 
          : [...get().completedSteps, currentStep],
      })
    }
  },
  
  goToPreviousStep: () => {
    const { currentStep } = get()
    const currentIndex = FORM_STEPS_ORDER.indexOf(currentStep)
    if (currentIndex > 0) {
      set({ currentStep: FORM_STEPS_ORDER[currentIndex - 1] })
    }
  },
}))
