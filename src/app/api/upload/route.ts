import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extraireDocumentOCR } from '@/lib/ocr-service'
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
        const type = formData.get('type') as DocumentType
        const pays = formData.get('pays') as Pays

        if (!file || !dossierId || !type) {
            return NextResponse.json(
                { error: 'Paramètres manquants' },
                { status: 400 }
            )
        }

        // 1. Upload vers Supabase Storage
        const filename = `${dossierId}/${Date.now()}_${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filename, file)

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return NextResponse.json(
                { error: 'Erreur upload' },
                { status: 500 }
            )
        }

        // 2. OCR + Extraction
        const ocrResult = await extraireDocumentOCR(
            uploadData.path,
            type,
            pays
        )

        // 3. Validation RAG
        const validation = await validerDocumentRAG(
            pays,
            type,
            ocrResult.texteExtrait
        )

        // 4. Enregistrer en DB
        const document = await prisma.document.create({
            data: {
                dossierId,
                type,
                nomOriginal: file.name,
                filename: filename,
                mimeType: file.type,
                size: file.size,
                cheminStorage: uploadData.path,
                texteExtrait: ocrResult.texteExtrait,
                donneesExtraites: JSON.stringify(ocrResult.donneesExtraites),
                qualiteImage: ocrResult.qualiteImage,
                exigeLegal: validation.estExige,
                articleLoi: validation.articleLoi,
                estValide: validation.alertes.length === 0,
                hash: 'pending', // TODO: Calculer hash SHA-256
                datePurge: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // J+7
            }
        })

        return NextResponse.json({
            success: true,
            document,
            ocr: ocrResult,
            validation
        })

    } catch (error) {
        console.error('Upload API error:', error)
        return NextResponse.json(
            { error: 'Erreur serveur lors de l\'upload' },
            { status: 500 }
        )
    }
}
