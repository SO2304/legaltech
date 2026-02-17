import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extraireDocumentOCR, validerQualiteOCR } from '@/lib/ocr-service'
import { validerDocumentRAG } from '@/lib/rag-service'
import { prisma } from '@/lib/prisma'
import { DocumentType, Pays } from '@prisma/client'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const dossierId = formData.get('dossierId') as string
    const type = (formData.get('type') as DocumentType) || 'AUTRE'
    const pays = (formData.get('pays') as Pays) || 'FRANCE'
    
    if (!file || !dossierId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }
    
    // Upload to Supabase
    const filename = `${dossierId}/${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filename, file)
    
    if (error) throw error
    
    // Convert file to base64 for OCR
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    
    // Run OCR
    const ocrResult = await extraireDocumentOCR(base64, type, pays)
    
    // Validate quality
    const validation = validerQualiteOCR(ocrResult)
    if (!validation.valide) {
      return NextResponse.json({ 
        error: 'Document illisible', 
        details: ocrResult 
      }, { status: 400 })
    }
    
    // Validate with RAG (legal requirements)
    const ragValidation = await validerDocumentRAG(
      pays, 
      type, 
      ocrResult.texteExtrait
    )
    
    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filename)
    
    const document = await prisma.document.create({
      data: {
        dossierId,
        type,
        nomOriginal: file.name,
        nomStockage: filename,
        mimeType: file.type,
        taille: file.size,
        cheminStorage: urlData.publicUrl,
        texteExtrait: ocrResult.texteExtrait,
        donneesExtraites: JSON.stringify(ocrResult.donneesExtraites),
        qualiteImage: ocrResult.qualiteImage,
        exigeLegal: ragValidation.estExige,
        articleLoi: ragValidation.articleLoi,
        estValide: validation.valide && ragValidation.alertes.length === 0,
        datePurge: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      document, 
      ocr: ocrResult,
      warning: validation.warning
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
