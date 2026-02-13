// ============================================
// FLASHJURIS - DOCUMENT VERSIONING SERVICE
// Gestion des versions de documents juridiques
// ============================================

import { prisma } from '@/lib/prisma'
import { logAuditEvent } from '@/lib/audit'
import crypto from 'crypto'

export interface DocumentVersion {
  version: number
  filename: string
  hash: string
  size: number
  createdAt: Date
  createdBy?: string
}

/**
 * Generate a unique hash for document integrity
 */
export function generateDocumentHash(content: Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

/**
 * Create a new document with version tracking
 */
export async function createDocumentVersion(params: {
  caseId: string
  filename: string
  originalName: string
  mimeType: string
  content: Buffer
  lawyerId: string
}): Promise<{ id: string; version: number; hash: string }> {
  const { caseId, filename, originalName, mimeType, content, lawyerId } = params
  
  // Generate hash for integrity
  const hash = generateDocumentHash(content)
  const base64Data = content.toString('base64')
  
  // Get current max version for this case
  const existingDocs = await prisma.document.findMany({
    where: { caseId, originalName },
    orderBy: { createdAt: 'desc' },
    take: 1,
  })
  
  const nextVersion = existingDocs.length > 0 ? 2 : 1 // Simplified versioning
  
  // Create document record
  const document = await prisma.document.create({
    data: {
      caseId,
      filename: nextVersion > 1 ? `v${nextVersion}_${filename}` : filename,
      originalName,
      mimeType,
      size: content.length,
      storagePath: `cases/${caseId}/${originalName}/v${nextVersion}`,
      fileData: base64Data,
      hash,
      isPurged: false,
    },
  })
  
  // Log audit event
  await logAuditEvent({
    action: 'document_uploaded',
    entityType: 'document',
    entityId: document.id,
    caseId,
    lawyerId,
    metadata: {
      filename: originalName,
      version: nextVersion,
      size: content.length,
      hash,
    },
  })
  
  return {
    id: document.id,
    version: nextVersion,
    hash,
  }
}

/**
 * Get all versions of a document
 */
export async function getDocumentVersions(
  caseId: string,
  originalName: string
): Promise<DocumentVersion[]> {
  const documents = await prisma.document.findMany({
    where: {
      caseId,
      originalName,
      isPurged: false,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      filename: true,
      hash: true,
      size: true,
      createdAt: true,
    },
  })
  
  return documents.map((doc, index) => ({
    version: documents.length - index,
    filename: doc.filename,
    hash: doc.hash,
    size: doc.size,
    createdAt: doc.createdAt,
  }))
}

/**
 * Verify document integrity using hash
 */
export async function verifyDocumentIntegrity(
  documentId: string
): Promise<{ valid: boolean; hash: string; storedHash: string }> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { hash: true, fileData: true },
  })
  
  if (!document || !document.fileData) {
    return { valid: false, hash: '', storedHash: document?.hash || '' }
  }
  
  const content = Buffer.from(document.fileData, 'base64')
  const currentHash = generateDocumentHash(content)
  
  return {
    valid: currentHash === document.hash,
    hash: currentHash,
    storedHash: document.hash,
  }
}

/**
 * Soft delete a document (mark as purged)
 */
export async function softDeleteDocument(
  documentId: string,
  lawyerId: string
): Promise<void> {
  await prisma.document.update({
    where: { id: documentId },
    data: {
      isPurged: true,
      purgedAt: new Date(),
      fileData: null, // Remove actual data
      storagePath: '',
    },
  })
  
  await logAuditEvent({
    action: 'document_deleted',
    entityType: 'document',
    entityId: documentId,
    lawyerId,
    severity: 'warning',
  })
}

/**
 * Export documents for a case (GDPR request)
 */
export async function exportCaseDocuments(
  caseId: string,
  lawyerId: string
): Promise<Array<{
  filename: string
  mimeType: string
  content: string // base64
}>> {
  const documents = await prisma.document.findMany({
    where: {
      caseId,
      isPurged: false,
    },
    select: {
      filename: true,
      originalName: true,
      mimeType: true,
      fileData: true,
    },
  })
  
  await logAuditEvent({
    action: 'data_exported',
    entityType: 'case',
    caseId,
    lawyerId,
    severity: 'warning',
    metadata: {
      documentCount: documents.length,
    },
  })
  
  return documents
    .filter(d => d.fileData)
    .map(d => ({
      filename: d.originalName,
      mimeType: d.mimeType,
      content: d.fileData!,
    }))
}

/**
 * Purge all documents for a case (after retention period)
 */
export async function purgeCaseDocuments(caseId: string): Promise<number> {
  const result = await prisma.document.updateMany({
    where: {
      caseId,
      isPurged: false,
    },
    data: {
      isPurged: true,
      purgedAt: new Date(),
      fileData: null,
      storagePath: '',
    },
  })
  
  await logAuditEvent({
    action: 'case_purged',
    entityType: 'case',
    caseId,
    severity: 'critical',
    metadata: {
      documentsPurged: result.count,
      reason: 'retention_expired',
    },
  })
  
  return result.count
}
