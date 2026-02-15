import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { StatutDossier } from '@prisma/client'

/**
 * API POST /api/webhook/stripe
 * Webhook pour recevoir les événements Stripe (payment_intent.succeeded, etc.)
 *
 * ⚠️ IMPORTANT: Ce webhook doit être configuré dans le Dashboard Stripe
 * URL: https://votre-domaine.com/api/webhook/stripe
 * Events à écouter: payment_intent.succeeded, payment_intent.payment_failed
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer la signature Stripe
    const signature = request.headers.get('stripe-signature')
    if (!signature) {
      console.error('❌ Signature Stripe manquante')
      return NextResponse.json(
        { error: 'Signature manquante' },
        { status: 400 }
      )
    }

    // Récupérer le webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET manquante')
      return NextResponse.json(
        { error: 'Configuration webhook manquante' },
        { status: 500 }
      )
    }

    // Récupérer le body brut
    const body = await request.text()

    // Initialiser Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY manquante')
      return NextResponse.json(
        { error: 'Configuration Stripe manquante' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia'
    })

    // Vérifier la signature du webhook
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('❌ Erreur signature webhook:', err)
      return NextResponse.json(
        { error: 'Signature invalide' },
        { status: 400 }
      )
    }

    console.log(`📩 Webhook reçu: ${event.type}`)

    // Traiter les événements
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSuccess(paymentIntent)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(paymentIntent)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await handleRefund(charge)
        break
      }

      default:
        console.log(`ℹ️ Événement non géré: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Erreur webhook Stripe:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * Gérer un paiement réussi
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const dossierId = paymentIntent.metadata.dossierId

    if (!dossierId) {
      console.error('❌ dossierId manquant dans metadata')
      return
    }

    // Mettre à jour le dossier
    const dossier = await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        stripePaid: true,
        stripePaidAt: new Date(),
        stripePaymentIntent: paymentIntent.id,
        statut: StatutDossier.EN_COURS
      }
    })

    console.log(`✅ Paiement confirmé pour dossier ${dossierId} (${dossier.reference})`)

    // TODO: Envoyer email de confirmation au client
    // TODO: Notifier l'avocat qu'un nouveau dossier est payé

  } catch (error) {
    console.error('❌ Erreur handlePaymentSuccess:', error)
    throw error
  }
}

/**
 * Gérer un paiement échoué
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const dossierId = paymentIntent.metadata.dossierId

    if (!dossierId) {
      console.error('❌ dossierId manquant dans metadata')
      return
    }

    // Mettre à jour le statut
    await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        statut: StatutDossier.PAIEMENT_ECHOUE
      }
    })

    console.log(`❌ Paiement échoué pour dossier ${dossierId}`)

    // TODO: Envoyer email d'échec au client

  } catch (error) {
    console.error('❌ Erreur handlePaymentFailed:', error)
    throw error
  }
}

/**
 * Gérer un remboursement
 */
async function handleRefund(charge: Stripe.Charge) {
  try {
    const paymentIntentId = charge.payment_intent as string

    if (!paymentIntentId) {
      console.error('❌ payment_intent manquant')
      return
    }

    // Trouver le dossier
    const dossier = await prisma.dossier.findFirst({
      where: { stripePaymentIntent: paymentIntentId }
    })

    if (!dossier) {
      console.error(`❌ Dossier introuvable pour payment_intent ${paymentIntentId}`)
      return
    }

    // Mettre à jour le statut
    await prisma.dossier.update({
      where: { id: dossier.id },
      data: {
        stripePaid: false,
        statut: StatutDossier.REMBOURSE
      }
    })

    console.log(`↩️ Remboursement traité pour dossier ${dossier.id}`)

    // TODO: Envoyer email de confirmation de remboursement

  } catch (error) {
    console.error('❌ Erreur handleRefund:', error)
    throw error
  }
}
