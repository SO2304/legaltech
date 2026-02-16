import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { DossierStatus } from '@prisma/client'

/**
 * API POST /api/payment/create
 * Crée un Payment Intent Stripe pour un dossier de divorce
 */
export async function POST(request: NextRequest) {
  try {
    const { dossierId } = await request.json()

    if (!dossierId) {
      return NextResponse.json(
        { error: 'dossierId requis' },
        { status: 400 }
      )
    }

    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: { client: true }
    })

    if (!dossier) {
      return NextResponse.json(
        { error: 'Dossier introuvable' },
        { status: 404 }
      )
    }

    if (dossier.stripePaid) {
      return NextResponse.json(
        { error: 'Ce dossier est déjà payé' },
        { status: 400 }
      )
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY manquante')
      return NextResponse.json(
        { error: 'Configuration Stripe manquante' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-01-27.acacia' as any
    })

    // Montant en centimes (149€ par défaut pour l'instant)
    const amount = 14900

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        dossierId: dossier.id,
        clientId: dossier.clientId,
        pays: dossier.pays,
        reference: dossier.reference
      },
      description: `Dossier divorce ${dossier.reference} - ${dossier.pays}`
    })

    await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        stripePaymentIntent: paymentIntent.id,
        statut: DossierStatus.EN_ATTENTE_PAIEMENT
      }
    })

    console.log(`✅ Payment Intent créé: ${paymentIntent.id} pour dossier ${dossierId}`)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount
    })

  } catch (error: any) {
    console.error('❌ Erreur création Payment Intent:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du paiement' },
      { status: 500 }
    )
  }
}
