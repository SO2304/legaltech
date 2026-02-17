import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const avocatId = searchParams.get('avocatId')
    const dossierId = searchParams.get('id')
    
    // Get single dossier by ID
    if (dossierId) {
      const dossier = await prisma.dossier.findUnique({
        where: { id: dossierId },
        include: {
          client: { select: { id: true, email: true, nom: true, prenom: true, telephone: true, pays: true } },
          documents: true
        }
      })
      if (!dossier) {
        return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })
      }
      return NextResponse.json({ dossier })
    }
    
    // Get all dossiers for an avocat
    if (!avocatId) return NextResponse.json({ error: 'avocatId requis' }, { status: 400 })

    const dossiers = await prisma.dossier.findMany({
      where: { avocatId },
      include: {
        client: { select: { email: true, nom: true, prenom: true, pays: true } },
        documents: { select: { id: true, type: true, nomOriginal: true, estValide: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ dossiers })
  } catch (error) {
    console.error('Dossiers error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
