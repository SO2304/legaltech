// ============================================
// TYPES FLASHCARD - Cartes de révision
// ============================================

export type FlashcardCategory =
  | 'DROIT_CIVIL'
  | 'DROIT_PENAL'
  | 'DROIT_ADMINISTRATIF'
  | 'DROIT_CONSTITUTIONNEL'
  | 'DROIT_COMMERCIAL'
  | 'DROIT_TRAVAIL'
  | 'DROIT_FAMILLE'
  | 'DROIT_INTERNATIONAL'
  | 'PROCEDURE_CIVILE'
  | 'PROCEDURE_PENALE'
  | 'AUTRES'

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'

export interface Flashcard {
  id: string

  // Contenu
  question: string
  answer: string
  explanation: string | null

  // Catégorisation
  category: FlashcardCategory
  subCategory: string | null
  difficulty: DifficultyLevel
  tags: string[]

  // Source juridique
  legalReference: string | null
  articleNumber: string | null
  jurisprudence: string | null

  // Statistiques
  timesReviewed: number
  timesCorrect: number
  timesIncorrect: number
  averageTime: number | null

  // Spaced repetition
  easeFactor: number
  interval: number
  nextReviewDate: Date

  // Metadata
  isPublic: boolean
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface CreateFlashcardInput {
  question: string
  answer: string
  explanation?: string
  category: FlashcardCategory
  subCategory?: string
  difficulty?: DifficultyLevel
  tags?: string[]
  legalReference?: string
  articleNumber?: string
  jurisprudence?: string
  isPublic?: boolean
}

export interface UpdateFlashcardInput {
  question?: string
  answer?: string
  explanation?: string
  category?: FlashcardCategory
  subCategory?: string
  difficulty?: DifficultyLevel
  tags?: string[]
  legalReference?: string
  articleNumber?: string
  jurisprudence?: string
  isArchived?: boolean
}

export interface FlashcardFilters {
  category?: FlashcardCategory
  difficulty?: DifficultyLevel
  tags?: string[]
  isArchived?: boolean
  search?: string
}

// Labels pour l'affichage
export const CATEGORY_LABELS: Record<FlashcardCategory, string> = {
  DROIT_CIVIL: 'Droit Civil',
  DROIT_PENAL: 'Droit Pénal',
  DROIT_ADMINISTRATIF: 'Droit Administratif',
  DROIT_CONSTITUTIONNEL: 'Droit Constitutionnel',
  DROIT_COMMERCIAL: 'Droit Commercial',
  DROIT_TRAVAIL: 'Droit du Travail',
  DROIT_FAMILLE: 'Droit de la Famille',
  DROIT_INTERNATIONAL: 'Droit International',
  PROCEDURE_CIVILE: 'Procédure Civile',
  PROCEDURE_PENALE: 'Procédure Pénale',
  AUTRES: 'Autres',
}

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  EASY: 'Facile',
  MEDIUM: 'Moyen',
  HARD: 'Difficile',
  EXPERT: 'Expert',
}
