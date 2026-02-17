import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyserDossierComplet } from '@/lib/rag-service'

export async function POST(request: NextRequest) {
  try {
    const { dossierId } = await request.json()
    
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: { documents: true }
    })
    
    if (!dossier) {
      return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })
    }
    
    await prisma.dossier.update({
      where: { id: dossierId },
      data: { statut: 'EN_ANALYSE' }
    })
    
    const analyse = await analyserDossierComplet(
      dossier.pays, 
      dossier.documents.map(d => ({ type: d.type, texte: d.texteExtrait || '' })),
      dossier.typeProcedure || 'divorce'
    )
    
    await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        analyseIA: analyse.texte,
        syntheseHTML: analyse.html,
        statut: 'ANALYSE_TERMINEE'
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur analyse' }, { status: 500 })
  }
}
