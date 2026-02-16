// ============================================
// API: FLASHCARD [ID] (GET, PATCH, DELETE)
// Opérations sur une flashcard spécifique
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { withRateLimit, MODERATE_RATE_LIMIT } from '@/lib/rate-limit'
import { z } from 'zod'
import type { ApiResponse } from '@/types'

// Schéma de mise à jour
const updateFlashcardSchema = z.object({
  question: z.string().min(5).optional(),
  answer: z.string().min(5).optional(),
  explanation: z.string().optional().nullable(),
  category: z.enum([
    'DROIT_CIVIL',
    'DROIT_PENAL',
    'DROIT_ADMINISTRATIF',
    'DROIT_CONSTITUTIONNEL',
    'DROIT_COMMERCIAL',
    'DROIT_TRAVAIL',
    'DROIT_FAMILLE',
    'DROIT_INTERNATIONAL',
    'PROCEDURE_CIVILE',
    'PROCEDURE_PENALE',
    'AUTRES',
  ]).optional(),
  subCategory: z.string().optional().nullable(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional(),
  tags: z.array(z.string()).optional(),
  legalReference: z.string().optional().nullable(),
  articleNumber: z.string().optional().nullable(),
  jurisprudence: z.string().optional().nullable(),
  isArchived: z.boolean().optional(),
})

/**
 * GET /api/flashcards/[id]
 * Récupérer une flashcard par ID
 */
async function GET_handler(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    const flashcard = await prisma.flashcard.findUnique({
      where: { id: params.id },
    })

    if (!flashcard) {
      return NextResponse.json(
        {
          success: false,
          error: 'Flashcard non trouvée',
        },
        { status: 404 }
      )
    }

    const duration = Date.now() - startTime
    logger.httpRequest('GET', `/api/flashcards/${params.id}`, 200, duration)

    const response: ApiResponse = {
      success: true,
      data: flashcard,
    }

    return NextResponse.json(response)
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(`Error fetching flashcard ${params.id}`, error as Error, { duration })

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération de la flashcard',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/flashcards/[id]
 * Mettre à jour une flashcard
 */
async function PATCH_handler(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const validated = updateFlashcardSchema.parse(body)

    // Vérifier que la flashcard existe
    const existing = await prisma.flashcard.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Flashcard non trouvée',
        },
        { status: 404 }
      )
    }

    // TODO: Vérifier que l'utilisateur est propriétaire
    // if (existing.userId !== currentUserId) return 403

    // Mettre à jour
    const updated = await prisma.flashcard.update({
      where: { id: params.id },
      data: validated,
    })

    const duration = Date.now() - startTime
    logger.httpRequest('PATCH', `/api/flashcards/${params.id}`, 200, duration)

    const response: ApiResponse = {
      success: true,
      data: updated,
      message: 'Flashcard mise à jour avec succès',
    }

    return NextResponse.json(response)
  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données invalides',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    logger.error(`Error updating flashcard ${params.id}`, error as Error, { duration })

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la mise à jour de la flashcard',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/flashcards/[id]
 * Supprimer une flashcard
 */
async function DELETE_handler(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    // Vérifier que la flashcard existe
    const existing = await prisma.flashcard.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Flashcard non trouvée',
        },
        { status: 404 }
      )
    }

    // TODO: Vérifier que l'utilisateur est propriétaire

    // Supprimer
    await prisma.flashcard.delete({
      where: { id: params.id },
    })

    const duration = Date.now() - startTime
    logger.httpRequest('DELETE', `/api/flashcards/${params.id}`, 200, duration)

    const response: ApiResponse = {
      success: true,
      message: 'Flashcard supprimée avec succès',
    }

    return NextResponse.json(response)
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(`Error deleting flashcard ${params.id}`, error as Error, { duration })

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la suppression de la flashcard',
      },
      { status: 500 }
    )
  }
}

// Export avec rate limiting
export const GET = withRateLimit(GET_handler, MODERATE_RATE_LIMIT)
export const PATCH = withRateLimit(PATCH_handler, MODERATE_RATE_LIMIT)
export const DELETE = withRateLimit(DELETE_handler, MODERATE_RATE_LIMIT)
