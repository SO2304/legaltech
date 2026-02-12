// ============================================
// API - PURGE AUTOMATIQUE DES DONNÉES
// CRON job à exécuter toutes les heures
// Supprime les données après 7 jours
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Durée de conservation en jours
const RETENTION_DAYS = 7

export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret CRON (sécurité)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const now = new Date()
    let purgedCases = 0
    let purgedDocuments = 0
    
    // 1. Purger les dossiers dont la date de purge est dépassée
    const casesToPurge = await prisma.case.findMany({
      where: {
        purgeAt: { lte: now },
        isPurged: false,
      },
      include: {
        documents: true,
      },
    })
    
    for (const caseData of casesToPurge) {
      console.log(`Purging case ${caseData.reference}`)
      
      // Supprimer les fichiers physiques (en production, supprimer de S3/Supabase Storage)
      for (const doc of caseData.documents) {
        await prisma.document.update({
          where: { id: doc.id },
          data: {
            isPurged: true,
            purgedAt: now,
            fileData: null, // Supprimer les données base64
            storagePath: '', // Vider le chemin
          },
        })
        purgedDocuments++
      }
      
      // Anonymiser les données client
      await prisma.case.update({
        where: { id: caseData.id },
        data: {
          isPurged: true,
          purgedAt: now,
          status: 'purged',
          // Anonymiser les données client
          clientName: '[DONNÉES SUPPRIMÉES]',
          clientEmail: null,
          clientPhone: null,
          clientAddress: null,
          clientCity: null,
          caseDescription: null,
          clientAnalysis: null,
        },
      })
      
      // Logger l'événement
      await prisma.event.create({
        data: {
          type: 'data_purged',
          lawyerId: caseData.lawyerId,
          caseId: caseData.id,
          metadata: JSON.stringify({ reason: 'retention_expired' }),
        },
      })
      
      purgedCases++
    }
    
    // 2. Purger les dossiers non ouverts après 7 jours (sécurité supplémentaire)
    const unopenedCases = await prisma.case.findMany({
      where: {
        emailSentAt: { not: null },
        emailOpened: false,
        isPurged: false,
        createdAt: {
          lte: new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000),
        },
      },
    })
    
    for (const caseData of unopenedCases) {
      console.log(`Purging unopened case ${caseData.reference}`)
      
      await prisma.case.update({
        where: { id: caseData.id },
        data: {
          isPurged: true,
          purgedAt: now,
          status: 'purged',
          clientName: '[DONNÉES SUPPRIMÉES - MAIL NON OUVERT]',
          clientEmail: null,
          clientPhone: null,
          clientAddress: null,
          clientCity: null,
          caseDescription: null,
        },
      })
      
      await prisma.event.create({
        data: {
          type: 'data_purged',
          lawyerId: caseData.lawyerId,
          caseId: caseData.id,
          metadata: JSON.stringify({ reason: 'email_not_opened' }),
        },
      })
      
      purgedCases++
    }
    
    console.log(`Purge complete: ${purgedCases} cases, ${purgedDocuments} documents`)
    
    return NextResponse.json({
      success: true,
      purgedAt: now.toISOString(),
      stats: {
        cases: purgedCases,
        documents: purgedDocuments,
      },
    })
    
  } catch (error) {
    console.error('Purge error:', error)
    return NextResponse.json(
      { success: false, error: 'Purge failed' },
      { status: 500 }
    )
  }
}
