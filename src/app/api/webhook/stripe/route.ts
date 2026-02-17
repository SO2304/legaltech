import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-service'
import { prisma } from '@/lib/prisma'
import { DossierStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }
    
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not defined')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }
    
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object
      const dossierId = paymentIntent.metadata.dossierId
      
      await prisma.dossier.update({
        where: { id: dossierId },
        data: {
          stripePaid: true,
          stripePaidAt: new Date(),
          statut: DossierStatus.PAYE
        }
      })
      
      // Déclencher l'analyse IA après paiement réussi
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analyse/dossier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dossierId })
      }).catch(err => console.error('Analyse trigger error:', err))
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 })
  }
}
