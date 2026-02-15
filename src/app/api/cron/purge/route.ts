import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import { StatutDossier } from '@prisma/client'

/**
 * API GET /api/cron/purge
 * Purge automatique RGPD J+7
 *
 * ⚠️ SÉCURITÉ: Cet endpoint est appelé par un cron job
 * Nécessite Authorization header avec CRON_SECRET
 *
 * CONFIGURATION CRON (Render / Vercel Cron):
 * - Schedule: "0 2 * * *" (2h du matin chaque jour)
 * - Command: curl -H "Authorization: Bearer $CRON_SECRET" https://votre-app.com/api/cron/purge
 *
 * WORKFLOW:
 * 1. Vérifier autorisation (Bearer token)
 * 2. Trouver dossiers à purger (datePurge <= now && !isPurged)
 * 3. Pour chaque dossier:
 *    - Supprimer fichiers Supabase Storage
 *    - Anonymiser données dossier (analyseIA, syntheseHTML, sourcesLegales)
 *    - Anonymiser données documents (texteExtrait, donneesExtraites)
 *    - Marquer isPurged = true, purgedAt = now, statut = PURGE
 * 4. Logs détaillés pour audit trail
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // ============================================
    // 1. SÉCURITÉ: Vérifier Authorization header
    // ============================================
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

    if (!process.env.CRON_SECRET) {
      console.error('❌ CRON_SECRET non configuré')
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    if (authHeader !== expectedAuth) {
      console.warn(`⚠️ Tentative d'accès non autorisée au cron purge`)
      console.warn(`Header reçu: ${authHeader?.substring(0, 20)}...`)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`🔄 Démarrage purge RGPD automatique`)

    // ============================================
    // 2. Trouver dossiers à purger
    // ============================================
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

    // ============================================
    // 3. Initialiser Supabase (si configuré)
    // ============================================
    let supabase = null
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey)
      console.log('✅ Supabase client initialisé')
    } else {
      console.warn('⚠️ Supabase non configuré - skip suppression fichiers')
    }

    // ============================================
    // 4. Purger chaque dossier
    // ============================================
    const purgeResults: any[] = []

    for (const dossier of dossiers) {
      try {
        console.log(`\n🗑️ Purge dossier ${dossier.reference} (${dossier.id})`)

        // 4a. Supprimer fichiers Supabase Storage
        let filesDeleted = 0
        let filesErrors = 0

        if (supabase && dossier.documents.length > 0) {
          for (const doc of dossier.documents) {
            if (doc.cheminStorage) {
              try {
                // Extraire le path relatif du chemin storage
                // Format attendu: https://.../storage/v1/object/public/documents/path/to/file.pdf
                const urlParts = doc.cheminStorage.split('/documents/')
                const filePath = urlParts[1] || doc.cheminStorage

                const { error } = await supabase.storage
                  .from('documents')
                  .remove([filePath])

                if (error) {
                  console.error(`  ❌ Erreur suppression ${doc.nomOriginal}:`, error.message)
                  filesErrors++
                } else {
                  console.log(`  ✅ Fichier supprimé: ${doc.nomOriginal}`)
                  filesDeleted++
                }
              } catch (err) {
                console.error(`  ❌ Exception suppression ${doc.nomOriginal}:`, err)
                filesErrors++
              }
            }
          }
        }

        // 4b. Anonymiser données dossier
        await prisma.dossier.update({
          where: { id: dossier.id },
          data: {
            // Marquer comme purgé
            isPurged: true,
            purgedAt: now,
            statut: StatutDossier.PURGE,

            // Anonymiser données sensibles
            analyseIA: null,
            syntheseHTML: null,
            sourcesLegales: null,

            // Conserver metadata pour audit
            // reference, pays, createdAt, stripePaid restent
          }
        })

        console.log(`  ✅ Dossier anonymisé`)

        // 4c. Anonymiser données documents
        await prisma.document.updateMany({
          where: { dossierId: dossier.id },
          data: {
            // Marquer comme purgé
            isPurged: true,
            purgedAt: now,

            // Anonymiser données sensibles
            texteExtrait: null,
            donneesExtraites: null,

            // Conserver metadata pour audit
            // nomOriginal, type, mimeType, createdAt restent
          }
        })

        console.log(`  ✅ ${dossier.documents.length} document(s) anonymisé(s)`)

        // Résultat de cette purge
        purgeResults.push({
          dossierId: dossier.id,
          reference: dossier.reference,
          clientEmail: dossier.client.email,
          documentsCount: dossier.documents.length,
          filesDeleted,
          filesErrors,
          success: true
        })

        console.log(`✅ Dossier ${dossier.reference} purgé avec succès`)

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

    // ============================================
    // 5. Résumé et logs
    // ============================================
    const successCount = purgeResults.filter(r => r.success).length
    const errorCount = purgeResults.filter(r => !r.success).length
    const duration = Date.now() - startTime

    console.log(`\n📊 RÉSUMÉ PURGE RGPD:`)
    console.log(`  • Total traités: ${dossiers.length}`)
    console.log(`  • Succès: ${successCount}`)
    console.log(`  • Erreurs: ${errorCount}`)
    console.log(`  • Durée: ${duration}ms`)

    // Log audit trail
    console.log(`\n📝 AUDIT TRAIL:`)
    purgeResults.forEach(result => {
      if (result.success) {
        console.log(`  ✅ ${result.reference}: ${result.documentsCount} docs, ${result.filesDeleted} fichiers supprimés`)
      } else {
        console.log(`  ❌ ${result.reference}: ${result.error}`)
      }
    })

    return NextResponse.json({
      success: true,
      purged: successCount,
      errors: errorCount,
      duration,
      details: purgeResults
    })

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE CRON PURGE:', error)

    return NextResponse.json(
      {
        error: 'Erreur lors de la purge RGPD',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
