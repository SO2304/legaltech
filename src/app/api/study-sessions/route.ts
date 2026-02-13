// ============================================
// API: STUDY SESSIONS (POST, GET)
// Créer et lister les sessions d'étude
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { withRateLimit, MODERATE_RATE_LIMIT } from '@/lib/rate-limit'
import { z } from 'zod'
import type { ApiResponse } from '@/types'

// Schéma de création de session
const createSessionSchema = z.object({
  category: z.string().optional(),
  difficulty: z.string().optional(),
  dueOnly: z.boolean().default(true),
  limit: z.number().min(1).max(50).default(20),
})

/**
 * POST /api/study-sessions
 * Démarrer une nouvelle session d'étude
 */
async function POST_handler(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const validated = createSessionSchema.parse(body)

    // TODO: Récupérer l'userId de la session (auth)
    const userId = 'temp-user-id'

    // Construction des filtres pour les flashcards
    const where: any = {
      userId,
      isArchived: false,
    }

    if (validated.category) where.category = validated.category
    if (validated.difficulty) where.difficulty = validated.difficulty
    if (validated.dueOnly) {
      where.nextReviewDate = {
        lte: new Date(),
      }
    }

    // Récupérer les flashcards à réviser
    const flashcards = await prisma.flashcard.findMany({
      where,
      take: validated.limit,
      orderBy: { nextReviewDate: 'asc' },
      select: { id: true },
    })

    if (flashcards.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aucune flashcard à réviser pour le moment',
        },
        { status: 404 }
      )
    }

    // Créer la session
    const session = await prisma.studySession.create({
      data: {
        userId,
        startedAt: new Date(),
      },
    })

    const duration = Date.now() - startTime
    logger.httpRequest('POST', '/api/study-sessions', 201, duration, {
      flashcards: flashcards.length,
    })

    const response: ApiResponse = {
      success: true,
      data: {
        session: {
          id: session.id,
          startedAt: session.startedAt,
        },
        flashcards,
      },
      message: 'Session créée avec succès',
    }

    return NextResponse.json(response, { status: 201 })
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

    logger.error('Error creating study session', error as Error, { duration })

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la création de la session',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/study-sessions
 * Lister les sessions d'étude
 */
async function GET_handler(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    // TODO: Récupérer l'userId de la session (auth)
    const userId = 'temp-user-id'

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [sessions, total] = await Promise.all([
      prisma.studySession.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          cards: {
            include: {
              flashcard: {
                select: {
                  id: true,
                  question: true,
                  category: true,
                },
              },
            },
          },
        },
      }),
      prisma.studySession.count({ where: { userId } }),
    ])

    const duration = Date.now() - startTime
    logger.httpRequest('GET', '/api/study-sessions', 200, duration)

    return NextResponse.json({
      success: true,
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Error fetching study sessions', error as Error, { duration })

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des sessions',
      },
      { status: 500 }
    )
  }
}

// Export avec rate limiting
export const POST = withRateLimit(POST_handler, MODERATE_RATE_LIMIT)
export const GET = withRateLimit(GET_handler, MODERATE_RATE_LIMIT)
