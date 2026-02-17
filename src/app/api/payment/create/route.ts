import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-service'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { dossierId } = await request.json()
    
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId }
    })
    
    if (!dossier) {
      return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })
    }
    
    // Idempotence: Check if a valid payment intent already exists
    if (dossier.stripePaymentIntent && !dossier.stripePaid) {
      // Try to retrieve the existing payment intent to get its client secret
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(dossier.stripePaymentIntent)
        // If intent is in a valid state (requires_payment_method or processing), return it
        if (existingIntent.status === 'requires_payment_method' || existingIntent.status === 'processing') {
          return NextResponse.json({ clientSecret: existingIntent.client_secret, idempotent: true })
        }
      } catch (e) {
        // Payment intent might have expired or not exist, create a new one
        console.log('Existing payment intent not found or expired, creating new one')
      }
    }
    
    // Create idempotency key based on dossier ID and timestamp
    const idempotencyKey = `payment_${dossierId}_${Date.now()}`
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(dossier.montantTTC * 100),
      currency: 'eur',
      metadata: { dossierId: dossier.id },
      automatic_payment_methods: { enabled: true }
    }, {
      idempotencyKey
    })
    
    await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        stripePaymentIntent: paymentIntent.id,
        statut: 'EN_ATTENTE_PAIEMENT'
      }
    })
    
    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: 'Erreur paiement' }, { status: 500 })
  }
}
