import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { Pays } from '@prisma/client'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
})

/**
 * SERVICE D'ANALYSE FINALE - CLAUDE 3.5 SONNET
 * RAG & SYNTHÈSE JURIDIQUE
 */
export async function genererSyntheseDossier(dossierId: string) {
    // 1. Récupérer le dossier avec ses documents et le client
    const dossier = await prisma.dossier.findUnique({
        where: { id: dossierId },
        include: {
            documents: { where: { estValide: true } },
            client: true
        }
    })

    if (!dossier) throw new Error("Dossier non trouvé")

    // 2. Préparer le contexte (Textes extraits)
    const contexteDocuments = dossier.documents
        .map(doc => `[DOCUMENT: ${doc.type}]\n${doc.texteExtrait}`)
        .join('\n\n---\n\n')

    // 3. Prompt RAG Stricte
    const systemPrompt = `Tu es un expert juridique de haut niveau spécialisé dans le droit du divorce pour le pays: ${dossier.pays}.
  Ton rôle est de fournir une synthèse juridique structurée basée sur les pièces fournies.
  
  RÈGLES STRICTES:
  1. Base-toi UNIQUEMENT sur les pièces fournies et les textes de loi de ${dossier.pays}.
  2. Cite les articles de loi précis (ex: Art. 229 Code Civil).
  3. Identifie les points de blocage potentiels.
  4. La synthèse doit être structurée par rubriques: État Civil, Patrimoine, Enfants, Recommandations.
  5. Ne donne pas de conseil juridique, utilise un ton descriptif et analytique.`

    const userPrompt = `Analyse le dossier de ${dossier.client.nom} (${dossier.pays}).
  
  PIÈCES FOURNIES:
  ${contexteDocuments}
  
  Génère la synthèse structurée en Markdown.`

    // 4. Appel Claude
    const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 4096,
        messages: [
            { role: "user", content: `${systemPrompt}\n\n${userPrompt}` }
        ],
    })

    const synthese = response.content[0]
    if (synthese.type === 'text') {
        // 5. Sauvegarder la synthèse et mettre à jour le statut
        await prisma.dossier.update({
            where: { id: dossierId },
            data: {
                analyseIA: synthese.text,
                statut: 'ANALYSE_TERMINEE'
            }
        })

        return synthese.text
    }

    throw new Error("Échec génération synthèse")
}
