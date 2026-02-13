// ============================================
// FLASHJURIS - SERVICE RGPD
// Anonymisation et conformité
// ============================================

import { prisma } from '@/lib/prisma'
import { AuditService } from '@/lib/audit-service'

// Durée de conservation par défaut (7 jours)
export const DEFAULT_RETENTION_DAYS = 7

// Interface pour le rapport de purge
export interface PurgeReport {
  casesProcessed: number
  documentsPurged: number
  errors: string[]
}

/**
 * Ajoute des jours à une date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Service de gestion RGPD
 */
export class RGPDService {
  /**
   * Programme la date de purge pour un nouveau dossier
   */
  static async schedulePurge(caseId: string, retentionDays: number = DEFAULT_RETENTION_DAYS): Promise<void> {
    await prisma.case.update({
      where: { id: caseId },
      data: {
        purgeAt: addDays(new Date(), retentionDays),
      },
    })
  }

  /**
   * Purge automatique des dossiers arrivés à expiration
   */
  static async runAutoPurge(): Promise<PurgeReport> {
    const report: PurgeReport = {
      casesProcessed: 0,
      documentsPurged: 0,
      errors: [],
    }
    
    const now = new Date()
    
    // Trouver les dossiers à purger
    const casesToPurge = await prisma.case.findMany({
      where: {
        purgeAt: { lte: now },
        isPurged: false,
      },
      include: {
        documents: { where: { isPurged: false } },
      },
    })
    
    for (const caseData of casesToPurge) {
      try {
        await this.purgeCase(caseData.id, 'retention_expired')
        report.casesProcessed++
        report.documentsPurged += caseData.documents.length
      } catch (error) {
        report.errors.push(`Case ${caseData.reference}: ${error}`)
      }
    }
    
    // Purger les dossiers non ouverts après 7 jours
    const unopenedCases = await prisma.case.findMany({
      where: {
        emailSentAt: { not: null },
        emailOpened: false,
        isPurged: false,
        createdAt: {
          lte: addDays(now, -DEFAULT_RETENTION_DAYS),
        },
      },
      include: {
        documents: { where: { isPurged: false } },
      },
    })
    
    for (const caseData of unopenedCases) {
      try {
        await this.purgeCase(caseData.id, 'email_not_opened')
        report.casesProcessed++
        report.documentsPurged += caseData.documents.length
      } catch (error) {
        report.errors.push(`Case ${caseData.reference}: ${error}`)
      }
    }
    
    return report
  }

  /**
   * Purge un dossier spécifique
   */
  static async purgeCase(
    caseId: string, 
    reason: 'retention_expired' | 'email_not_opened' | 'user_request'
  ): Promise<void> {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: { documents: true },
    })
    
    if (!caseData || caseData.isPurged) return
    
    const now = new Date()
    
    // Purger les documents
    await prisma.document.updateMany({
      where: { caseId },
      data: {
        isPurged: true,
        purgedAt: now,
        fileData: null,
        storagePath: '',
      },
    })
    
    // Anonymiser le dossier
    await prisma.case.update({
      where: { id: caseId },
      data: {
        isPurged: true,
        purgedAt: now,
        status: 'purged',
        clientName: '[DONNÉES SUPPRIMÉES]',
        clientEmail: null,
        clientPhone: null,
        clientAddress: null,
        clientCity: null,
        clientPostalCode: null,
        caseDescription: null,
      },
    })
    
    // Audit
    await AuditService.logDataPurge(
      caseId,
      caseData.lawyerId,
      reason,
      caseData.documents.length
    )
    
    // Event
    await prisma.event.create({
      data: {
        type: 'data_purged',
        lawyerId: caseData.lawyerId,
        caseId,
        metadata: JSON.stringify({ reason }),
      },
    })
  }

  /**
   * Rapport de conformité RGPD
   */
  static async getComplianceReport() {
    const [totalCases, purgedCases, pendingPurge] = await Promise.all([
      prisma.case.count(),
      prisma.case.count({ where: { isPurged: true } }),
      prisma.case.count({ 
        where: { 
          isPurged: false,
          purgeAt: { lte: new Date() }
        } 
      }),
    ])
    
    return {
      totalCases,
      purgedCases,
      pendingPurge,
      retentionDays: DEFAULT_RETENTION_DAYS,
    }
  }
}
