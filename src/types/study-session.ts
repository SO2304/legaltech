// ============================================
// TYPES STUDY SESSION - Sessions d'étude
// ============================================

export interface StudySession {
  id: string

  // Session info
  startedAt: Date
  endedAt: Date | null
  duration: number | null

  // Statistiques
  cardsStudied: number
  cardsCorrect: number
  cardsIncorrect: number
  cardsSkipped: number

  // Performance
  averageTime: number | null
  score: number | null

  // Relations
  userId: string
}

export interface StudySessionCard {
  id: string

  // Résultat
  wasCorrect: boolean | null
  wasSkipped: boolean
  responseTime: number | null
  confidence: number | null

  // Timestamp
  answeredAt: Date

  // Relations
  sessionId: string
  flashcardId: string
}

export interface StudySessionWithCards extends StudySession {
  cards: Array<
    StudySessionCard & {
      flashcard: {
        id: string
        question: string
        answer: string
        category: string
      }
    }
  >
}

export interface CreateStudySessionInput {
  filters?: {
    category?: string
    difficulty?: string
    dueOnly?: boolean
  }
  limit?: number
}

export interface RecordAnswerInput {
  flashcardId: string
  wasCorrect: boolean
  responseTime: number
  confidence?: number
}

export interface StudySessionStats {
  totalSessions: number
  totalCardsStudied: number
  averageScore: number
  averageSessionDuration: number
  streakDays: number
  lastSessionDate: Date | null
}
