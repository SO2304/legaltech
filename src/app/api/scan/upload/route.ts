// ============================================
// API - UPLOAD DOCUMENTS
// POST /api/scan/upload
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/document-service'
import { sendDocumentsToLawyer } from '@/lib/email-service'
import { AuditService } from '@/lib/audit-service'
import { RGPDService } from '@/lib/rgpd-service'

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
    
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Traiter chaque fichier
    const uploadedDocuments: Array<{
      id: string
      name: string
      size: number
    }> = []
    const errors: Array<{
      filename: string
      error: string
    }> = []
    
    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        
        const doc = await DocumentService.upload({
          caseId,
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            data: buffer,
          },
        })
        
        uploadedDocuments.push({
          id: doc.id,
          name: doc.originalName,
          size: doc.size,
        })
        
      } catch (error) {
        errors.push({
          filename: file.name,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    }
    
    if (uploadedDocuments.length === 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }
    
    // Audit
    await AuditService.log({
      action: 'document_uploaded',
      entityType: 'case',
      entityId: caseId,
      caseId,
      newValues: {
        count: uploadedDocuments.length,
        totalSize: uploadedDocuments.reduce((acc, d) => acc + d.size, 0),
      },
      ipAddress,
      userAgent,
    })
    
    // Envoyer l'email à l'avocat
    await sendDocumentsToLawyer(caseId)
    
    // Programmer la purge RGPD
    await RGPDService.schedulePurge(caseId)
    
    return NextResponse.json({
      success: true,
      message: 'Documents envoyés à l\'avocat',
      documents: uploadedDocuments,
      errors: errors.length > 0 ? errors : undefined,
    })
    
  } catch (error) {
    console.error('Error uploading documents:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'upload' 
      },
      { status: 500 }
    )
  }
}
