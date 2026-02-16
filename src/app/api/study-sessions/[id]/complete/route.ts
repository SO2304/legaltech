// ============================================
// API: COMPLETE STUDY SESSION
// Terminer une session d'étude
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * POST /api/study-sessions/[id]/complete
 * Terminer une session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()

  try {
    // Récupérer la session avec les cartes
    const session = await prisma.studySession.findUnique({
      where: { id: params.id },
      include: {
        cards: true,
      },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session non trouvée' },
        { status: 404 }
      )
    }

    if (session.endedAt) {
      return NextResponse.json(
        { success: false, error: 'Session déjà terminée' },
        { status: 400 }
      )
    }

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - session.startedAt.getTime()) / 1000)

    // Calculer les statistiques
    const totalCards = session.cards.length
    const averageTime =
      totalCards > 0
        ? session.cards.reduce((sum, card) => sum + (card.responseTime || 0), 0) / totalCards
        : null

    const score =
      totalCards > 0 ? (session.cardsCorrect / totalCards) * 100 : null

    // Mettre à jour la session
    const updated = await prisma.studySession.update({
      where: { id: params.id },
      data: {
        endedAt: endTime,
        duration,
        averageTime,
        score,
      },
    })

    const execDuration = Date.now() - startTime
    logger.httpRequest('POST', `/api/study-sessions/${params.id}/complete`, 200, execDuration)

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Session terminée avec succès',
    })
  } catch (error) {
    const execDuration = Date.now() - startTime
    logger.error(`Error completing session ${params.id}`, error as Error, { duration: execDuration })

    return NextResponse.json(
      { success: false, error: 'Erreur lors de la finalisation de la session' },
      { status: 500 }
    )
  }
}
