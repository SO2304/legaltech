// ============================================
// API - CRÉATION DOSSIER CLIENT
// POST /api/scan/create
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      lawyerId,
      clientName,
      clientEmail,
      clientPhone,
      caseType,
      caseDescription,
    } = body
    
    // Validation
    if (!lawyerId || !clientName || !clientEmail) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      )
    }
    
    // Vérifier que l'avocat existe
    const lawyer = await prisma.lawyer.findUnique({
      where: { id: lawyerId },
    })
    
    if (!lawyer) {
      return NextResponse.json(
        { success: false, error: 'Avocat non trouvé' },
        { status: 404 }
      )
    }
    
    // Générer une référence unique
    const reference = `FJ-${nanoid(8).toUpperCase()}`
    
    // Créer le dossier
    const newCase = await prisma.case.create({
      data: {
        reference,
        lawyerId,
        clientName,
        clientEmail,
        clientPhone,
        caseType,
        caseDescription,
        status: 'pending',
      },
    })
    
    // Logger l'événement
    await prisma.event.create({
      data: {
        type: 'case_created',
        lawyerId,
        caseId: newCase.id,
        metadata: JSON.stringify({ reference, clientEmail }),
      },
    })
    
    return NextResponse.json({
      success: true,
      case: {
        id: newCase.id,
        reference: newCase.reference,
      },
    })
    
  } catch (error) {
    console.error('Error creating case:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du dossier' },
      { status: 500 }
    )
  }
}
