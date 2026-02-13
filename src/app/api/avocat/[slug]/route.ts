// ============================================
// API: RÉCUPÉRATION AVOCAT PAR SLUG
// Route publique pour le formulaire client
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params
    
    const avocat = await prisma.avocat.findUnique({
      where: { 
        slug,
        isActive: true,
      },
      select: {
        slug: true,
        nom: true,
        prenom: true,
        cabinet: true,
        adresse: true,
        codePostal: true,
        ville: true,
        telephone: true,
        commissionRate: true,
      },
    })
    
    if (!avocat) {
      return NextResponse.json(
        { success: false, error: 'Avocat non trouvé' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: avocat,
    })
    
  } catch (error) {
    console.error('Error fetching avocat:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
