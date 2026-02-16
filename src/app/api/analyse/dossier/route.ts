import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { genererSyntheseDossier } from '@/lib/analysis-service'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { dossierId } = body

        if (!dossierId) {
            return NextResponse.json({ error: 'Missing dossierId' }, { status: 400 })
        }

        // Fetch dossier to check status
        const dossier = await prisma.dossier.findUnique({
            where: { id: dossierId }
        })

        if (!dossier) {
            return NextResponse.json({ error: 'Dossier not found' }, { status: 404 })
        }

        if (!dossier.stripePaid) {
            return NextResponse.json({ error: 'Dossier not paid' }, { status: 403 })
        }

        // Trigger analysis
        // Update status to EN_ANALYSE
        await prisma.dossier.update({
            where: { id: dossierId },
            data: { statut: 'EN_ANALYSE' }
        })

        // In a real app, this might be a queue. Here we call the service.
        // We await it for this simplified implementation, or fire and forget.
        genererSyntheseDossier(dossierId).catch(err => {
            console.error(`Error in analysis for dossier ${dossierId}:`, err)
        })

        return NextResponse.json({ success: true, message: 'Analysis started' })
    } catch (error: any) {
        console.error('Analysis API error:', error)
        return NextResponse.json({ error: 'Server error during analysis trigger' }, { status: 500 })
    }
}
