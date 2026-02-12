// ============================================
// SERVICE RAG - ANALYSE DOCUMENTS DIVORCE
// Système complet d'analyse avec GLM 5
// ============================================

import ZAI from 'z-ai-web-dev-sdk'
import { prisma } from '@/lib/prisma'
import { sendEmail, generateNotificationEmail, generateConfirmationEmail } from '@/lib/email'
import type { 
  DossierInfo, 
  AnalysisResult, 
  ExtractedData,
  DocumentType 
} from '@/types'

// ============================================
// CONFIGURATION RAG
// ============================================

const RAG_CONFIG = {
  // Prompts système pour différents types d'analyse
  prompts: {
    documentAnalysis: `Tu es un assistant juridique expert en droit de la famille français.
Tu analyses des documents liés à une procédure de divorce par consentement mutuel.

Pour chaque document, tu dois:
1. Identifier le type de document
2. Extraire les informations clés (noms, dates, montants, adresses)
3. Évaluer la cohérence des informations
4. Signaler toute anomalie ou point d'attention

Format de sortie: JSON structuré.`,

    dossierSynthesis: `Tu es un avocat spécialisé en droit de la famille.
À partir des données d'un dossier de divorce et des documents fournis, tu dois:

1. Rédiger une synthèse claire et professionnelle pour l'avocat
2. Identifier les points d'attention (patrimoine complexe, enfants, dettes)
3. Lister les documents manquants potentiels
4. Proposer des recommandations pour la procédure
5. Estimer la complexité du dossier

Ton analyse doit être factuelle, précise et utile pour l'avocat qui traitera le dossier.`,

    patrimoineAnalysis: `Tu es un expert en évaluation patrimoniale pour des divorces.
Analyse les biens et dettes déclarés et extrais des documents pour:
1. Calculer l'actif net du couple
2. Identifier les biens communs vs propres
3. Proposer un partage équitable
4. Signaler les points de négociation potentiels`,
  },
  
  // Templates de réponse
  templates: {
    emailHTML: (synthese: string, reference: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Nouveau dossier de divorce</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Référence: ${reference}</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          ${synthese}
        </div>
        <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280;">
          Cet email a été généré automatiquement par Divorce SaaS LegalTech
        </div>
      </div>
    `,
  },
}

// ============================================
// CLASSE PRINCIPALE RAG
// ============================================

export class DivorceRAGService {
  private ai: Awaited<ReturnType<typeof ZAI.create>> | null = null
  
  async init() {
    this.ai = await ZAI.create()
    return this
  }
  
  // Analyser un document individuel
  async analyzeDocument(
    documentType: DocumentType,
    content: string,
    context: { demandeur: string; conjoint: string }
  ): Promise<{
    type: DocumentType
    extractedData: Record<string, unknown>
    confidence: number
    warnings: string[]
  }> {
    if (!this.ai) await this.init()
    
    const prompt = `
Analyse ce document de type "${documentType}" pour une procédure de divorce:
- Demandeur: ${context.demandeur}
- Conjoint: ${context.conjoint}

CONTENU DU DOCUMENT:
${content}

Retourne un JSON avec:
{
  "extractedData": { ... les données extraites ... },
  "confidence": 0-100,
  "warnings": ["liste des avertissements si données incohérentes"]
}
    `
    
    try {
      const completion = await this.ai!.chat.completions.create({
        messages: [
          { role: 'system', content: RAG_CONFIG.prompts.documentAnalysis },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      })
      
      const content = completion.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
      
      return {
        type: documentType,
        extractedData: parsed.extractedData || {},
        confidence: parsed.confidence || 50,
        warnings: parsed.warnings || [],
      }
    } catch (error) {
      console.error('Error analyzing document:', error)
      return {
        type: documentType,
        extractedData: {},
        confidence: 0,
        warnings: ['Erreur lors de l\'analyse'],
      }
    }
  }
  
  // Générer la synthèse complète du dossier
  async generateDossierSynthesis(
    dossier: DossierInfo,
    documentAnalyses: Array<{
      type: DocumentType
      extractedData: Record<string, unknown>
      confidence: number
      warnings: string[]
    }>
  ): Promise<{
    analysis: AnalysisResult
    extractedData: ExtractedData
    syntheseHTML: string
  }> {
    if (!this.ai) await this.init()
    
    // Agréger les données des documents
    const aggregatedData = this.aggregateDocumentData(documentAnalyses)
    
    // Prompt pour la synthèse
    const prompt = `
Voici un dossier de divorce par consentement mutuel à analyser:

=== DONNÉES DU FORMULAIRE ===
Type de procédure: ${dossier.typeProcedure}
Régime matrimonial: ${dossier.regimeMatrimonial}
Date du mariage: ${dossier.dateMariage || 'Non renseignée'}
Date de séparation: ${dossier.dateSeparation || 'Non renseignée'}

Conjoint: ${JSON.stringify(dossier.conjoint, null, 2)}
Enfants: ${JSON.stringify(dossier.enfants, null, 2)}
Patrimoine déclaré: ${JSON.stringify(dossier.patrimoine, null, 2)}

=== DONNÉES EXTRAITES DES DOCUMENTS ===
${JSON.stringify(aggregatedData, null, 2)}

=== ANALYSES DES DOCUMENTS ===
${documentAnalyses.map(a => `
Document: ${a.type}
Confiance: ${a.confidence}%
Données: ${JSON.stringify(a.extractedData)}
Avertissements: ${a.warnings.join(', ')}
`).join('\n')}

=== TÂCHE ===
Produis une analyse complète avec:

1. resumeGeneral: Résumé en 2-3 phrases de la situation

2. pointsAttention: Liste des points d'attention (objets avec titre, description, niveau INFO/WARNING/CRITICAL, categorie)

3. documentsManquants: Liste des documents qui semblent manquants

4. recommandations: Conseils pour l'avocat

5. estimationComplexite: FAIBLE, MOYENNE ou ELEVEE

6. scoreConfiance: Pourcentage de confiance global

7. extractedData: Données structurées avec:
   - revenusEpoux (salaireNetMensuel, employeur, etc.)
   - revenusEpouse
   - patrimoineImmobilier (array)
   - patrimoineFinancier (array)
   - dettes (array)
   - enfants (array)

Retourne TOUT dans un seul JSON valide.
    `
    
    try {
      const completion = await this.ai!.chat.completions.create({
        messages: [
          { role: 'system', content: RAG_CONFIG.prompts.dossierSynthesis },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      })
      
      const content = completion.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        throw new Error('Invalid JSON response')
      }
      
      const parsed = JSON.parse(jsonMatch[0])
      
      // Générer le HTML de synthèse
      const syntheseHTML = await this.generateSyntheseHTML(parsed)
      
      return {
        analysis: {
          resumeGeneral: parsed.resumeGeneral || '',
          pointsAttention: parsed.pointsAttention || [],
          documentsManquants: parsed.documentsManquants || [],
          recommandations: parsed.recommandations || [],
          estimationComplexite: parsed.estimationComplexite || 'MOYENNE',
          scoreConfiance: parsed.scoreConfiance || 50,
        },
        extractedData: parsed.extractedData || {},
        syntheseHTML,
      }
    } catch (error) {
      console.error('Error generating synthesis:', error)
      
      // Fallback
      return {
        analysis: {
          resumeGeneral: 'Analyse en cours...',
          pointsAttention: [],
          documentsManquants: [],
          recommandations: [],
          estimationComplexite: 'MOYENNE',
          scoreConfiance: 0,
        },
        extractedData: {},
        syntheseHTML: '<p>Erreur lors de la génération de la synthèse.</p>',
      }
    }
  }
  
  // Agréger les données de plusieurs documents
  private aggregateDocumentData(
    analyses: Array<{
      type: DocumentType
      extractedData: Record<string, unknown>
      confidence: number
    }>
  ): Record<string, unknown> {
    const aggregated: Record<string, unknown> = {}
    
    for (const analysis of analyses) {
      // Fusionner les données en privilégiant la confiance la plus élevée
      for (const [key, value] of Object.entries(analysis.extractedData)) {
        if (!aggregated[key] || analysis.confidence > 70) {
          aggregated[key] = value
        }
      }
    }
    
    return aggregated
  }
  
  // Générer le HTML de synthèse pour l'email
  private async generateSyntheseHTML(analysis: AnalysisResult): Promise<string> {
    if (!this.ai) await this.init()
    
    const prompt = `
Génère un HTML professionnel et stylisé inline pour une synthèse de divorce.
Utilise ce contenu:

Résumé: ${analysis.resumeGeneral}
Points d'attention: ${JSON.stringify(analysis.pointsAttention)}
Documents manquants: ${JSON.stringify(analysis.documentsManquants)}
Recommandations: ${JSON.stringify(analysis.recommandations)}
Complexité: ${analysis.estimationComplexite}
Confiance: ${analysis.scoreConfiance}%

Le HTML doit:
- Être formaté pour un email (styles inline)
- Avoir des couleurs professionnelles (bleu marine #1e3a5f, gris)
- Être responsive
- Être concis mais complet
- Ne PAS inclure de <html>, <body> ou <style> tags
- Commencer par un <div> principal

Génère uniquement le HTML, sans explication.
    `
    
    try {
      const completion = await this.ai!.chat.completions.create({
        messages: [
          { role: 'system', content: 'Tu es un expert en création de templates HTML pour emails professionnels.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 3000,
      })
      
      return completion.choices[0]?.message?.content || '<p>Synthèse non disponible</p>'
    } catch (error) {
      console.error('Error generating HTML:', error)
      return this.generateFallbackHTML(analysis)
    }
  }
  
  // HTML de fallback
  private generateFallbackHTML(analysis: AnalysisResult): string {
    const complexityColors = {
      FAIBLE: '#10b981',
      MOYENNE: '#f59e0b',
      ELEVEE: '#ef4444',
    }
    
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
        <p style="padding: 10px; background: ${complexityColors[analysis.estimationComplexite]}20; border-radius: 4px; border-left: 4px solid ${complexityColors[analysis.estimationComplexite]};">
          ${analysis.estimationComplexite} (Confiance: ${analysis.scoreConfiance}%)
        </p>
        
        ${analysis.documentsManquants.length > 0 ? `
          <h3 style="color: #1e3a5f; margin-top: 20px;">Documents manquants</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${analysis.documentsManquants.map(d => `<li>${d}</li>`).join('')}
          </ul>
        ` : ''}
        
        <h3 style="color: #1e3a5f; margin-top: 20px;">Recommandations</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${analysis.recommandations.map(r => `<li style="margin-bottom: 5px;">${r}</li>`).join('')}
        </ul>
      </div>
    `
  }
  
  // Envoyer les notifications email
  async sendNotifications(
    dossier: DossierInfo & { avocat: { email: string; nom: string; prenom: string }; client: { email: string; nom: string; prenom: string; telephone: string | null } },
    syntheseHTML: string
  ): Promise<{ avocatNotified: boolean; clientNotified: boolean }> {
    const results = { avocatNotified: false, clientNotified: false }
    
    try {
      // Email à l'avocat
      const avocatEmail = generateNotificationEmail(
        {
          slug: '',
          nom: dossier.avocat.nom,
          prenom: dossier.avocat.prenom,
          cabinet: null,
          adresse: null,
          codePostal: null,
          ville: null,
          telephone: null,
        },
        dossier,
        syntheseHTML
      )
      
      const avocatResult = await sendEmail({
        to: dossier.avocat.email,
        subject: avocatEmail.subject,
        html: avocatEmail.html,
        replyTo: dossier.client.email,
      })
      
      results.avocatNotified = avocatResult.success
      
      // Email de confirmation au client
      const clientEmail = generateConfirmationEmail(
        dossier.client.email,
        `${dossier.client.prenom} ${dossier.client.nom}`,
        dossier.reference
      )
      
      const clientResult = await sendEmail({
        to: dossier.client.email,
        subject: clientEmail.subject,
        html: clientEmail.html,
      })
      
      results.clientNotified = clientResult.success
      
    } catch (error) {
      console.error('Error sending notifications:', error)
    }
    
    return results
  }
}

// ============================================
// FONCTION PRINCIPALE D'ANALYSE
// ============================================

export async function analyzeDossier(dossierId: string): Promise<{
  success: boolean
  analysis?: AnalysisResult
  error?: string
}> {
  try {
    // Récupérer le dossier complet
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: {
        client: true,
        documents: { where: { estPurge: false } },
        avocat: true,
      },
    })
    
    if (!dossier) {
      return { success: false, error: 'Dossier non trouvé' }
    }
    
    // Mettre à jour le statut
    await prisma.dossier.update({
      where: { id: dossierId },
      data: { 
        statut: 'EN_ANALYSE',
        dateAnalyse: new Date(),
      },
    })
    
    // Initialiser le service RAG
    const ragService = new DivorceRAGService()
    await ragService.init()
    
    // Analyser les documents
    const documentAnalyses = []
    
    for (const doc of dossier.documents) {
      // TODO: En production, extraire le texte réel du PDF
      // Pour le dev, on simule le contenu
      const content = `[Document: ${doc.type}] - ${doc.nomOriginal}`
      
      const analysis = await ragService.analyzeDocument(
        doc.type,
        content,
        {
          demandeur: `${dossier.client.prenom} ${dossier.client.nom}`,
          conjoint: dossier.conjoint ? `${(dossier.conjoint as { prenom?: string; nom?: string }).prenom || ''} ${(dossier.conjoint as { prenom?: string; nom?: string }).nom || ''}`.trim() : 'Non renseigné',
        }
      )
      
      documentAnalyses.push(analysis)
      
      // Sauvegarder les métadonnées IA
      await prisma.document.update({
        where: { id: doc.id },
        data: { metadonneesIA: JSON.stringify(analysis.extractedData) },
      })
    }
    
    // Générer la synthèse
    const { analysis, extractedData, syntheseHTML } = await ragService.generateDossierSynthesis(
      dossier,
      documentAnalyses
    )
    
    // Sauvegarder les résultats
    await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        statut: 'ANALYSE_TERMINEE',
        analyseIA: JSON.stringify(analysis),
        syntheseHTML,
      },
    })
    
    // Envoyer les notifications
    const notifications = await ragService.sendNotifications(
      dossier as Parameters<typeof ragService.sendNotifications>[0],
      syntheseHTML
    )
    
    if (notifications.avocatNotified) {
      await prisma.dossier.update({
        where: { id: dossierId },
        data: {
          statut: 'NOTIFIE',
          dateNotification: new Date(),
        },
      })
    }
    
    return { success: true, analysis }
    
  } catch (error) {
    console.error('Error analyzing dossier:', error)
    
    // Marquer en erreur
    await prisma.dossier.update({
      where: { id: dossierId },
      data: { statut: 'EN_ATTENTE' },
    })
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}
