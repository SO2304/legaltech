// ============================================
// TYPES USER - Utilisateurs FlashJuris
// ============================================

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR'

export interface User {
  id: string
  email: string
  emailVerified: Date | null
  name: string | null
  role: UserRole
  isActive: boolean

  // OAuth
  oauthProvider: string | null
  oauthId: string | null

  // 2FA
  totpEnabled: boolean

  // Metadata
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface PublicUser {
  id: string
  email: string
  name: string | null
  role: UserRole
  createdAt: Date
}

export interface CreateUserInput {
  email: string
  password: string
  name?: string
}

export interface UpdateUserInput {
  name?: string
  email?: string
  password?: string
}

export interface UserWithStats extends User {
  stats: {
    totalFlashcards: number
    totalStudySessions: number
    averageScore: number
  }
}
