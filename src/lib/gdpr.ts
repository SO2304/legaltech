// ============================================
// FLASHJURIS - RGPD/LPD ANONYMIZATION SERVICE
// Conformité protection des données
// ============================================

import { prisma } from '@/lib/prisma'
import { logAuditEvent } from '@/lib/audit'

/**
 * Anonymize all personal data for a case
 * Called after retention period or on user request
 */
export async function anonymizeCaseData(caseId: string): Promise<void> {
  const anonymousData = {
    clientName: '[DONNÉES ANONYMISÉES]',
    clientEmail: null,
    clientPhone: null,
    clientAddress: null,
    clientCity: null,
    clientPostalCode: null,
    caseDescription: null,
    isPurged: true,
    purgedAt: new Date(),
    status: 'purged',
  }
  
  await prisma.case.update({
    where: { id: caseId },
    data: anonymousData,
  })
  
  // Purge all associated documents
  await prisma.document.updateMany({
    where: { caseId },
    data: {
      isPurged: true,
      purgedAt: new Date(),
      fileData: null,
      storagePath: '',
    },
  })
  
  await logAuditEvent({
    action: 'data_deleted',
    entityType: 'case',
    caseId,
    severity: 'critical',
    metadata: {
      reason: 'gdpr_anonymization',
    },
  })
}

/**
 * Export all data for a client (Right of Access - Art. 15 RGPD)
 */
export async function exportClientData(caseId: string): Promise<{
  case: Record<string, unknown>
  documents: Array<{ name: string; uploadedAt: Date }>
  events: Array<{ action: string; timestamp: Date }>
}> {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      documents: {
        where: { isPurged: false },
        select: {
          originalName: true,
          createdAt: true,
        },
      },
    },
  })
  
  const events = await prisma.event.findMany({
    where: { caseId },
    orderBy: { createdAt: 'desc' },
    select: {
      type: true,
      createdAt: true,
    },
  })
  
  if (!caseData) {
    throw new Error('Case not found')
  }
  
  return {
    case: {
      reference: caseData.reference,
      createdAt: caseData.createdAt,
      status: caseData.status,
      caseType: caseData.caseType,
    },
    documents: caseData.documents.map(d => ({
      name: d.originalName,
      uploadedAt: d.createdAt,
    })),
    events: events.map(e => ({
      action: e.type,
      timestamp: e.createdAt,
    })),
  }
}

/**
 * Delete all data for a client (Right to Erasure - Art. 17 RGPD)
 */
export async function deleteClientData(caseId: string): Promise<void> {
  // Anonymize the case
  await anonymizeCaseData(caseId)
  
  // Delete all events (keep audit trail with anonymized data)
  await prisma.event.updateMany({
    where: { caseId },
    data: {
      metadata: JSON.stringify({ anonymized: true }),
    },
  })
}

/**
 * Check retention status for a case
 */
export async function checkRetentionStatus(caseId: string): Promise<{
  isExpired: boolean
  daysUntilPurge: number
  purgeDate: Date
}> {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    select: { purgeAt: true, createdAt: true },
  })
  
  if (!caseData) {
    throw new Error('Case not found')
  }
  
  const now = new Date()
  const purgeDate = caseData.purgeAt
  const isExpired = now >= purgeDate
  const daysUntilPurge = Math.ceil((purgeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  return {
    isExpired,
    daysUntilPurge: Math.max(0, daysUntilPurge),
    purgeDate,
  }
}

/**
 * Generate privacy notice based on country
 */
export function getPrivacyNotice(country: 'FR' | 'BE' | 'CH' | 'LU'): string {
  const notices: Record<string, string> = {
    FR: `
      Conformément au RGPD (Règlement UE 2016/679), vos données personnelles sont traitées 
      pour la transmission de vos documents à l'avocat désigné. 
      Vos données sont conservées pendant 7 jours après transmission, puis automatiquement supprimées.
      Vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
      Pour exercer ces droits, contactez l'avocat destinataire ou contact@flashjuris.com
    `,
    BE: `
      Conformément au RGPD et à la loi belge du 30 juillet 2018, vos données personnelles 
      sont traitées pour la transmission de vos documents à l'avocat désigné.
      Conservation limitée à 7 jours. Contact: contact@flashjuris.com
    `,
    CH: `
      Conformément à la LPD (Loi fédérale sur la protection des données), vos données 
      sont traitées pour la transmission à l'avocat désigné.
      Conservation limitée à 7 jours. Droit d'accès selon art. 8 LPD.
    `,
    LU: `
      Conformément au RGPD et à la loi luxembourgeoise du 1er août 2018, vos données 
      sont traitées pour la transmission à l'avocat désigné.
      Conservation limitée à 7 jours. CNPD - Commission nationale pour la protection des données.
    `,
  }
  
  return notices[country].trim()
}

/**
 * Calculate retention date (7 days from now)
 */
export function calculatePurgeDate(): Date {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date
}
