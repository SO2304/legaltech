// ============================================
// API - CRÉATION DOSSIER CLIENT
// POST /api/scan/create
// Prix: 149€ unique
// Purge: J+7 automatique
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

// Prix fixe en centimes (149€)
const PRICE_CENTS = 14900
// Commission avocat en centimes (20% de 149€ = 29.80€)
const COMMISSION_CENTS = 2980
// Durée de rétention en jours
const RETENTION_DAYS = 7

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
    
    // Calculer la date de purge (J+7)
    const purgeAt = new Date()
    purgeAt.setDate(purgeAt.getDate() + RETENTION_DAYS)
    
    // Créer le dossier avec les infos de paiement
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
        paymentStatus: 'pending',
        // Prix et commission
        commissionAmount: COMMISSION_CENTS,
        // Date de purge
        purgeAt,
      },
    })
    
    // Logger l'événement
    await prisma.event.create({
      data: {
        type: 'case_created',
        lawyerId,
        caseId: newCase.id,
        metadata: JSON.stringify({ 
          reference, 
          clientEmail,
          priceCents: PRICE_CENTS,
          purgeAt: purgeAt.toISOString(),
        }),
      },
    })
    
    return NextResponse.json({
      success: true,
      case: {
        id: newCase.id,
        reference: newCase.reference,
        priceCents: PRICE_CENTS,
        priceEuros: PRICE_CENTS / 100,
        commissionCents: COMMISSION_CENTS,
        commissionEuros: COMMISSION_CENTS / 100,
        purgeAt: purgeAt.toISOString(),
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
