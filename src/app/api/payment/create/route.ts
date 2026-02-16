import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createDossierCheckoutSession } from '@/lib/stripe-service'
import { getPriceForPays } from '@/lib/geo-service'

export async function POST(request: NextRequest) {
    try {
        const { dossierId } = await request.json()

        if (!dossierId) {
            return NextResponse.json(
                { error: 'ID du dossier manquant' },
                { status: 400 }
            )
        }

        // 1. Récupérer le dossier et le client
        const dossier = await prisma.dossier.findUnique({
            where: { id: dossierId },
            include: { client: true }
        })

        if (!dossier) {
            return NextResponse.json(
                { error: 'Dossier non trouvé' },
                { status: 404 }
            )
        }

        // 2. Calculer le prix (Session 5 logic: 149€ par défaut ou via geo-service)
        const amount = getPriceForPays(dossier.pays)
        const currency = dossier.pays === 'SUISSE' ? 'CHF' : 'EUR'

        // 3. Créer la session Stripe
        const session = await createDossierCheckoutSession(
            dossier.id,
            amount,
            currency,
            dossier.client.email
        )

        // 4. Mettre à jour le statut du dossier
        await prisma.dossier.update({
            where: { id: dossier.id },
            data: {
                statut: 'EN_ATTENTE_PAIEMENT',
                montantTTC: amount
            }
        })

        return NextResponse.json({ url: session.url })

    } catch (error: any) {
        console.error('Stripe Session Error:', error)
        return NextResponse.json(
            { error: error.message || 'Erreur lors de la création du paiement' },
            { status: 500 }
        )
    }
}
