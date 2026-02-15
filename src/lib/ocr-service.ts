import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { Pays, DocumentType } from '@prisma/client'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface OCRResult {
  texteExtrait: string
  donneesExtraites: Record<string, any>
  qualiteImage: 'BONNE' | 'MOYENNE' | 'FLOUE' | 'ILLISIBLE'
  confiance: number
  alertes: string[]
}

/**
 * Extrait les données d'un document via OCR Claude Vision
 */
export async function extraireDocumentOCR(
  filePath: string,
  type: DocumentType,
  pays: Pays
): Promise<OCRResult> {
  try {
    // 1. Télécharger le fichier depuis Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .download(filePath)

    if (error) {
      throw new Error(`Erreur téléchargement: ${error.message}`)
    }

    // 2. Convertir en base64
    const buffer = await data.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    // 3. Déterminer le media_type
    const mediaType = getMediaType(data.type)

    // 4. Construire le prompt spécifique au type de document
    const prompt = buildOCRPrompt(type, pays)

    // 5. Appeler Claude Vision
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    })

    // 6. Parser la réponse JSON
    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Réponse Claude invalide')
    }

    const result = JSON.parse(textContent.text)

    return {
      texteExtrait: result.texte_complet || '',
      donneesExtraites: result.donnees || {},
      qualiteImage: result.qualite || 'MOYENNE',
      confiance: result.confiance || 0.5,
      alertes: result.alertes || []
    }
  } catch (error) {
    console.error('Erreur OCR:', error)
    throw error
  }
}

/**
 * Construire le prompt OCR spécifique au type de document
 */
function buildOCRPrompt(type: DocumentType, pays: Pays): string {
  const prompts: Record<DocumentType, string> = {
    CARTE_IDENTITE: `Extrais les données structurées de cette carte d'identité ${pays}.

INSTRUCTIONS STRICTES:
- Analyse l'image avec soin
- Évalue la qualité de l'image
- Extrait TOUS les champs visibles
- Si un champ est illisible, note-le dans les alertes

Format JSON obligatoire:
{
  "type_detecte": "CARTE_IDENTITE",
  "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "texte_complet": "Texte brut extrait de toute l'image",
  "donnees": {
    "nom": "NOM_FAMILLE",
    "prenom": "Prénom",
    "date_naissance": "YYYY-MM-DD",
    "lieu_naissance": "Ville, Pays",
    "numero_document": "123456789",
    "date_emission": "YYYY-MM-DD",
    "date_expiration": "YYYY-MM-DD",
    "nationalite": "Française"
  },
  "alertes": ["Document expiré" si date_expiration < aujourd'hui, "Photo floue" si qualité mauvaise, etc.]
}`,

    ACTE_MARIAGE: `Extrais les données de cet acte de mariage ${pays}.

Format JSON obligatoire:
{
  "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "texte_complet": "Texte brut complet",
  "donnees": {
    "date_mariage": "YYYY-MM-DD",
    "lieu_mariage": "Ville, Pays",
    "epoux_nom": "NOM",
    "epoux_prenom": "Prénom",
    "epouse_nom": "NOM",
    "epouse_prenom": "Prénom",
    "regime_matrimonial": "Communauté réduite aux acquêts|Séparation de biens|etc."
  },
  "alertes": []
}`,

    BULLETIN_SALAIRE: `Extrais les données de ce bulletin de salaire.

Format JSON obligatoire:
{
  "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "texte_complet": "Texte brut complet",
  "donnees": {
    "employeur": "Nom entreprise",
    "employe_nom": "NOM Prénom",
    "periode": "MM/YYYY",
    "salaire_brut": 2500.00,
    "salaire_net": 1950.00,
    "salaire_net_imposable": 2100.00
  },
  "alertes": ["Période > 3 mois" si applicable]
}`,

    AVIS_IMPOSITION: `Extrais les données de cet avis d'imposition ${pays}.

Format JSON obligatoire:
{
  "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "texte_complet": "Texte brut complet",
  "donnees": {
    "annee_revenus": 2023,
    "revenu_fiscal_reference": 45000.00,
    "montant_impot": 3500.00,
    "nombre_parts": 2.0,
    "declarant_nom": "NOM Prénom"
  },
  "alertes": ["Année > 2 ans" si applicable]
}`,

    RELEVE_BANCAIRE: `Extrais les données de ce relevé bancaire.

Format JSON obligatoire:
{
  "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "texte_complet": "Texte brut complet",
  "donnees": {
    "banque": "Nom banque",
    "titulaire": "NOM Prénom",
    "numero_compte": "FR76 XXXX",
    "date_releve": "YYYY-MM-DD",
    "solde": 12500.00
  },
  "alertes": ["Solde négatif" si applicable, "Période > 3 mois" si applicable]
}`,

    TITRE_PROPRIETE: `Extrais les données de ce titre de propriété.

Format JSON obligatoire:
{
  "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "texte_complet": "Texte brut complet",
  "donnees": {
    "type_bien": "Maison|Appartement|Terrain",
    "adresse": "Adresse complète",
    "surface": 120,
    "proprietaire": "NOM Prénom",
    "date_acquisition": "YYYY-MM-DD",
    "valeur_estimee": 250000.00
  },
  "alertes": []
}`,

    AUTRE: `Extrais les données de ce document.

Format JSON obligatoire:
{
  "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "texte_complet": "Texte brut complet du document",
  "donnees": {
    "type_detecte": "Description du type de document détecté",
    "informations_cles": "Résumé des informations principales"
  },
  "alertes": ["Indiquer si le type de document ne correspond pas à un dossier de divorce"]
}`
  }

  return prompts[type] || prompts.AUTRE
}

/**
 * Détermine le media_type pour Claude Vision
 */
function getMediaType(mimeType: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  if (mimeType.includes('png')) return 'image/png'
  if (mimeType.includes('gif')) return 'image/gif'
  if (mimeType.includes('webp')) return 'image/webp'
  return 'image/jpeg' // Par défaut
}

/**
 * Détection automatique du type de document (fallback)
 */
export function detectDocumentType(filename: string): DocumentType {
  const lower = filename.toLowerCase()

  if (lower.includes('carte') || lower.includes('identite') || lower.includes('cni') || lower.includes('passport')) {
    return 'CARTE_IDENTITE'
  }
  if (lower.includes('mariage') || lower.includes('acte')) {
    return 'ACTE_MARIAGE'
  }
  if (lower.includes('salaire') || lower.includes('bulletin') || lower.includes('paie')) {
    return 'BULLETIN_SALAIRE'
  }
  if (lower.includes('impot') || lower.includes('imposition') || lower.includes('fiscal')) {
    return 'AVIS_IMPOSITION'
  }
  if (lower.includes('banc') || lower.includes('releve') || lower.includes('rib')) {
    return 'RELEVE_BANCAIRE'
  }
  if (lower.includes('propriete') || lower.includes('titre') || lower.includes('notaire')) {
    return 'TITRE_PROPRIETE'
  }

  return 'AUTRE'
}
