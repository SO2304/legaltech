// ============================================
// SERVICE IA - GLM 5
// Analyse des documents et génération de synthèses
// ============================================

import ZAI from 'z-ai-web-dev-sdk'
import type { DossierInfo, AnalysisResult, ExtractedData, DocumentType } from '@/types'

// Initialisation du client IA
async function getAIClient() {
  return await ZAI.create()
}

// ============================================
// PROMPTS SYSTÈME POUR GLM 5
// ============================================

const SYSTEM_PROMPT_ANALYSIS = `Tu es un assistant juridique expert en droit de la famille français, spécialisé dans les procédures de divorce par consentement mutuel.

Ton rôle est d'analyser les documents fournis et de produire une synthèse structurée comprenant:
1. Un résumé général de la situation
2. Les points d'attention (avec niveau de criticité)
3. Les documents éventuellement manquants
4. Des recommandations pour l'avocat
5. Une estimation de la complexité du dossier

Tu dois rester factuel, précis et professionnel. Tu dois identifier les informations clés dans les documents (revenus, patrimoine, enfants, dettes) et les présenter de manière claire.

Format de réponse attendu: JSON structuré.`

const SYSTEM_PROMPT_EXTRACTION = `Tu es un système d'extraction de données spécialisé dans les documents juridiques et financiers français.

Tu dois extraire les informations suivantes des documents fournis:
- Revenus (salaires, primes, employeurs)
- Patrimoine immobilier (biens, valeurs, propriétaires)
- Patrimoine financier (comptes, épargne, assurances vie)
- Dettes (prêts, crédits, montants restants)
- Informations sur les enfants

Tu dois retourner les données sous forme JSON structuré, avec un score de confiance pour chaque extraction.`

// ============================================
// FONCTIONS D'ANALYSE
// ============================================

interface AnalysisInput {
  dossierData: Partial<DossierInfo>
  documentsText: string
  documentTypes: DocumentType[]
}

/**
 * Analyse complète d'un dossier de divorce
 */
export async function analyzeDossier(input: AnalysisInput): Promise<AnalysisResult> {
  const zai = await getAIClient()
  
  const prompt = `
    Voici les données d'un dossier de divorce par consentement mutuel à analyser:
    
    === DONNÉES DU FORMULAIRE ===
    Type de procédure: ${input.dossierData.typeProcedure}
    Régime matrimonial: ${input.dossierData.regimeMatrimonial}
    Date du mariage: ${input.dossierData.dateMariage || 'Non renseignée'}
    Date de séparation: ${input.dossierData.dateSeparation || 'Non renseignée'}
    
    Conjoint: ${JSON.stringify(input.dossierData.conjoint, null, 2)}
    Enfants: ${JSON.stringify(input.dossierData.enfants, null, 2)}
    Patrimoine: ${JSON.stringify(input.dossierData.patrimoine, null, 2)}
    
    === DOCUMENTS FOURNIS ===
    Types de documents: ${input.documentTypes.join(', ')}
    
    === CONTENU EXTRAIT DES DOCUMENTS ===
    ${input.documentsText}
    
    === TÂCHE ===
    Produis une analyse complète de ce dossier au format JSON suivant:
    {
      "resumeGeneral": "string - résumé de 2-3 phrases",
      "pointsAttention": [
        {
          "titre": "string",
          "description": "string",
          "niveau": "INFO|WARNING|CRITICAL",
          "categorie": "PATRIMOINE|ENFANTS|FINANCIER|PROCEDURE|AUTRE"
        }
      ],
      "documentsManquants": ["string - liste des documents manquants"],
      "recommandations": ["string - recommandations pour l'avocat"],
      "estimationComplexite": "FAIBLE|MOYENNE|ELEVEE",
      "scoreConfiance": number (0-100)
    }
  `
  
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_ANALYSIS },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Plus de déterminisme pour l'analyse juridique
      max_tokens: 2000,
    })
    
    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }
    
    // Parser la réponse JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI')
    }
    
    return JSON.parse(jsonMatch[0]) as AnalysisResult
  } catch (error) {
    console.error('Error analyzing dossier:', error)
    throw error
  }
}

/**
 * Extraction des données depuis les documents
 */
export async function extractDocumentData(
  documentsText: string,
  documentTypes: DocumentType[]
): Promise<ExtractedData> {
  const zai = await getAIClient()
  
  const prompt = `
    Analyse les documents suivants et extrais les données structurées:
    
    === TYPES DE DOCUMENTS ===
    ${documentTypes.join(', ')}
    
    === CONTENU DES DOCUMENTS ===
    ${documentsText}
    
    === FORMAT DE RÉPONSE ATTENDU ===
    {
      "revenusEpoux": {
        "salaireNetMensuel": number,
        "employeur": "string|null",
        "poste": "string|null",
        "dateEmbauche": "string|null",
        "primes": number|null
      } | null,
      "revenusEpouse": { ... } | null,
      "patrimoineImmobilier": [
        {
          "type": "string",
          "adresse": "string",
          "valeurEstimee": number,
          "proprietaire": "COMMUN|EPOUX|EPOUSE",
          "encoursCredit": number|null
        }
      ],
      "patrimoineFinancier": [
        {
          "type": "string",
          "etablissement": "string",
          "montant": number,
          "titulaire": "COMMUN|EPOUX|EPOUSE"
        }
      ],
      "dettes": [
        {
          "type": "string",
          "crediteur": "string",
          "montantRestant": number,
          "mensualite": number
        }
      ],
      "enfants": [
        {
          "nom": "string",
          "prenom": "string",
          "dateNaissance": "string",
          "aCharge": boolean
        }
      ]
    }
  `
  
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_EXTRACTION },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 2500,
    })
    
    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }
    
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI')
    }
    
    return JSON.parse(jsonMatch[0]) as ExtractedData
  } catch (error) {
    console.error('Error extracting document data:', error)
    throw error
  }
}

/**
 * Génération de la synthèse HTML pour l'email
 */
export async function generateSyntheseHTML(
  analysis: AnalysisResult,
  extractedData: ExtractedData,
  dossierData: Partial<DossierInfo>
): Promise<string> {
  const zai = await getAIClient()
  
  const prompt = `
    Génère une synthèse HTML professionnelle pour un avocat, basée sur l'analyse suivante:
    
    === ANALYSE ===
    ${JSON.stringify(analysis, null, 2)}
    
    === DONNÉES EXTRAITES ===
    ${JSON.stringify(extractedData, null, 2)}
    
    === DONNÉES DU DOSSIER ===
    ${JSON.stringify(dossierData, null, 2)}
    
    === REQUIREMENTS ===
    - Format HTML valide (sans doctype, body, etc. - juste le contenu)
    - Style inline pour les emails
    - Sections claires avec titres
    - Tableaux pour les données chiffrées
    - Couleurs professionnelles (bleu marine, gris)
    - Pas d'emojis
    - Concis mais complet
  `
  
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: 'Tu es un assistant qui génère du HTML professionnel pour des emails juridiques. Tu produces du code HTML propre, responsive et stylisé inline.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 3000,
    })
    
    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }
    
    // Extraire le HTML si nécessaire
    const htmlMatch = content.match(/<div[\s\S]*<\/div>/i) || content.match(/<table[\s\S]*<\/table>/i)
    return htmlMatch ? htmlMatch[0] : content
  } catch (error) {
    console.error('Error generating synthese HTML:', error)
    // Fallback: générer un HTML basique
    return generateFallbackHTML(analysis, extractedData)
  }
}

function generateFallbackHTML(analysis: AnalysisResult, extractedData: ExtractedData): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px;">
        Synthèse du dossier
      </h2>
      
      <p style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
        ${analysis.resumeGeneral}
      </p>
      
      <h3 style="color: #1e3a5f; margin-top: 20px;">Points d'attention</h3>
      <ul style="margin: 0; padding-left: 20px;">
        ${analysis.pointsAttention.map(p => `
          <li style="margin-bottom: 8px;">
            <strong>${p.titre}</strong> (${p.niveau}): ${p.description}
          </li>
        `).join('')}
      </ul>
      
      <h3 style="color: #1e3a5f; margin-top: 20px;">Complexité estimée</h3>
      <p style="padding: 10px; background: ${analysis.estimationComplexite === 'FAIBLE' ? '#d1fae5' : analysis.estimationComplexite === 'ELEVEE' ? '#fee2e2' : '#fef3c7'}; border-radius: 4px;">
        ${analysis.estimationComplexite} (Confiance: ${analysis.scoreConfiance}%)
      </p>
      
      <h3 style="color: #1e3a5f; margin-top: 20px;">Recommandations</h3>
      <ul style="margin: 0; padding-left: 20px;">
        ${analysis.recommandations.map(r => `<li style="margin-bottom: 5px;">${r}</li>`).join('')}
      </ul>
    </div>
  `
}

// ============================================
// ANALYSE DE DOCUMENTS PDF
// ============================================

/**
 * Extrait le texte d'un document PDF pour l'analyse
 * Note: Dans un contexte réel, utiliser pdf-parse ou similaire
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Placeholder - en production, utiliser une librairie comme pdf-parse
  // ou un service externe pour l'extraction OCR si nécessaire
  return '[Contenu du document PDF à extraire]'
}
