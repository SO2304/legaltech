import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-service'
import { prisma } from '@/lib/prisma'
import { DossierStatus } from '@prisma/client'

// Retry helper with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) {
        return response
      }
      console.error(`Attempt ${attempt} failed with status: ${response.status}`)
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${attempt} error:`, error)
    }
    
    // Wait before retry (exponential backoff: 1s, 2s, 4s)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000))
    }
  }
  
  throw lastError || new Error('All retries failed')
}

// Trigger IA analysis after successful payment
async function triggerAnalyse(dossierId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    console.error('NEXT_PUBLIC_APP_URL not configured')
    return
  }
  
  try {
    await fetchWithRetry(`${appUrl}/api/analyse/dossier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dossierId })
    }, 3)
    console.log(`Analyse triggered successfully for dossier ${dossierId}`)
  } catch (error) {
    console.error('Analyse trigger failed after retries:', error)
    // Log for manual retry if needed
    console.log(`MANUAL_RETRY_NEEDED: analyse dossier ${dossierId}`)
  }
}

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
      
      // Déclencher l'analyse IA après paiement réussi (avec retry)
      triggerAnalyse(dossierId)
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 })
  }
}
