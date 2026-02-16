import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { DossierStatus } from '@prisma/client'

/**
 * API POST /api/webhook/stripe
 * Webhook pour recevoir les événements Stripe (payment_intent.succeeded, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('stripe-signature')
    if (!signature) {
      console.error('❌ Signature Stripe manquante')
      return NextResponse.json(
        { error: 'Signature manquante' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET manquante')
      return NextResponse.json(
        { error: 'Configuration webhook manquante' },
        { status: 500 }
      )
    }

    const body = await request.text()
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY manquante')
      return NextResponse.json(
        { error: 'Configuration Stripe manquante' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-01-27.acacia' as any
    })

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

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const dossierId = session.metadata?.dossierId
        if (dossierId) {
          await prisma.dossier.update({
            where: { id: dossierId },
            data: {
              stripePaid: true,
              stripePaidAt: new Date(),
              stripePaymentIntent: session.payment_intent as string,
              statut: DossierStatus.PAYE
            }
          })
          console.log(`✅ Paiement confirmé pour dossier ${dossierId}`)
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const dossierId = paymentIntent.metadata.dossierId
        if (dossierId) {
          await prisma.dossier.update({
            where: { id: dossierId },
            data: {
              stripePaid: true,
              stripePaidAt: new Date(),
              stripePaymentIntent: paymentIntent.id,
              statut: DossierStatus.PAYE
            }
          })
          console.log(`✅ PaymentIntent réussi pour dossier ${dossierId}`)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const dossierId = paymentIntent.metadata.dossierId
        if (dossierId) {
          await prisma.dossier.update({
            where: { id: dossierId },
            data: {
              statut: DossierStatus.BROUILLON // Retour au brouillon si échec
            }
          })
          console.log(`❌ Paiement échoué pour dossier ${dossierId}`)
        }
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
