// ============================================
// FLASHJURIS - AUDIT LOG SERVICE
// Immutable audit trail for legal compliance
// RGPD/LPD compliant logging
// ============================================

import { prisma } from '@/lib/prisma'

export type AuditAction =
  | 'case_created'
  | 'case_updated'
  | 'case_viewed'
  | 'case_purged'
  | 'document_uploaded'
  | 'document_downloaded'
  | 'document_deleted'
  | 'email_sent'
  | 'email_opened'
  | 'payment_initiated'
  | 'payment_completed'
  | 'payment_failed'
  | 'commission_paid'
  | 'lawyer_registered'
  | 'lawyer_updated'
  | 'qr_generated'
  | 'data_exported'
  | 'data_deleted'
  | 'security_event'

export type AuditSeverity = 'info' | 'warning' | 'critical'

interface AuditLogData {
  action: AuditAction
  entityType: 'case' | 'document' | 'lawyer' | 'client' | 'payment' | 'system'
  entityId?: string
  lawyerId?: string
  caseId?: string
  country?: string
  metadata?: Record<string, unknown>
  severity?: AuditSeverity
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an audit event - immutable record for compliance
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await prisma.event.create({
      data: {
        type: data.action,
        lawyerId: data.lawyerId || null,
        caseId: data.caseId || null,
        country: data.country || null,
        metadata: JSON.stringify({
          entityType: data.entityType,
          entityId: data.entityId,
          severity: data.severity || 'info',
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: new Date().toISOString(),
          ...data.metadata,
        }),
      },
    })
  } catch (error) {
    // Log to console if database write fails (critical for audit)
    console.error('AUDIT LOG FAILED:', data, error)
  }
}

/**
 * Get audit trail for a case (for lawyer dashboard)
 */
export async function getCaseAuditTrail(caseId: string): Promise<Array<{
  action: string
  timestamp: Date
  metadata: Record<string, unknown>
}>> {
  const events = await prisma.event.findMany({
    where: { caseId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return events.map(e => ({
    action: e.type,
    timestamp: e.createdAt,
    metadata: e.metadata ? JSON.parse(e.metadata) : {},
  }))
}

/**
 * Get all events for a lawyer
 */
export async function getLawyerAuditTrail(
  lawyerId: string,
  options?: { limit?: number; offset?: number }
): Promise<Array<{
  action: string
  caseId: string | null
  timestamp: Date
  metadata: Record<string, unknown>
}>> {
  const events = await prisma.event.findMany({
    where: { lawyerId },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  })

  return events.map(e => ({
    action: e.type,
    caseId: e.caseId,
    timestamp: e.createdAt,
    metadata: e.metadata ? JSON.parse(e.metadata) : {},
  }))
}

/**
 * Log security event (failed auth, suspicious activity)
 */
export async function logSecurityEvent(
  event: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    action: 'security_event',
    entityType: 'system',
    severity: 'warning',
    metadata: {
      event,
      ...metadata,
    },
  })
}

/**
 * Get statistics for compliance reporting
 */
export async function getComplianceStats(
  startDate: Date,
  endDate: Date
): Promise<{
  casesCreated: number
  casesPurged: number
  documentsUploaded: number
  emailsSent: number
  securityEvents: number
}> {
  const events = await prisma.event.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  })

  return {
    casesCreated: events.filter(e => e.type === 'case_created').length,
    casesPurged: events.filter(e => e.type === 'case_purged').length,
    documentsUploaded: events.filter(e => e.type === 'document_uploaded').length,
    emailsSent: events.filter(e => e.type === 'email_sent').length,
    securityEvents: events.filter(e => e.type === 'security_event').length,
  }
}
