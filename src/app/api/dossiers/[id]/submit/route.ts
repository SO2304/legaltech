// ============================================
// API: SOUMISSION DOSSIER VERS N8N
// Déclenche le workflow d'analyse IA
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { N8N_WEBHOOK_URL } from '@/lib/config'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    // Récupérer le dossier complet
    const dossier = await prisma.dossier.findUnique({
      where: { id },
      include: {
        client: true,
        documents: {
          where: { estPurge: false },
        },
        avocat: true,
      },
    })
    
    if (!dossier) {
      return NextResponse.json(
        { success: false, error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }
    
    if (dossier.statut !== 'BROUILLON') {
      return NextResponse.json(
        { success: false, error: 'Ce dossier a déjà été soumis' },
        { status: 400 }
      )
    }
    
    // Préparer les données pour n8n
    const webhookPayload = {
      dossierId: dossier.id,
      reference: dossier.reference,
      avocat: {
        slug: dossier.avocat.slug,
        nom: dossier.avocat.nom,
        prenom: dossier.avocat.prenom,
        email: dossier.avocat.email,
        webhookSecret: dossier.avocat.webhookSecret,
      },
      client: {
        email: dossier.client.email,
        telephone: dossier.client.telephone,
        nom: dossier.client.nom,
        prenom: dossier.client.prenom,
      },
      typeProcedure: dossier.typeProcedure,
      regimeMatrimonial: dossier.regimeMatrimonial,
      dateMariage: dossier.dateMariage,
      lieuMariage: dossier.lieuMariage,
      dateSeparation: dossier.dateSeparation,
      conjoint: dossier.conjoint,
      enfants: dossier.enfants,
      patrimoine: dossier.patrimoine,
      documents: dossier.documents.map(doc => ({
        id: doc.id,
        type: doc.type,
        nom: doc.nomOriginal,
        chemin: doc.cheminStockage,
      })),
      submittedAt: new Date().toISOString(),
    }
    
    // Envoyer au webhook n8n
    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'divorce-saas',
        'X-Dossier-Id': dossier.id,
      },
      body: JSON.stringify(webhookPayload),
    })
    
    if (!webhookResponse.ok) {
      console.error('Webhook failed:', await webhookResponse.text())
      // On continue quand même, le statut sera mis à jour via le webhook de retour
    }
    
    // Mettre à jour le statut
    await prisma.dossier.update({
      where: { id },
      data: {
        statut: 'EN_ATTENTE',
        dateSoumission: new Date(),
      },
    })
    
    // Logger l'événement webhook
    await prisma.webhookEvent.create({
      data: {
        type: 'DOSSIER_SUBMIT',
        payload: webhookPayload,
        statut: webhookResponse.ok ? 'TRAITE' : 'ERREUR',
        erreur: webhookResponse.ok ? null : `HTTP ${webhookResponse.status}`,
        dossierId: dossier.id,
      },
    })
    
    return NextResponse.json({
      success: true,
      message: 'Dossier soumis avec succès',
      data: {
        reference: dossier.reference,
        statut: 'EN_ATTENTE',
      },
    })
    
  } catch (error) {
    console.error('Error submitting dossier:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la soumission' },
      { status: 500 }
    )
  }
}
