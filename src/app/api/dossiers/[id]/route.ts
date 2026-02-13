// ============================================
// API: RÉCUPÉRATION DOSSIER PAR ID
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    const dossier = await prisma.dossier.findUnique({
      where: { id },
      include: {
        client: true,
        documents: {
          where: { estPurge: false },
        },
        avocat: {
          select: {
            slug: true,
            nom: true,
            prenom: true,
            cabinet: true,
            email: true,
          },
        },
      },
    })
    
    if (!dossier) {
      return NextResponse.json(
        { success: false, error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: dossier,
    })
    
  } catch (error) {
    console.error('Error fetching dossier:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
