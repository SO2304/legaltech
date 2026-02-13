// ============================================
// TYPES COMMUNS - DIVORCE SAAS LEGALTECH
// ============================================

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export interface WithId {
  id: string
}

export interface Timestamps {
  createdAt: Date
  updatedAt: Date
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Types pour les réponses API
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Pagination
export interface PaginationParams {
  page?: number
  limit?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
