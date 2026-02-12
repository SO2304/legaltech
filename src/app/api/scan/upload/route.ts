// ============================================
// API - UPLOAD DOCUMENTS
// POST /api/scan/upload
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    
    // Traiter chaque fichier
    const uploadedDocuments = []
    
    for (const file of files) {
      // Générer un nom de fichier unique
      const timestamp = Date.now()
      const randomStr = crypto.randomBytes(8).toString('hex')
      const extension = file.name.split('.').pop()
      const filename = `${timestamp}-${randomStr}.${extension}`
      
      // Simuler le stockage (en production, utiliser Supabase Storage ou S3)
      const storagePath = `uploads/${existingCase.lawyerId}/${caseId}/${filename}`
      
      // Calculer le hash
      const buffer = Buffer.from(await file.arrayBuffer())
      const hash = crypto.createHash('sha256').update(buffer).digest('hex')
      
      // Date de purge (30 jours)
      const deleteAt = new Date()
      deleteAt.setDate(deleteAt.getDate() + 30)
      
      // Créer l'enregistrement document
      const document = await prisma.document.create({
        data: {
          caseId,
          filename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          storagePath,
          hash,
          deleteAt,
        },
      })
      
      uploadedDocuments.push(document)
    }
    
    // Mettre à jour le statut du dossier
    await prisma.case.update({
      where: { id: caseId },
      data: { status: 'processing' },
    })
    
    // Logger l'événement
    await prisma.event.create({
      data: {
        type: 'documents_uploaded',
        lawyerId: existingCase.lawyerId,
        caseId,
        metadata: JSON.stringify({ count: files.length }),
      },
    })
    
    return NextResponse.json({
      success: true,
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
