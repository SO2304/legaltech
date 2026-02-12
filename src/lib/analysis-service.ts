// ============================================
// FLASHJURIS - SERVICE D'ANALYSE IA
// Analyse des documents avec GLM-5
// ============================================

import ZAI from 'z-ai-web-dev-sdk'
import { prisma } from '@/lib/prisma'
import { sendAnalysisReport } from '@/lib/email-service'

interface CaseWithDocuments {
  id: string
  reference: string
  clientName: string | null
  clientEmail: string | null
  caseType: string | null
  caseDescription: string | null
  documents: Array<{
    id: string
    originalName: string
    mimeType: string
    ocrText: string | null
  }>
  lawyer: {
    id: string
    name: string
    email: string
    firm: string | null
  }
}

/**
 * Analyse les documents d'un dossier avec GLM-5
 */
export async function analyzeDocuments(caseId: string, caseData: CaseWithDocuments) {
  console.log(`Starting analysis for case ${caseId}`)
  
  try {
    // Préparer le prompt pour l'analyse
    const documentsContext = caseData.documents.map((doc, i) => {
      return `Document ${i + 1}: ${doc.originalName}
Type: ${doc.mimeType}
Contenu: ${doc.ocrText || '[Document à analyser]'}
---`
    }).join('\n\n')
    
    const prompt = `Tu es un assistant juridique expert. Analyse les documents suivants pour un dossier de type "${caseData.caseType || 'non spécifié'}".

INFORMATIONS CLIENT:
- Nom: ${caseData.clientName || 'Non renseigné'}
- Description: ${caseData.caseDescription || 'Aucune description'}

DOCUMENTS À ANALYSER:
${documentsContext}

Génère une analyse structurée avec:
1. RÉSUMÉ SYNTHÉTIQUE (2-3 phrases max)
2. POINTS CLÉS (liste à puces, max 5)
3. RISQUES IDENTIFIÉS (liste à puces, max 5)
4. RECOMMANDATIONS (liste à puces, max 5)
5. PROCHAINES ÉTAPES SUGGÉRÉES (liste à puces, max 5)

Réponds en français, de manière professionnelle et concise.`

    // Appeler GLM-5
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant juridique expert français. Tu fournis des analyses claires, précises et professionnelles.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })
    
    const analysisText = completion.choices[0]?.message?.content || ''
    
    // Parser la réponse
    const parsed = parseAnalysisResponse(analysisText)
    
    // Sauvegarder les résultats
    await prisma.analysis.update({
      where: { caseId },
      data: {
        summary: parsed.summary,
        keyPoints: JSON.stringify(parsed.keyPoints),
        risks: JSON.stringify(parsed.risks),
        recommendations: JSON.stringify(parsed.recommendations),
        nextSteps: JSON.stringify(parsed.nextSteps),
        status: 'completed',
        completedAt: new Date(),
      },
    })
    
    // Mettre à jour le statut du dossier
    await prisma.case.update({
      where: { id: caseId },
      data: { status: 'completed' },
    })
    
    // Envoyer le rapport par email à l'avocat
    await sendAnalysisReport(caseId, {
      lawyer: caseData.lawyer,
      caseReference: caseData.reference,
      clientName: caseData.clientName,
      caseType: caseData.caseType,
      analysis: parsed,
    })
    
    // Logger l'événement
    await prisma.event.create({
      data: {
        type: 'analysis_completed',
        lawyerId: caseData.lawyer.id,
        caseId,
        metadata: JSON.stringify({ tokensUsed: completion.usage?.total_tokens }),
      },
    })
    
    console.log(`Analysis completed for case ${caseId}`)
    
    return parsed
    
  } catch (error) {
    console.error('Analysis failed:', error)
    
    await prisma.analysis.update({
      where: { caseId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
    })
    
    throw error
  }
}

/**
 * Parse la réponse de l'IA en structure
 */
function parseAnalysisResponse(text: string) {
  const sections = {
    summary: '',
    keyPoints: [] as string[],
    risks: [] as string[],
    recommendations: [] as string[],
    nextSteps: [] as string[],
  }
  
  // Extraction simplifiée par regex
  const summaryMatch = text.match(/(?:RÉSUMÉ|SYNTHÈSE)[:\s]*([^\n]+(?:\n[^\n]+)*)/i)
  if (summaryMatch) {
    sections.summary = summaryMatch[1].trim()
  }
  
  const keyPointsMatch = text.match(/(?:POINTS CLÉS)[:\s]*((?:[-•*][^\n]+\n?)+)/i)
  if (keyPointsMatch) {
    sections.keyPoints = extractBulletPoints(keyPointsMatch[1])
  }
  
  const risksMatch = text.match(/(?:RISQUES)[:\s]*((?:[-•*][^\n]+\n?)+)/i)
  if (risksMatch) {
    sections.risks = extractBulletPoints(risksMatch[1])
  }
  
  const recommendationsMatch = text.match(/(?:RECOMMANDATIONS)[:\s]*((?:[-•*][^\n]+\n?)+)/i)
  if (recommendationsMatch) {
    sections.recommendations = extractBulletPoints(recommendationsMatch[1])
  }
  
  const nextStepsMatch = text.match(/(?:PROCHAINES ÉTAPES)[:\s]*((?:[-•*][^\n]+\n?)+)/i)
  if (nextStepsMatch) {
    sections.nextSteps = extractBulletPoints(nextStepsMatch[1])
  }
  
  // Si le parsing échoue, mettre tout dans le résumé
  if (!sections.summary && !sections.keyPoints.length) {
    sections.summary = text.substring(0, 500)
  }
  
  return sections
}

/**
 * Extrait les points d'une liste à puces
 */
function extractBulletPoints(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(line => line.length > 0)
    .slice(0, 5)
}
