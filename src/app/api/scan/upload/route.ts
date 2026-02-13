// ============================================
// API - UPLOAD DOCUMENTS ET ENVOI EMAIL
// POST /api/scan/upload
// Sauvegarde les fichiers et envoie l'email à l'avocat
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendDocumentsToLawyer } from '@/lib/email-service'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const caseId = formData.get('caseId') as string
    const files = formData.getAll('files') as File[]
    
    if (!caseId || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      )
    }
    
    // Vérifier que le dossier existe
    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: { lawyer: true },
    })
    
    if (!existingCase) {
      return NextResponse.json(
        { success: false, error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }
    
    // Vérifier que le dossier n'est pas déjà purgé
    if (existingCase.isPurged) {
      return NextResponse.json(
        { success: false, error: 'Ce dossier a été purgé' },
        { status: 400 }
      )
    }
    
    // Traiter chaque fichier
    const uploadedDocuments: Array<{
      id: string
      originalName: string
      size: number
    }> = []
    
    for (const file of files) {
      // Lire le fichier en buffer
      const buffer = Buffer.from(await file.arrayBuffer())
      
      // Convertir en base64 pour stockage et envoi email
      const base64Data = buffer.toString('base64')
      
      // Générer un nom de fichier unique
      const timestamp = Date.now()
      const randomStr = crypto.randomBytes(8).toString('hex')
      const extension = file.name.split('.').pop()
      const filename = `${timestamp}-${randomStr}.${extension}`
      
      // Calculer le hash SHA-256
      const hash = crypto.createHash('sha256').update(buffer).digest('hex')
      
      // Créer l'enregistrement document avec les données base64
      const document = await prisma.document.create({
        data: {
          caseId,
          filename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          storagePath: `temp/${existingCase.lawyerId}/${caseId}/${filename}`,
          fileData: base64Data, // Stocker en base64 pour l'email
          hash,
          isPurged: false,
        },
      })
      
      uploadedDocuments.push({
        id: document.id,
        originalName: document.originalName,
        size: document.size,
      })
    }
    
    // Mettre à jour le statut du dossier
    await prisma.case.update({
      where: { id: caseId },
      data: { status: 'paid' }, // Après upload = considéré comme payé
    })
    
    // Logger l'événement
    await prisma.event.create({
      data: {
        type: 'documents_uploaded',
        lawyerId: existingCase.lawyerId,
        caseId,
        metadata: JSON.stringify({ 
          count: files.length,
          totalSize: files.reduce((acc, f) => acc + f.size, 0),
        }),
      },
    })
    
    // Envoyer l'email à l'avocat avec les documents en ZIP
    await sendDocumentsToLawyer(caseId)
    
    return NextResponse.json({
      success: true,
      message: 'Documents envoyés à l\'avocat',
      documents: uploadedDocuments.map(d => ({
        id: d.id,
        name: d.originalName,
        size: d.size,
      })),
    })
    
  } catch (error) {
    console.error('Error uploading documents:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'upload' },
      { status: 500 }
    )
  }
}
