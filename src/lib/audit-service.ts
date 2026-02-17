// ============================================
// FLASHJURIS - SERVICE AUDIT TRAIL
// Traçabilité complète pour conformité juridique
// ============================================

import { prisma } from '@/lib/prisma'

// Types d'actions auditables
export type AuditAction =
  | 'case_created'
  | 'case_updated'
  | 'case_deleted'
  | 'case_purged'
  | 'document_uploaded'
  | 'document_deleted'
  | 'email_sent'
  | 'email_opened'
  | 'payment_success'
  | 'payment_failed'
  | 'data_anonymized'

// Interface pour les logs d'audit
export interface AuditLogInput {
  action: AuditAction
  entityType: string
  entityId: string
  lawyerId?: string
  caseId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  changes?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Service de traçabilité pour la conformité juridique
 */
export class AuditService {
  /**
   * Enregistre une action dans le journal d'audit
   */
  static async log(input: AuditLogInput): Promise<void> {
    try {
      await prisma.event.create({
        data: {
          type: `audit_${input.action}`,
          lawyerId: input.lawyerId,
          caseId: input.caseId,
          metadata: JSON.stringify({
            entityType: input.entityType,
            entityId: input.entityId,
            oldValues: input.oldValues,
            newValues: input.newValues,
            changes: input.changes,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
          }),
        },
      })
    } catch (error) {
      console.error('Audit log failed:', error)
    }
  }

  /**
   * Récupère l'historique d'un dossier
   */
  static async getCaseHistory(caseId: string) {
    return prisma.event.findMany({
      where: { 
        caseId,
        type: { startsWith: 'audit_' }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }

  /**
   * Log de purge de données (RGPD)
   */
  static async logDataPurge(
    caseId: string,
    lawyerId: string,
    reason: string,
    documentsCount: number
  ): Promise<void> {
    await this.log({
      action: 'data_anonymized',
      entityType: 'case',
      entityId: caseId,
      caseId,
      lawyerId,
      newValues: {
        reason,
        documentsPurged: documentsCount,
        purgedAt: new Date().toISOString(),
      },
      changes: `Données purgées: ${documentsCount} documents. Raison: ${reason}`,
    })
  }
}

// Export d'une fonction utilitaire
export const auditLog = AuditService.log
