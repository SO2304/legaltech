import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { StatutDossier } from '@prisma/client'

/**
 * API POST /api/payment/create
 * Crée un Payment Intent Stripe pour un dossier de divorce
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer le dossierId
    const body = await request.json()
    const { dossierId } = body

    if (!dossierId) {
      return NextResponse.json(
        { error: 'dossierId requis' },
        { status: 400 }
      )
    }

    // Vérifier que le dossier existe
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: {
        client: true
      }
    })

    if (!dossier) {
      return NextResponse.json(
        { error: 'Dossier introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que le dossier n'est pas déjà payé
    if (dossier.stripePaid) {
      return NextResponse.json(
        { error: 'Ce dossier est déjà payé' },
        { status: 400 }
      )
    }

    // Initialiser Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY manquante')
      return NextResponse.json(
        { error: 'Configuration Stripe manquante' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia'
    })

    // Créer un Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 14900, // 149,00 € en centimes
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

    // Mettre à jour le dossier avec le Payment Intent ID
    await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        stripePaymentIntent: paymentIntent.id,
        statut: StatutDossier.EN_ATTENTE_PAIEMENT
      }
    })

    console.log(`✅ Payment Intent créé: ${paymentIntent.id} pour dossier ${dossierId}`)

    // Retourner le client secret
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: 14900
    })

  } catch (error) {
    console.error('❌ Erreur création Payment Intent:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    )
  }
}
