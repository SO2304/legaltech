// ============================================
// API - CRÉATION DOSSIER CLIENT (MULTI-JURIDICTION)
// POST /api/scan/create
// Prix adapté selon le pays: FR(149€), BE(159€), CH(149CHF), LU(169€)
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { PRICES, COMMISSION_RATE, type CountryCode } from '@/lib/countries'

// Durée de rétention en jours
const RETENTION_DAYS = 7

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      lawyerId,
      country = 'FR',
      clientName,
      clientEmail,
      clientPhone,
      clientPostalCode,
      clientCity,
      caseType,
      caseSubType,
      caseDescription,
    } = body
    
    // Validation
    if (!lawyerId || !clientName || !clientEmail) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      )
    }
    
    // Valider le pays
    const validCountries = ['FR', 'BE', 'CH', 'LU']
    if (!validCountries.includes(country)) {
      return NextResponse.json(
        { success: false, error: 'Pays non supporté' },
        { status: 400 }
      )
    }
    
    const countryCode = country as CountryCode
    
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
    
    // Récupérer le prix selon le pays
    const priceConfig = PRICES[countryCode]
    const commissionAmount = Math.round(priceConfig.amount * COMMISSION_RATE)
    
    // Générer une référence unique
    const reference = `FJ-${country}-${nanoid(6).toUpperCase()}`
    
    // Calculer la date de purge (J+7)
    const purgeAt = new Date()
    purgeAt.setDate(purgeAt.getDate() + RETENTION_DAYS)
    
    // Créer le dossier
    const newCase = await prisma.case.create({
      data: {
        reference,
        lawyerId,
        country: countryCode,
        clientName,
        clientEmail,
        clientPhone,
        clientPostalCode,
        clientCity,
        caseType,
        caseSubType,
        caseDescription,
        status: 'pending',
        paymentStatus: 'pending',
        // Prix selon le pays
        priceCents: priceConfig.amount,
        priceCurrency: priceConfig.currency,
        // Commission
        commissionAmount,
        commissionCurrency: priceConfig.currency,
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
        country: countryCode,
        metadata: JSON.stringify({ 
          reference, 
          clientEmail,
          country: countryCode,
          price: priceConfig.display,
          purgeAt: purgeAt.toISOString(),
        }),
      },
    })
    
    return NextResponse.json({
      success: true,
      case: {
        id: newCase.id,
        reference: newCase.reference,
        country: countryCode,
        priceCents: priceConfig.amount,
        priceDisplay: priceConfig.display,
        currency: priceConfig.currency,
        commissionCents: commissionAmount,
        commissionDisplay: `${(commissionAmount / 100).toFixed(2)} ${priceConfig.currency}`,
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
