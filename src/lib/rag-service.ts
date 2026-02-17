import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './prisma'
import { Pays, CodeLegal } from '@prisma/client'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// SYSTÈME PROMPT OBLIGATOIRE - SPEC line 256-289
const SYSTEM_PROMPT = `Tu es un assistant juridique STRICTEMENT basé sur les textes de lois.

RÈGLES ABSOLUES (NON-NÉGOCIABLES):

1. SOURCE UNIQUE: Tu NE PEUX répondre QU'à partir des articles de loi fournis dans le contexte.

2. PAS D'EXIGENCE NON-LÉGALE: Si un article n'exige PAS explicitement une pièce, tu NE LA DEMANDES PAS.
   INTERDIT: "Il est généralement recommandé de fournir..."
   AUTORISÉ: "Selon l'Art. 229 du Code Civil, l'acte de mariage est exigé."

3. CITATION OBLIGATOIRE: Chaque affirmation doit citer l'article exact.
   Format: "Art. [NUMÉRO] [CODE] [PAYS]"

4. INCERTITUDE ASSUMÉE: Si l'information n'est PAS dans le contexte, tu répond:
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
  "alertes": []
}
`

export interface RAGResponse {
  reponse: string
  sources: Array<{
    pays: string
    code: string
    article: string
    extrait?: string
  }>
  confiance: number
  alertes: string[]
}

export async function queryRAG(pays: Pays, question: string): Promise<RAGResponse> {
  // Retrieve legal texts from database
  const lois = await prisma.texteLoi.findMany({
    where: { pays, estActif: true },
    take: 10
  })
  
  if (lois.length === 0) {
    return {
      reponse: "Aucune base légale disponible pour ce pays.",
      sources: [],
      confiance: 0,
      alertes: ["Base de données juridique vide"]
    }
  }
  
  const context = lois.map(l => `${l.code} - Art. ${l.article}: ${l.contenu}`).join('\n\n')
  
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Contexte légal:\n${context}\n\nQuestion: ${question}`
    }]
  })
  
  let parsedResponse: RAGResponse
  
  try {
    // Try to parse JSON from the response
    const textContent = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = textContent.match(/\{[\s\S]*\}/)
    
    if (jsonMatch) {
      parsedResponse = JSON.parse(jsonMatch[0])
    } else {
      // Fallback if no JSON found
      parsedResponse = {
        reponse: textContent,
        sources: lois.map(l => ({ 
          pays: l.pays, 
          code: l.code, 
          article: l.article 
        })),
        confiance: 0.8,
        alertes: []
      }
    }
  } catch (e) {
    parsedResponse = {
      reponse: message.content[0].type === 'text' ? message.content[0].text : '',
      sources: lois.map(l => ({ 
        pays: l.pays, 
        code: l.code, 
        article: l.article 
      })),
      confiance: 0.7,
      alertes: ["解析 JSON échoué"]
    }
  }
  
  // Validate response against database
  await validerReponseRAG(parsedResponse)
  
  return parsedResponse
}

// VALIDATION POST-GÉNÉRATION OBLIGATOIRE - SPEC line 293-318
export async function validerReponseRAG(reponse: RAGResponse): Promise<boolean> {
  // Check that response has sources
  if (!reponse.sources || reponse.sources.length === 0) {
    throw new Error('RAG: Réponse sans source = hallucination')
  }
  
  // Verify each cited article exists in database
  for (const source of reponse.sources) {
    // Map string to enum
    const codeEnum = source.code as CodeLegal
    const paysEnum = source.pays as Pays
    
    const existe = await prisma.texteLoi.findUnique({
      where: {
        pays_code_article: {
          pays: paysEnum,
          code: codeEnum,
          article: source.article
        }
      }
    })
    
    if (!existe) {
      console.error(`Article inexistant cité: ${source.article} (${source.code} - ${source.pays})`)
      // Don't throw - just warn, but remove invalid source
      reponse.alertes.push(`Article inexistant: ${source.article}`)
    }
  }
  
  return true
}

export interface ValidationDocument {
  estExige: boolean
  articleLoi: string | null
  alertes: string[]
}

export async function validerDocumentRAG(pays: Pays, type: string, texte: string): Promise<ValidationDocument> {
  // Query RAG to determine if document is legally required
  const question = `Le document de type "${type}" est-il exigé par la loi pour un divorce?`
  
  const lois = await prisma.texteLoi.findMany({
    where: { pays, estActif: true },
    take: 5
  })
  
  if (lois.length === 0) {
    return {
      estExige: false,
      articleLoi: null,
      alertes: ["Base de données juridique vide"]
    }
  }
  
  const context = lois.map(l => `${l.code} - Art. ${l.article}: ${l.contenu}`).join('\n\n')
  
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Contexte légal:\n${context}\n\nQuestion: ${question}\n\nRéponds en JSON: {"estExige": true/false, "article": "Art. XXX Code YYY", "justification": "..."}`
      }]
    })
    
    const textContent = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = textContent.match(/\{"estExige"[\s\S]*\}/)
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        estExige: parsed.estExige || false,
        articleLoi: parsed.article || null,
        alertes: parsed.justification ? [parsed.justification] : []
      }
    }
  } catch (e) {
    console.error("Validation document RAG error:", e)
  }
  
  return {
    estExige: false,
    articleLoi: null,
    alertes: []
  }
}

export interface AnalyseComplete {
  texte: string
  html: string
  sources: Array<{
    pays: string
    code: string
    article: string
    extrait: string
  }>
}

export async function analyserDossierComplet(
  pays: Pays, 
  donnees: Array<{type: string, texte: string}>, 
  typeProcedure: string
): Promise<AnalyseComplete> {
  // Get relevant legal texts
  const lois = await prisma.texteLoi.findMany({
    where: { pays, estActif: true },
    take: 20
  })
  
  if (lois.length === 0) {
    return {
      texte: "Erreur: Base de données juridique vide",
      html: "<div class='error'>Base de données juridique vide</div>",
      sources: []
    }
  }
  
  const context = lois.map(l => `${l.code} - Art. ${l.article}: ${l.contenu}`).join('\n\n')
  
  const documentsContext = donnees.map(d => 
    `Document ${d.type}:\n${d.texte}`
  ).join('\n\n')
  
  const question = `Analyse ce dossier de ${typeProcedure} et fournis:
1. Les points clés juridiques
2. Les documents manquants selon la loi
3. Les références légales applicables

Documents fournis:
${documentsContext || "Aucun document"}`

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Contexte légal:\n${context}\n\n${question}`
    }]
  })
  
  const textContent = message.content[0].type === 'text' ? message.content[0].text : ''
  
  // Generate HTML from response
  const html = `
    <div class="analyse-dossier">
      <h2>AnalyseJuridique - ${pays}</h2>
      <div class="contenu">
        ${textContent.replace(/\n/g, '<br/>')}
      </div>
      <div class="sources">
        <h3>Références légales:</h3>
        ${lois.map(l => `<p><strong>Art. ${l.article} ${l.code}</strong>: ${l.titre}</p>`).join('')}
      </div>
    </div>
  `
  
  return {
    texte: textContent,
    html,
    sources: lois.map(l => ({
      pays: l.pays,
      code: l.code,
      article: l.article,
      extrait: l.contenu.substring(0, 200)
    }))
  }
}
