import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id

        const dossier = await prisma.dossier.findUnique({
            where: { id },
            include: {
                client: true,
                documents: true
            }
        })

        if (!dossier) {
            return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
        }

        return NextResponse.json(dossier)
    } catch (error) {
        console.error('Fetch dossier error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
