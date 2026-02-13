// ============================================
// API: FLASHCARDS (POST, GET)
// Créer et lister les flashcards
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { withRateLimit, MODERATE_RATE_LIMIT } from '@/lib/rate-limit'
import { z } from 'zod'
import type { ApiResponse, CreateFlashcardInput } from '@/types'

// Schéma de validation
const createFlashcardSchema = z.object({
  question: z.string().min(5, 'La question doit faire au moins 5 caractères'),
  answer: z.string().min(5, 'La réponse doit faire au moins 5 caractères'),
  explanation: z.string().optional(),
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
  ]),
  subCategory: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).default('MEDIUM'),
  tags: z.array(z.string()).default([]),
  legalReference: z.string().optional(),
  articleNumber: z.string().optional(),
  jurisprudence: z.string().optional(),
  isPublic: z.boolean().default(false),
})

/**
 * POST /api/flashcards
 * Créer une nouvelle flashcard
 */
async function POST_handler(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const validated = createFlashcardSchema.parse(body)

    // TODO: Récupérer l'userId de la session (auth)
    const userId = 'temp-user-id' // À remplacer par auth

    const flashcard = await prisma.flashcard.create({
      data: {
        ...validated,
        userId,
      },
    })

    const duration = Date.now() - startTime
    logger.httpRequest('POST', '/api/flashcards', 201, duration)

    const response: ApiResponse = {
      success: true,
      data: flashcard,
      message: 'Flashcard créée avec succès',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      logger.warn('Validation error on POST /api/flashcards', { errors: error.errors })
      return NextResponse.json(
        {
          success: false,
          error: 'Données invalides',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    logger.error('Error creating flashcard', error as Error, { duration })

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la création de la flashcard',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/flashcards
 * Lister les flashcards (avec filtres et pagination)
 */
async function GET_handler(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Filtres
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const isArchived = searchParams.get('archived') === 'true'
    const search = searchParams.get('search')

    // TODO: Récupérer l'userId de la session (auth)
    const userId = 'temp-user-id'

    // Construction de la requête
    const where: any = {
      userId,
      isArchived,
    }

    if (category) where.category = category
    if (difficulty) where.difficulty = difficulty
    if (search) {
      where.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Récupérer les flashcards
    const [flashcards, total] = await Promise.all([
      prisma.flashcard.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.flashcard.count({ where }),
    ])

    const duration = Date.now() - startTime
    logger.httpRequest('GET', '/api/flashcards', 200, duration, {
      filters: { category, difficulty, search },
      pagination: { page, limit },
      results: flashcards.length,
    })

    return NextResponse.json({
      success: true,
      data: flashcards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Error fetching flashcards', error as Error, { duration })

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des flashcards',
      },
      { status: 500 }
    )
  }
}

// Export avec rate limiting
export const POST = withRateLimit(POST_handler, MODERATE_RATE_LIMIT)
export const GET = withRateLimit(GET_handler, MODERATE_RATE_LIMIT)
