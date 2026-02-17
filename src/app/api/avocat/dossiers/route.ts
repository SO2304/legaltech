import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const avocatId = searchParams.get('avocatId')

    if (!avocatId) {
      return NextResponse.json(
        { error: 'ID avocat requis' },
        { status: 400 }
      )
    }

    const dossiers = await prisma.dossier.findMany({
      where: { avocatId },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            pays: true
          }
        },
        documents: {
          select: {
            id: true,
            type: true,
            nomOriginal: true,
            estValide: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ dossiers })
  } catch (error) {
    console.error('Error fetching dossiers:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des dossiers' },
      { status: 500 }
    )
  }
}
