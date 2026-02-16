// ============================================
// TYPES API - Réponses standardisées
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  success: false
  error: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Helper types
export type ApiSuccess<T> = {
  success: true
  data: T
  message?: string
}

export type ApiResult<T> = ApiSuccess<T> | ApiError
