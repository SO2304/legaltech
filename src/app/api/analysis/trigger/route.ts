// ============================================
// API - DÉCLENCHEMENT ANALYSE IA
// POST /api/analysis/trigger
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeDocuments } from '@/lib/analysis-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caseId } = body
    
    if (!caseId) {
      return NextResponse.json(
        { success: false, error: 'ID dossier manquant' },
        { status: 400 }
      )
    }
    
    // Récupérer le dossier avec documents et avocat
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        documents: true,
        lawyer: true,
      },
    })
    
    if (!caseData) {
      return NextResponse.json(
        { success: false, error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }
    
    // Créer l'entrée analyse
    const analysis = await prisma.analysis.create({
      data: {
        caseId,
        status: 'processing',
        aiModel: 'glm-5',
      },
    })
    
    // Lancer l'analyse (en arrière-plan)
    analyzeDocuments(caseId, caseData).catch(async (error) => {
      console.error('Analysis error:', error)
      
      // Marquer l'analyse comme échouée
      await prisma.analysis.update({
        where: { caseId },
        data: {
          status: 'failed',
          error: error.message || 'Erreur lors de l\'analyse',
        },
      })
    })
    
    return NextResponse.json({
      success: true,
      message: 'Analyse en cours',
      analysisId: analysis.id,
    })
    
  } catch (error) {
    console.error('Error triggering analysis:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du déclenchement' },
      { status: 500 }
    )
  }
}
