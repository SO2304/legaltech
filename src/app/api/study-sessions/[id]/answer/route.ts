// ============================================
// API: STUDY SESSION ANSWER
// Enregistrer une réponse pour une flashcard
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const answerSchema = z.object({
  flashcardId: z.string(),
  wasCorrect: z.boolean(),
  responseTime: z.number().min(0),
  confidence: z.number().min(1).max(5).optional(),
})

/**
 * POST /api/study-sessions/[id]/answer
 * Enregistrer une réponse
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const validated = answerSchema.parse(body)

    // Vérifier que la session existe
    const session = await prisma.studySession.findUnique({
      where: { id: params.id },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session non trouvée' },
        { status: 404 }
      )
    }

    // Enregistrer la réponse
    const answer = await prisma.studySessionCard.create({
      data: {
        sessionId: params.id,
        flashcardId: validated.flashcardId,
        wasCorrect: validated.wasCorrect,
        responseTime: validated.responseTime,
        confidence: validated.confidence,
      },
    })

    // Mettre à jour les stats de la flashcard
    const flashcard = await prisma.flashcard.findUnique({
      where: { id: validated.flashcardId },
    })

    if (flashcard) {
      // Algorithme de répétition espacée (SM-2 simplifié)
      const newTimesReviewed = flashcard.timesReviewed + 1
      const newTimesCorrect = flashcard.timesCorrect + (validated.wasCorrect ? 1 : 0)
      const newTimesIncorrect = flashcard.timesIncorrect + (validated.wasCorrect ? 0 : 1)

      let newEaseFactor = flashcard.easeFactor
      let newInterval = flashcard.interval

      if (validated.wasCorrect) {
        newInterval = Math.round(newInterval * newEaseFactor)
        newEaseFactor = Math.min(2.5, newEaseFactor + 0.1)
      } else {
        newInterval = 1
        newEaseFactor = Math.max(1.3, newEaseFactor - 0.2)
      }

      const nextReviewDate = new Date()
      nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)

      await prisma.flashcard.update({
        where: { id: validated.flashcardId },
        data: {
          timesReviewed: newTimesReviewed,
          timesCorrect: newTimesCorrect,
          timesIncorrect: newTimesIncorrect,
          easeFactor: newEaseFactor,
          interval: newInterval,
          nextReviewDate,
        },
      })
    }

    // Mettre à jour les stats de la session
    await prisma.studySession.update({
      where: { id: params.id },
      data: {
        cardsStudied: { increment: 1 },
        cardsCorrect: validated.wasCorrect ? { increment: 1 } : undefined,
        cardsIncorrect: !validated.wasCorrect ? { increment: 1 } : undefined,
      },
    })

    const duration = Date.now() - startTime
    logger.httpRequest('POST', `/api/study-sessions/${params.id}/answer`, 200, duration)

    return NextResponse.json({
      success: true,
      data: answer,
      message: 'Réponse enregistrée',
    })
  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    logger.error(`Error recording answer for session ${params.id}`, error as Error, { duration })

    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'enregistrement de la réponse' },
      { status: 500 }
    )
  }
}
