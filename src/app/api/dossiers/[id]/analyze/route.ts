// ============================================
// API: ANALYSE RAG D'UN DOSSIER
// Déclenche le pipeline d'analyse GLM 5
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { analyzeDossier } from '@/lib/rag-service'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    const result = await analyzeDossier(id)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Analyse terminée avec succès',
      analysis: result.analysis,
    })
    
  } catch (error) {
    console.error('Error in analyze endpoint:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'analyse' },
      { status: 500 }
    )
  }
}

// GET pour vérifier le statut de l'analyse
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    const dossier = await prisma.dossier.findUnique({
      where: { id },
      select: {
        id: true,
        reference: true,
        statut: true,
        dateAnalyse: true,
        dateNotification: true,
        analyseIA: true,
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
    console.error('Error getting dossier status:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
