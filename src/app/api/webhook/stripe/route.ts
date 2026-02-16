import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { genererSyntheseDossier } from '@/lib/analysis-service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-04-10' as any,
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature') as string

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`)
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    // Gérer l'événement 'checkout.session.completed'
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        const dossierId = session.metadata?.dossierId

        if (dossierId) {
            console.log(`Paiement confirmé pour le dossier: ${dossierId}`)

            try {
                // 1. Mettre à jour le paiement en DB
                await prisma.dossier.update({
                    where: { id: dossierId },
                    data: {
                        statut: 'PAYE',
                        stripePaid: true,
                        stripePaidAt: new Date()
                    }
                })

                // 2. Déclencher l'analyse IA (en arrière-plan pour ne pas bloquer le webhook)
                // Note: Dans un environnement de prod scale, on utiliserait un worker/queue
                genererSyntheseDossier(dossierId).catch(err => {
                    console.error(`Erreur analyse IA dossier ${dossierId}:`, err)
                })

            } catch (err) {
                console.error(`Erreur traitement webhook dossier ${dossierId}:`, err)
            }
        }
    }

    return NextResponse.json({ received: true })
}
