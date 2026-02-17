import Anthropic from '@anthropic-ai/sdk'
import { DocumentType, Pays } from '@prisma/client'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface OCRResult {
  texteExtrait: string
  donneesExtraites: Record<string, unknown>
  qualiteImage: 'BONNE' | 'MOYENNE' | 'FLOUE' | 'ILLISIBLE'
  confiance: number
  alertes: string[]
}

// Prompts OCR par type - SPEC line 372-389
const OCR_PROMPTS: Record<DocumentType, string> = {
  [DocumentType.CARTE_IDENTITE]: `Extrais les données structurées de cette carte d'identité.
Format JSON:
{
  "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "donnees": {
    "nom": "...",
    "prenom": "...",
    "date_naissance": "YYYY-MM-DD",
    "numero_document": "...",
    "date_expiration": "YYYY-MM-DD"
  },
  "alertes": ["Document expiré" si applicable]
}`,

  [DocumentType.ACTE_MARIAGE]: `Extrais les données de cet acte de mariage.
Format JSON:
{
  "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "donnees": {
    "nom_epoux": "...",
    "prenom_epoux": "...",
    "nom_epouse": "...",
    "prenom_epouse": "...",
    "date_mariage": "YYYY-MM-DD",
    "lieu_mariage": "..."
  },
  "alertes": []
}`,

  [DocumentType.BULLETIN_SALAIRE]: `Extrais les données de ce bulletin de salaire.
Format JSON:
{
  "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "donnees": {
    "employeur": "...",
    "salarie": "...",
    "periode": "...",
    "salaire_brut": "...",
    "salaire_net": "..."
  },
  "alertes": []
}`,

  [DocumentType.AVIS_IMPOSITION]: `Extrais les données de cet avis d'imposition.
Format JSON:
{
  "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "donnees": {
    "contribuable": "...",
    "annee": "...",
    "revenu_fiscal": "...",
    "impots_dus": "..."
  },
  "alertes": []
}`,

  [DocumentType.RELEVE_BANCAIRE]: `Extrais les données de ce relevé bancaire.
Format JSON:
{
  "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "donnees": {
    "titulaire": "...",
    "banque": "...",
    "periode": "...",
    "solde_moyen": "..."
  },
  "alertes": []
}`,

  [DocumentType.TITRE_PROPRIETE]: `Extrais les données de ce titre de propriété.
Format JSON:
{
  "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "donnees": {
    "proprietaire": "...",
    "adresse": "...",
    "superficie": "...",
    "date_acquisition": "..."
  },
  "alertes": []
}`,

  [DocumentType.AUTRE]: `Extrais le texte de ce document.
Format JSON:
{
  "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "donnees": {
    "texte": "..."
  },
  "alertes": []
}`
}

export async function extraireDocumentOCR(
  imageBase64: string,
  type: DocumentType,
  pays: Pays
): Promise<OCRResult> {
  try {
    const prompt = OCR_PROMPTS[type] || OCR_PROMPTS[DocumentType.AUTRE]
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }]
    })
    
    // Parse response
    const textContent = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = textContent.match(/\{[\s\S]*\}/)
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      const qualite = parsed.qualite || 'MOYENNE'
      const confiance = parsed.confiance || 0.5
      
      // Validation qualité - SPEC line 393-401
      if (qualite === 'ILLISIBLE' || confiance < 0.3) {
        throw new Error('Image illisible - OCR impossible')
      }
      
      return {
        texteExtrait: JSON.stringify(parsed.donnees),
        donneesExtraites: parsed.donnees,
        qualiteImage: qualite,
        confiance,
        alertes: parsed.alertes || []
      }
    }
    
    // Fallback
    return {
      texteExtrait: textContent,
      donneesExtraites: {},
      qualiteImage: 'MOYENNE',
      confiance: 0.5,
      alertes: ['Parse JSON échoué']
    }
    
  } catch (error) {
    console.error('OCR Error:', error)
    throw error
  }
}

// Version pour URL d'image
export async function extraireDocumentOCRFromURL(
  imageUrl: string,
  type: DocumentType,
  pays: Pays
): Promise<OCRResult> {
  try {
    // Download image - use fetch API for edge compatibility
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }
    const buffer = await response.arrayBuffer()
    // Convert to base64 using Uint8Array (edge-compatible)
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)
    
    return extraireDocumentOCR(base64, type, pays)
  } catch (error) {
    console.error('OCR From URL Error:', error)
    throw error
  }
}

// Validation qualité - SPEC line 393-401
export function validerQualiteOCR(result: OCRResult): { valide: boolean; warning?: string } {
  if (result.qualiteImage === 'ILLISIBLE' || result.confiance < 0.3) {
    return { valide: false }
  }
  
  if (result.qualiteImage === 'FLOUE') {
    return { 
      valide: true, 
      warning: 'Qualité moyenne détectée - vérifier les données extraites' 
    }
  }
  
  return { valide: true }
}
