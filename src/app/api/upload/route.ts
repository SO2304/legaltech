import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { extraireDocumentOCR, detectDocumentType } from '@/lib/ocr-service'
import { validerDocumentRAG } from '@/lib/rag-service'
import { DocumentType, Pays } from '@prisma/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
)

/**
 * API POST /api/upload
 * Upload de document + OCR + Validation RAG
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const dossierId = formData.get('dossierId') as string
    const typeStr = formData.get('type') as string
    const paysStr = formData.get('pays') as string

    if (!file || !dossierId) {
      return NextResponse.json(
        { error: 'Fichier ou dossierId manquant' },
        { status: 400 }
      )
    }

    // 1. Valider le type de document
    let type: DocumentType
    if (typeStr && Object.values(DocumentType).includes(typeStr as DocumentType)) {
      type = typeStr as DocumentType
    } else {
      type = detectDocumentType(file.name)
    }

    // 2. Valider le pays
    const pays: Pays = (paysStr as Pays) || Pays.FRANCE

    // 3. Upload vers Supabase Storage
    const timestamp = Date.now()
    const nomStockage = `${dossierId}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(nomStockage, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Erreur upload Supabase:', uploadError)
      return NextResponse.json(
        { error: `Erreur upload: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // 4. OCR avec Claude Vision
    const ocrResult = await extraireDocumentOCR(nomStockage, type, pays)

    // 5. Validation RAG
    const validation = await validerDocumentRAG(pays, type, ocrResult.texteExtrait)

    // 6. Enregistrer en base de données
    const document = await prisma.document.create({
      data: {
        dossierId,
        type,
        nomOriginal: file.name,
        nomStockage,
        mimeType: file.type,
        taille: file.size,
        cheminStorage: nomStockage,
        texteExtrait: ocrResult.texteExtrait || null,
        donneesExtraites: JSON.stringify(ocrResult.donneesExtraites),
        qualiteImage: ocrResult.qualiteImage,
        exigeLegal: validation.estExige,
        articleLoi: validation.articleLoi || null,
        estValide: ocrResult.alertes.length === 0 && validation.alertes.length === 0,
        datePurge: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // J+7
      }
    })

    return NextResponse.json({
      success: true,
      document,
      ocr: ocrResult,
      validation
    })

  } catch (error: any) {
    console.error('❌ Erreur API upload:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne' },
      { status: 500 }
    )
  }
}
