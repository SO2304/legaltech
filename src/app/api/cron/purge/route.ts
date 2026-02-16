import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import { DossierStatus } from '@prisma/client'

/**
 * API GET /api/cron/purge
 * Purge automatique RGPD J+7
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. SÉCURITÉ: Vérifier Authorization header
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const expectedAuth = `Bearer ${cronSecret}`

    if (!cronSecret) {
      console.error('❌ CRON_SECRET non configuré')
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
    }

    if (authHeader !== expectedAuth) {
      console.warn(`⚠️ Tentative d'accès non autorisée au cron purge`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`🔄 Démarrage purge RGPD automatique`)

    // 2. Trouver dossiers à purger
    const now = new Date()
    const dossiers = await prisma.dossier.findMany({
      where: {
        datePurge: { lte: now },
        isPurged: false
      },
      include: {
        documents: true,
        client: true
      }
    })

    console.log(`📋 ${dossiers.length} dossier(s) à purger`)

    if (dossiers.length === 0) {
      return NextResponse.json({
        success: true,
        purged: 0,
        message: 'Aucun dossier à purger',
        duration: Date.now() - startTime
      })
    }

    // 3. Initialiser Supabase
    let supabase = null
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (supabaseUrl && supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey)
      console.log('✅ Supabase client initialisé')
    }

    // 4. Purger chaque dossier
    const purgeResults: any[] = []

    for (const dossier of dossiers) {
      try {
        console.log(`\n🗑️ Purge dossier ${dossier.reference} (${dossier.id})`)

        // 4a. Supprimer fichiers Supabase Storage
        let filesDeleted = 0
        if (supabase && dossier.documents.length > 0) {
          for (const doc of dossier.documents) {
            if (doc.cheminStorage) {
              const { error } = await supabase.storage
                .from('documents')
                .remove([doc.cheminStorage])

              if (!error) filesDeleted++
            }
          }
        }

        // 4b. Anonymiser données dossier
        await prisma.dossier.update({
          where: { id: dossier.id },
          data: {
            isPurged: true,
            purgedAt: now,
            statut: DossierStatus.PURGE,
            analyseIA: null,
            syntheseHTML: null,
            sourcesLegales: null,
          }
        })

        // 4c. Anonymiser données documents
        await prisma.document.updateMany({
          where: { dossierId: dossier.id },
          data: {
            isPurged: true,
            purgedAt: now,
            texteExtrait: null,
            donneesExtraites: null,
          }
        })

        purgeResults.push({
          dossierId: dossier.id,
          reference: dossier.reference,
          documentsCount: dossier.documents.length,
          filesDeleted,
          success: true
        })

      } catch (error) {
        console.error(`❌ Erreur purge dossier ${dossier.reference}:`, error)
        purgeResults.push({
          dossierId: dossier.id,
          reference: dossier.reference,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    }

    return NextResponse.json({
      success: true,
      purged: purgeResults.filter(r => r.success).length,
      errors: purgeResults.filter(r => !r.success).length,
      duration: Date.now() - startTime,
      details: purgeResults
    })

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE CRON PURGE:', error)
    return NextResponse.json({
      error: 'Erreur lors de la purge RGPD',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
