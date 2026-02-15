import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { extraireDocumentOCR, detectDocumentType } from '@/lib/ocr-service'
import { validerDocumentRAG } from '@/lib/rag-service-anthropic'
import { DocumentType, Pays } from '@prisma/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * API POST /api/upload
 * Upload de document + OCR + Validation RAG
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer les données du formulaire
    const formData = await request.formData()
    const file = formData.get('file') as File
    const dossierId = formData.get('dossierId') as string
    const typeStr = formData.get('type') as string
    const paysStr = formData.get('pays') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Fichier manquant' },
        { status: 400 }
      )
    }

    if (!dossierId) {
      return NextResponse.json(
        { error: 'dossierId manquant' },
        { status: 400 }
      )
    }

    // 2. Valider le type de document
    let type: DocumentType
    if (typeStr && Object.values(DocumentType).includes(typeStr as DocumentType)) {
      type = typeStr as DocumentType
    } else {
      // Auto-détection
      type = detectDocumentType(file.name)
    }

    // 3. Valider le pays
    const pays: Pays = (paysStr as Pays) || 'FRANCE'

    // 4. Vérifier que le dossier existe
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId }
    })

    if (!dossier) {
      return NextResponse.json(
        { error: 'Dossier introuvable' },
        { status: 404 }
      )
    }

    // 5. Upload vers Supabase Storage
    const timestamp = Date.now()
    const nomStockage = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const cheminStorage = `${dossierId}/${nomStockage}`

    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(cheminStorage, fileBuffer, {
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

    console.log(`✅ Fichier uploadé: ${cheminStorage}`)

    // 6. OCR avec Claude Vision (si image ou PDF)
    let ocrResult = {
      texteExtrait: '',
      donneesExtraites: {},
      qualiteImage: 'BONNE' as const,
      confiance: 1,
      alertes: [] as string[]
    }

    const isImageOrPDF = file.type.includes('image') || file.type.includes('pdf')

    if (isImageOrPDF) {
      try {
        ocrResult = await extraireDocumentOCR(cheminStorage, type, pays)
        console.log(`✅ OCR terminé: qualité=${ocrResult.qualiteImage}, confiance=${ocrResult.confiance}`)
      } catch (ocrError) {
        console.error('❌ Erreur OCR:', ocrError)
        ocrResult.alertes.push('Erreur lors de l\'extraction OCR')
        ocrResult.confiance = 0
      }
    } else {
      // Document Word/Excel/etc - pas d'OCR pour l'instant
      ocrResult.alertes.push('Type de document non supporté pour l\'OCR')
    }

    // 7. Validation RAG (est-ce que ce document est exigé ?)
    let validation = {
      estExige: false,
      articleLoi: undefined as string | undefined,
      alertes: [] as string[]
    }

    try {
      validation = await validerDocumentRAG(pays, type, ocrResult.texteExtrait)
      console.log(`✅ Validation RAG: exigé=${validation.estExige}, article=${validation.articleLoi}`)
    } catch (validationError) {
      console.error('❌ Erreur validation RAG:', validationError)
      validation.alertes.push('Erreur lors de la validation juridique')
    }

    // 8. Enregistrer en base de données
    const document = await prisma.document.create({
      data: {
        dossierId,
        type,
        nomOriginal: file.name,
        nomStockage,
        mimeType: file.type,
        taille: file.size,
        cheminStorage,
        texteExtrait: ocrResult.texteExtrait || null,
        donneesExtraites: JSON.stringify(ocrResult.donneesExtraites),
        qualiteImage: ocrResult.qualiteImage,
        exigeLegal: validation.estExige,
        articleLoi: validation.articleLoi || null,
        estValide: ocrResult.alertes.length === 0 && validation.alertes.length === 0,
        datePurge: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // J+7
      }
    })

    console.log(`✅ Document enregistré: ${document.id}`)

    // 9. Retourner le résultat complet
    return NextResponse.json({
      success: true,
      document,
      ocr: ocrResult,
      validation
    })

  } catch (error) {
    console.error('❌ Erreur API upload:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}

/**
 * API GET /api/upload
 * Documentation de l'API
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/upload',
    method: 'POST',
    description: 'Upload de document avec OCR et validation RAG',
    parameters: {
      file: 'File (multipart/form-data)',
      dossierId: 'string (required)',
      type: 'DocumentType (optional, auto-détecté)',
      pays: 'Pays (optional, default FRANCE)'
    },
    response: {
      document: 'Document créé en base de données',
      ocr: 'Résultat OCR (texte extrait, données, qualité)',
      validation: 'Validation RAG (exigé légalement, article de loi)'
    }
  })
}
