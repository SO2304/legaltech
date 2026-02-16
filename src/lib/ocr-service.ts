import Anthropic from '@anthropic-ai/sdk'
import { DocumentType, Pays } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
})

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
)

/**
 * SERVICE OCR - CLAUDE 3.5 SONNET
 */
export async function extraireDocumentOCR(
    storagePath: string,
    type: DocumentType,
    pays: Pays
) {
    // 1. Récupérer le fichier depuis Supabase
    const { data, error } = await supabase.storage
        .from('documents')
        .download(storagePath)

    if (error || !data) {
        throw new Error(`Erreur téléchargement storage: ${error?.message}`)
    }

    // 2. Convertir en base64 pour Claude
    const buffer = await data.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    // Détection basique du mime type
    const extension = storagePath.split('.').pop()?.toLowerCase()
    let mimeType = 'image/jpeg'
    if (extension === 'png') mimeType = 'image/png'
    if (extension === 'webp') mimeType = 'image/webp'
    if (extension === 'pdf') {
        // Claude 3.5 Sonnet supporte les PDF mais via une autre structure ou conversion image.
        // Pour le MVP, on suppose une image. Si c'est un PDF, il faudrait le convertir.
        // On garde image/jpeg par défaut si inconnu.
    }

    // 3. Appel Claude Vision
    const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1536,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `Tu es un expert en OCR juridique. Analyse ce document de type ${type} pour un dossier de divorce en ${pays}.
            
            OBJECTIFS:
            1. Extraire TOUT le texte visible.
            2. Identifier les entités clés: Noms, prénoms, adresses, dates de naissance, montants financiers.
            3. Évaluer la lisibilité du document.

            FORMAT DE RÉPONSE JSON STRICT:
            {
              "texteExtrait": "...",
              "donneesExtraites": {
                "identite": { "nom": "...", "prenom": "...", "dateNaissance": "..." },
                "financier": { "revenus": 0, "patrimoine": 0 },
                "confiance": 0.0-1.0
              },
              "qualiteImage": "haute|moyenne|basse"
            }`
                    },
                    {
                        type: "image",
                        source: {
                            type: "base64",
                            media_type: mimeType as any,
                            data: base64,
                        },
                    },
                ],
            },
        ],
    })

    // 4. Parser le JSON de Claude
    const content = response.content[0]
    if (content.type === 'text') {
        return JSON.parse(content.text)
    }

    throw new Error("Réponse IA non textuelle")
}
