// ============================================
// FLASHJURIS - SERVICE DOCUMENTS
// Gestion simplifiée
// ============================================

import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Types de documents autorisés
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// Taille max par défaut (10 MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024

// Interface pour l'upload
export interface UploadInput {
  caseId: string
  file: {
    name: string
    type: string
    size: number
    data: Buffer
  }
  lawyerId?: string
}

/**
 * Service de gestion des documents
 */
export class DocumentService {
  /**
   * Upload un nouveau document
   */
  static async upload(input: UploadInput): Promise<{
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
  }> {
    const { caseId, file } = input
    
    // Validation du type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé: ${file.type}`)
    }
    
    // Validation de la taille
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Fichier trop volumineux. Maximum: ${MAX_FILE_SIZE / 1024 / 1024} MB`)
    }
    
    // Vérifier que le dossier existe
    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
    })
    
    if (!existingCase) {
      throw new Error('Dossier non trouvé')
    }
    
    if (existingCase.isPurged) {
      throw new Error('Ce dossier a été purgé')
    }
    
    // Générer le nom de fichier unique
    const timestamp = Date.now()
    const randomStr = crypto.randomBytes(8).toString('hex')
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${randomStr}.${extension}`
    
    // Calculer le hash SHA-256
    const hash = crypto.createHash('sha256').update(file.data).digest('hex')
    
    // Convertir en base64
    const base64Data = file.data.toString('base64')
    
    const document = await prisma.document.create({
      data: {
        caseId,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        storagePath: `temp/${existingCase.lawyerId}/${caseId}/${filename}`,
        fileData: base64Data,
        hash,
        isPurged: false,
      },
    })
    
    return {
      id: document.id,
      filename: document.filename,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
    }
  }

  /**
   * Liste tous les documents d'un dossier
   */
  static async listByCase(caseId: string) {
    return prisma.document.findMany({
      where: {
        caseId,
        isPurged: false,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    })
  }

  /**
   * Statistiques des documents d'un dossier
   */
  static async getStats(caseId: string): Promise<{
    totalDocuments: number
    totalSize: number
  }> {
    const documents = await prisma.document.findMany({
      where: {
        caseId,
        isPurged: false,
      },
      select: { size: true },
    })
    
    return {
      totalDocuments: documents.length,
      totalSize: documents.reduce((acc, d) => acc + d.size, 0),
    }
  }
}
