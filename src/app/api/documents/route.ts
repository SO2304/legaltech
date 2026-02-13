// ============================================
// API: UPLOAD DOCUMENTS
// Stockage chiffré avec purge automatique
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  encryptBuffer, 
  calculateHash, 
  generateSecureFilename 
} from '@/lib/encryption'
import { 
  ACCEPTED_FILE_TYPES, 
  MAX_FILE_SIZE,
  DOCUMENT_RETENTION_DAYS 
} from '@/lib/config'
import type { DocumentType } from '@/types'

// Note: Dans un environnement de production, utiliser Supabase Storage
// Pour le dev, on stocke les métadonnées seulement

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const file = formData.get('file') as File | null
    const type = formData.get('type') as DocumentType | null
    const dossierId = formData.get('dossierId') as string | null
    const avocatId = formData.get('avocatId') as string | null
    
    // Validation
    if (!file || !type || !dossierId || !avocatId) {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants' },
        { status: 400 }
      )
    }
    
    // Vérifier le type de fichier
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Type de fichier non accepté' },
        { status: 400 }
      )
    }
    
    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      )
    }
    
    // Vérifier que le dossier existe
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
    })
    
    if (!dossier) {
      return NextResponse.json(
        { success: false, error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }
    
    // Lire le fichier
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Calculer le hash
    const hash = calculateHash(buffer)
    
    // Générer le nom de stockage sécurisé
    const secureFilename = generateSecureFilename(file.name)
    
    // Chiffrer le fichier
    const { encrypted, iv } = encryptBuffer(buffer)
    
    // Calculer la date de purge
    const purgeDate = new Date()
    purgeDate.setDate(purgeDate.getDate() + DOCUMENT_RETENTION_DAYS)
    
    // TODO: En production, uploader vers Supabase Storage
    // Pour le dev, on simule le chemin de stockage
    const cheminStockage = `dossiers/${dossierId}/${secureFilename}`
    
    // Créer l'enregistrement document
    const document = await prisma.document.create({
      data: {
        type,
        nomOriginal: file.name,
        nomStockage: secureFilename,
        mimeType: file.type,
        taille: file.size,
        hash,
        cheminStockage,
        estChiffre: true,
        datePurge: purgeDate,
        dossierId,
        avocatId,
      },
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: document.id,
        nom: document.nomOriginal,
        type: document.type,
        taille: document.taille,
        uploadedAt: document.dateUpload,
        purgeDate: document.datePurge,
      },
    })
    
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'upload' },
      { status: 500 }
    )
  }
}
