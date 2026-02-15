import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { StatutDossier } from '@prisma/client'

/**
 * API POST /api/dossier/[id]/valider
 * Valide un dossier analysé par un avocat
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Récupérer le dossier
    const dossier = await prisma.dossier.findUnique({
      where: { id }
    })

    if (!dossier) {
      return NextResponse.json(
        { error: 'Dossier introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que le dossier a été analysé
    if (!dossier.analyseIA) {
      return NextResponse.json(
        { error: 'Le dossier doit être analysé avant validation' },
        { status: 400 }
      )
    }

    // Marquer comme validé
    await prisma.dossier.update({
      where: { id },
      data: {
        statut: StatutDossier.VALIDE,
        updatedAt: new Date()
      }
    })

    console.log(`✅ Dossier ${dossier.reference} validé`)

    // TODO: Envoyer email au client
    // TODO: Déclencher génération PDF final
    // TODO: Notifier système de purge (J+7)

    return NextResponse.json({
      success: true,
      message: 'Dossier validé avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur validation dossier:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la validation' },
      { status: 500 }
    )
  }
}
