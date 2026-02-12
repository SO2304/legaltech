// ============================================
// API: CRON - PURGE AUTOMATIQUE J+7
// À appeler par un cron job (Vercel Cron, n8n, etc.)
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cette route doit être protégée par un header Authorization ou un secret
const CRON_SECRET = process.env.CRON_SECRET || 'dev-cron-secret'

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'autorisation
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }
    
    // Trouver les documents à purger (datePurge < maintenant et non encore purgés)
    const documentsToPurge = await prisma.document.findMany({
      where: {
        estPurge: false,
        datePurge: {
          lt: new Date(),
        },
      },
      include: {
        dossier: true,
      },
    })
    
    const results = {
      documentsProcessed: 0,
      dossiersUpdated: 0,
      errors: [] as string[],
    }
    
    for (const doc of documentsToPurge) {
      try {
        // TODO: En production, supprimer le fichier de Supabase Storage
        // await supabase.storage.from('documents').remove([doc.cheminStockage])
        
        // Marquer comme purgé
        await prisma.document.update({
          where: { id: doc.id },
          data: {
            estPurge: true,
            datePurgeEffective: new Date(),
          },
        })
        
        results.documentsProcessed++
        
      } catch (error) {
        results.errors.push(`Document ${doc.id}: ${error}`)
      }
    }
    
    // Mettre à jour les dossiers dont tous les documents sont purgés
    const dossiersToUpdate = await prisma.dossier.findMany({
      where: {
        statut: { in: ['NOTIFIE', 'ARCHIVE'] },
        documents: {
          every: { estPurge: true },
        },
      },
    })
    
    for (const dossier of dossiersToUpdate) {
      await prisma.dossier.update({
        where: { id: dossier.id },
        data: { statut: 'PURGE' },
      })
      results.dossiersUpdated++
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
    
  } catch (error) {
    console.error('Purge error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la purge' },
      { status: 500 }
    )
  }
}

// Permettre aussi POST pour les webhooks n8n
export const POST = GET
