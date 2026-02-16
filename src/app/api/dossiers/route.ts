import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        // En prod, on filtrerait par l'ID de l'avocat connecté (via session)
        // Pour le MVP/Démo, on récupère tous les dossiers payés ou en analyse
        const dossiers = await prisma.dossier.findMany({
            where: {
                statut: {
                    in: ['PAYE', 'EN_ANALYSE', 'ANALYSE_TERMINEE']
                }
            },
            include: {
                client: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(dossiers)
    } catch (error) {
        console.error('Fetch dossiers list error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
