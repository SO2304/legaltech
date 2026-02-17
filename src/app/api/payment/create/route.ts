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
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(dossier.montantTTC * 100),
      currency: 'eur',
      metadata: { dossierId: dossier.id },
      automatic_payment_methods: { enabled: true }
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
    return NextResponse.json({ error: 'Erreur paiement' }, { status: 500 })
  }
}
