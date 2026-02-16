import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
<<<<<<< HEAD
import { genererSyntheseDossier } from '@/lib/analysis-service'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { dossierId } = body

        if (!dossierId) {
            return NextResponse.json({ error: 'Missing dossierId' }, { status: 400 })
        }

        // Fetch dossier to check status
        const dossier = await prisma.dossier.findUnique({
            where: { id: dossierId }
        })

        if (!dossier) {
            return NextResponse.json({ error: 'Dossier not found' }, { status: 404 })
        }

        if (!dossier.stripePaid) {
            return NextResponse.json({ error: 'Dossier not paid' }, { status: 403 })
        }

        // Trigger analysis
        // Update status to EN_ANALYSE
        await prisma.dossier.update({
            where: { id: dossierId },
            data: { statut: 'EN_ANALYSE' }
        })

        // In a real app, this might be a queue. Here we call the service.
        // We await it for this simplified implementation, or fire and forget.
        genererSyntheseDossier(dossierId).catch(err => {
            console.error(`Error in analysis for dossier ${dossierId}:`, err)
        })

        return NextResponse.json({ success: true, message: 'Analysis started' })
    } catch (error: any) {
        console.error('Analysis API error:', error)
        return NextResponse.json({ error: 'Server error during analysis trigger' }, { status: 500 })
    }
=======
import { queryRAG } from '@/lib/rag-service-anthropic'
import { StatutDossier } from '@prisma/client'

/**
 * API POST /api/analyse/dossier
 * Analyse complète d'un dossier de divorce avec IA
 *
 * Steps:
 * 1. Récupérer dossier + documents
 * 2. Extraire toutes les données OCR
 * 3. Construire question RAG structurée
 * 4. Appeler RAG Claude pour analyse patrimoniale
 * 5. Générer synthèse HTML structurée
 * 6. Mettre à jour dossier avec résultats
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dossierId } = body

    if (!dossierId) {
      return NextResponse.json(
        { error: 'dossierId requis' },
        { status: 400 }
      )
    }

    // 1. Récupérer le dossier complet
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: {
        documents: true,
        client: true
      }
    })

    if (!dossier) {
      return NextResponse.json(
        { error: 'Dossier introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que le dossier est payé
    if (!dossier.stripePaid) {
      return NextResponse.json(
        { error: 'Le dossier doit être payé avant analyse' },
        { status: 400 }
      )
    }

    console.log(`📊 Démarrage analyse dossier ${dossier.reference}`)

    // 2. Marquer le dossier en cours d'analyse
    await prisma.dossier.update({
      where: { id: dossierId },
      data: { statut: StatutDossier.EN_ANALYSE }
    })

    // 3. Extraire toutes les données OCR des documents
    const donneesExtraites = dossier.documents
      .filter(d => d.donneesExtraites)
      .map(d => {
        try {
          return {
            type: d.type,
            nomOriginal: d.nomOriginal,
            donnees: JSON.parse(d.donneesExtraites)
          }
        } catch (err) {
          console.error(`Erreur parsing donnees ${d.nomOriginal}:`, err)
          return null
        }
      })
      .filter(d => d !== null)

    console.log(`📄 ${donneesExtraites.length} documents avec données extraites`)

    // 4. Construire la question RAG structurée
    const question = `Analyse ce dossier de divorce ${dossier.pays} et génère une analyse patrimoniale structurée en JSON.

**DONNÉES EXTRAITES DES DOCUMENTS:**
${JSON.stringify(donneesExtraites, null, 2)}

**INFORMATIONS CLIENT:**
- Nom: ${dossier.client.nom}
- Prénom: ${dossier.client.prenom}
- Email: ${dossier.client.email}
- Pays: ${dossier.pays}

**MISSION:**
Génère un JSON structuré avec cette structure EXACTE:

{
  "patrimoine": [
    {
      "type": "IMMOBILIER|MOBILIER|EPARGNE|ENTREPRISE|AUTRE",
      "nom": "Description du bien",
      "valeur": 250000,
      "proprietaire": "COMMUN|EPOUX1|EPOUX2",
      "documentId": "id_du_document_source",
      "articleLoi": "Article XX du Code Civil ${dossier.pays}"
    }
  ],
  "revenus": [
    {
      "type": "SALAIRE|PENSION|LOYERS|DIVIDENDES|AUTRE",
      "beneficiaire": "EPOUX1|EPOUX2",
      "montantMensuel": 3500,
      "documentId": "id_du_document_source"
    }
  ],
  "charges": [
    {
      "type": "LOYER|CREDIT|PENSION_ALIMENTAIRE|IMPOTS|AUTRE",
      "description": "Crédit immobilier",
      "montantMensuel": 1200,
      "documentId": "id_du_document_source"
    }
  ],
  "syntheseJuridique": "Paragraphe d'analyse juridique de la situation patrimoniale",
  "recommandations": [
    "Recommandation 1",
    "Recommandation 2"
  ],
  "articlesApplicables": [
    {
      "article": "Article 1387 Code Civil",
      "contenu": "Extrait de l'article...",
      "pertinence": "Explication de la pertinence"
    }
  ]
}

**RÈGLES:**
1. Utilise UNIQUEMENT les données extraites des documents
2. Ne fabrique AUCUNE donnée
3. Si une donnée est manquante, note-le dans syntheseJuridique
4. Cite les articles de loi pertinents pour le régime matrimonial ${dossier.pays}
5. Fournis une synthèse claire et actionnable pour l'avocat

Retourne UNIQUEMENT le JSON, sans markdown, sans explication.`

    // 5. Appeler le RAG
    console.log(`🤖 Appel RAG pour analyse...`)
    const ragResponse = await queryRAG(dossier.pays, question)

    console.log(`✅ Réponse RAG reçue: ${ragResponse.reponse.substring(0, 200)}...`)

    // 6. Parser la réponse JSON
    let analyseStructuree
    try {
      // Nettoyer la réponse (retirer les markdown si présent)
      let jsonText = ragResponse.reponse.trim()
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '')
      }

      analyseStructuree = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON:', parseError)
      console.error('Réponse brute:', ragResponse.reponse)

      // Fallback : structure vide
      analyseStructuree = {
        patrimoine: [],
        revenus: [],
        charges: [],
        syntheseJuridique: ragResponse.reponse,
        recommandations: [],
        articlesApplicables: []
      }
    }

    // 7. Générer synthèse HTML
    const syntheseHTML = generateSyntheseHTML(analyseStructuree, dossier, ragResponse.sources)

    // 8. Mettre à jour le dossier
    await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        analyseIA: JSON.stringify(analyseStructuree),
        syntheseHTML,
        sourcesLegales: JSON.stringify(ragResponse.sources),
        statut: StatutDossier.ANALYSE_TERMINEE
      }
    })

    console.log(`✅ Analyse terminée pour dossier ${dossier.reference}`)

    return NextResponse.json({
      success: true,
      analyse: analyseStructuree,
      sourcesUtilisees: ragResponse.sources.length
    })

  } catch (error) {
    console.error('❌ Erreur analyse dossier:', error)

    // Marquer le dossier en erreur
    try {
      const { dossierId } = await request.json()
      if (dossierId) {
        await prisma.dossier.update({
          where: { id: dossierId },
          data: { statut: StatutDossier.ERREUR }
        })
      }
    } catch (rollbackError) {
      console.error('Erreur rollback:', rollbackError)
    }

    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse du dossier' },
      { status: 500 }
    )
  }
}

/**
 * Génère une synthèse HTML structurée à partir de l'analyse IA
 */
function generateSyntheseHTML(
  analyse: any,
  dossier: any,
  sources: any[]
): string {
  const { patrimoine, revenus, charges, syntheseJuridique, recommandations, articlesApplicables } = analyse

  // Calculer les totaux
  const totalPatrimoine = patrimoine.reduce((sum: number, bien: any) => sum + (bien.valeur || 0), 0)
  const totalRevenus = revenus.reduce((sum: number, rev: any) => sum + (rev.montantMensuel || 0), 0)
  const totalCharges = charges.reduce((sum: number, ch: any) => sum + (ch.montantMensuel || 0), 0)

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Synthèse Dossier ${dossier.reference}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
    h2 { color: #2563eb; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f3f4f6; font-weight: bold; }
    .total { font-weight: bold; background-color: #e0e7ff; }
    .synthese { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .recommandation { background-color: #dbeafe; padding: 10px; margin: 10px 0; border-left: 3px solid #3b82f6; }
    .article { background-color: #f3f4f6; padding: 10px; margin: 10px 0; font-size: 0.9em; }
    .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 0.8em; }
  </style>
</head>
<body>
  <h1>📊 Synthèse Dossier ${dossier.reference}</h1>
  <p><strong>Client:</strong> ${dossier.client.prenom} ${dossier.client.nom}</p>
  <p><strong>Pays:</strong> ${dossier.pays}</p>
  <p><strong>Date d'analyse:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>

  <h2>💰 Patrimoine</h2>
  <table>
    <thead>
      <tr>
        <th>Type</th>
        <th>Description</th>
        <th>Valeur</th>
        <th>Propriétaire</th>
        <th>Article de loi</th>
      </tr>
    </thead>
    <tbody>
      ${patrimoine.map((bien: any) => `
        <tr>
          <td>${bien.type}</td>
          <td>${bien.nom}</td>
          <td>${bien.valeur?.toLocaleString('fr-FR')} €</td>
          <td>${bien.proprietaire}</td>
          <td>${bien.articleLoi || '-'}</td>
        </tr>
      `).join('')}
      <tr class="total">
        <td colspan="2">TOTAL</td>
        <td>${totalPatrimoine.toLocaleString('fr-FR')} €</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>

  <h2>💵 Revenus mensuels</h2>
  <table>
    <thead>
      <tr>
        <th>Type</th>
        <th>Bénéficiaire</th>
        <th>Montant mensuel</th>
      </tr>
    </thead>
    <tbody>
      ${revenus.map((rev: any) => `
        <tr>
          <td>${rev.type}</td>
          <td>${rev.beneficiaire}</td>
          <td>${rev.montantMensuel?.toLocaleString('fr-FR')} €</td>
        </tr>
      `).join('')}
      <tr class="total">
        <td colspan="2">TOTAL</td>
        <td>${totalRevenus.toLocaleString('fr-FR')} €</td>
      </tr>
    </tbody>
  </table>

  <h2>📉 Charges mensuelles</h2>
  <table>
    <thead>
      <tr>
        <th>Type</th>
        <th>Description</th>
        <th>Montant mensuel</th>
      </tr>
    </thead>
    <tbody>
      ${charges.map((ch: any) => `
        <tr>
          <td>${ch.type}</td>
          <td>${ch.description}</td>
          <td>${ch.montantMensuel?.toLocaleString('fr-FR')} €</td>
        </tr>
      `).join('')}
      <tr class="total">
        <td colspan="2">TOTAL</td>
        <td>${totalCharges.toLocaleString('fr-FR')} €</td>
      </tr>
    </tbody>
  </table>

  <h2>⚖️ Synthèse juridique</h2>
  <div class="synthese">
    <p>${syntheseJuridique}</p>
  </div>

  ${recommandations.length > 0 ? `
    <h2>💡 Recommandations</h2>
    ${recommandations.map((reco: string) => `
      <div class="recommandation">• ${reco}</div>
    `).join('')}
  ` : ''}

  ${articlesApplicables.length > 0 ? `
    <h2>📖 Articles de loi applicables</h2>
    ${articlesApplicables.map((art: any) => `
      <div class="article">
        <strong>${art.article}</strong><br>
        ${art.contenu}<br>
        <em>Pertinence: ${art.pertinence}</em>
      </div>
    `).join('')}
  ` : ''}

  <div class="footer">
    <p>Document généré automatiquement par LegalTech Divorce - ${new Date().toLocaleString('fr-FR')}</p>
    <p>Basé sur ${sources.length} source(s) légale(s)</p>
  </div>
</body>
</html>`
>>>>>>> 28e5996de76f6540c72c6c5f6ef9530f4cda1d98
}
