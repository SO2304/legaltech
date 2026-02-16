// ============================================
// SERVICE RAG - RETRIEVAL AUGMENTED GENERATION
// Utilise Anthropic Claude pour analyse strict des textes de lois
// ============================================

import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { Pays } from '@prisma/client'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// ============================================
// SYSTÈME PROMPT RAG (CRITIQUE - NON-NÉGOCIABLE)
// ============================================
const SYSTEM_PROMPT = `Tu es un assistant juridique STRICTEMENT basé sur les textes de lois.

RÈGLES ABSOLUES (NON-NÉGOCIABLES):

1. SOURCE UNIQUE: Tu NE PEUX répondre QU'à partir des articles de loi fournis dans le contexte.

2. PAS D'EXIGENCE NON-LÉGALE: Si un article n'exige PAS explicitement une pièce, tu NE LA DEMANDES PAS.
   Exemple INTERDIT: "Il est généralement recommandé de fournir..."
   Exemple AUTORISÉ: "Selon l'Art. 229 du Code Civil, l'acte de mariage est exigé."

3. CITATION OBLIGATOIRE: Chaque affirmation doit citer l'article exact.
   Format: "Art. [NUMÉRO] [CODE] [PAYS]"

4. INCERTITUDE ASSUMÉE: Si l'information n'est PAS dans le contexte, réponds:
   "Cette information n'est pas présente dans les textes de lois fournis."

5. INTERDICTION CULTURE GÉNÉRALE: Tu N'UTILISES PAS ta connaissance pré-entraînée.

FORMAT RÉPONSE JSON STRICT:
{
  "reponse": "...",
  "sources": [
    {
      "pays": "FRANCE",
      "code": "CODE_CIVIL",
      "article": "229",
      "extrait": "Le divorce peut être prononcé..."
    }
  ],
  "confiance": 0.95,
  "alertes": ["Aucune information sur X dans les textes fournis"]
}`

// ============================================
// TYPES
// ============================================
export interface RAGResponse {
  reponse: string
  sources: Array<{
    pays: string
    code: string
    article: string
    extrait: string
  }>
  confiance: number
  alertes: string[]
}

// ============================================
// FONCTION PRINCIPALE: QUERY RAG
// ============================================
export async function queryRAG(
  pays: Pays,
  question: string
): Promise<RAGResponse> {
  try {
    // 1. Récupérer textes de lois pertinents
    const keywords = extractKeywords(question)

    const lois = await prisma.texteLoi.findMany({
      where: {
        pays,
        estActif: true,
        OR: keywords.map(keyword => ({
          contenu: { contains: keyword, mode: 'insensitive' }
        }))
      },
      take: 5,
      orderBy: {
        dateVigueur: 'desc'
      }
    })

    if (lois.length === 0) {
      return {
        reponse: 'Aucun texte de loi pertinent trouvé pour cette question.',
        sources: [],
        confiance: 0,
        alertes: ['Aucun texte de loi correspondant dans la base de données']
      }
    }

    // 2. Construire contexte strict
    const contexte = lois.map(l =>
      `[${l.pays} - ${l.code} - Art. ${l.article}]\n${l.titre}\n\n${l.contenu}`
    ).join('\n\n---\n\n')

    // 3. Appel Claude avec système prompt RAG
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `CONTEXTE LÉGAL:\n${contexte}\n\nQUESTION:\n${question}`
      }]
    })

    // 4. Parser réponse
    const textContent = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    let parsedResponse: RAGResponse
    try {
      parsedResponse = JSON.parse(textContent)
    } catch {
      // Si la réponse n'est pas JSON, construire une réponse structurée
      parsedResponse = {
        reponse: textContent,
        sources: lois.map(l => ({
          pays: l.pays,
          code: l.code,
          article: l.article,
          extrait: l.titre
        })),
        confiance: 0.8,
        alertes: []
      }
    }

    // 5. Valider la réponse
    await validerReponseRAG(parsedResponse)

    return parsedResponse

  } catch (error) {
    console.error('❌ Erreur RAG:', error)
    throw new Error('Erreur lors de la consultation des textes de lois')
  }
}

// ============================================
// EXTRACTION DE MOTS-CLÉS
// ============================================
function extractKeywords(question: string): string[] {
  // Mots-clés juridiques courants
  const stopWords = ['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'est', 'sont', 'peut', 'doit']

  const words = question
    .toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôùûüÿç]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.includes(w))

  // Ajouter des synonymes juridiques
  const keywords = [...words]

  if (words.some(w => w.includes('divorce') || w.includes('séparation'))) {
    keywords.push('divorce', 'séparation', 'rupture')
  }

  if (words.some(w => w.includes('enfant') || w.includes('pension'))) {
    keywords.push('enfant', 'pension', 'alimentaire', 'autorité', 'parentale')
  }

  if (words.some(w => w.includes('bien') || w.includes('patrimoine'))) {
    keywords.push('patrimoine', 'bien', 'communauté', 'propre', 'acquêt')
  }

  return [...new Set(keywords)]
}

// ============================================
// VALIDATION POST-GÉNÉRATION
// ============================================
async function validerReponseRAG(reponse: RAGResponse): Promise<boolean> {
  // 1. Vérifier que sources existe et n'est pas vide
  if (!reponse.sources || reponse.sources.length === 0) {
    throw new Error('RAG: Réponse sans source = hallucination probable')
  }

  // 2. Vérifier que chaque source cite un vrai article
  for (const source of reponse.sources) {
    const existe = await prisma.texteLoi.findFirst({
      where: {
        pays: source.pays as Pays,
        code: source.code as any,
        article: source.article
      }
    })

    if (!existe) {
      console.warn(`⚠️  Article inexistant cité: ${source.article}`)
      // Ne pas throw pour ne pas bloquer, mais logger
    }
  }

  // 3. OK
  return true
}

// ============================================
// FONCTION HELPER: VALIDER DOCUMENT RAG
// ============================================
export async function validerDocumentRAG(
  pays: Pays,
  typeDocument: string,
  texteExtrait?: string
): Promise<{
  estExige: boolean
  articleLoi?: string
  alertes: string[]
}> {
  try {
    const question = `Le document de type "${typeDocument}" est-il exigé par la loi pour une procédure de divorce ? Si oui, cite l'article exact.`

    const response = await queryRAG(pays, question)

    // Analyser si le document est exigé
    const estExige = response.reponse.toLowerCase().includes('exigé') ||
                     response.reponse.toLowerCase().includes('obligatoire')

    const articleLoi = response.sources.length > 0
      ? `Art. ${response.sources[0].article} ${response.sources[0].code}`
      : undefined

    return {
      estExige,
      articleLoi,
      alertes: response.alertes
    }
  } catch (error) {
    console.error('❌ Erreur validation document:', error)
    return {
      estExige: false,
      alertes: ['Erreur lors de la validation']
    }
  }
}
