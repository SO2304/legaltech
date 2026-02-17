// ============================================
// FLASHJURIS - SERVICE EMAIL
// Envoi des documents en ZIP + lien Stripe commission
// ============================================

import { prisma } from '@/lib/prisma'

interface CaseData {
  id: string
  reference: string
  lawyerId: string
  clientName: string | null
  clientEmail: string | null
  clientPhone: string | null
  caseType: string | null
  caseDescription: string | null
  documents: Array<{
    id: string
    originalName: string
    mimeType: string
    size: number
    fileData: string | null
  }>
  lawyer: {
    id: string
    name: string
    email: string
    firm: string | null
    commissionRate: number
    stripeAccountId: string | null
  }
  commissionAmount: number
}

/**
 * Envoie les documents en ZIP à l'avocat + lien Stripe pour commission
 */
export async function sendDocumentsToLawyer(caseId: string): Promise<boolean> {
  console.log(`Sending documents to lawyer for case ${caseId}`)
  
  // Récupérer les données complètes
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      documents: true,
      lawyer: true,
    },
  })
  
  if (!caseData || !caseData.lawyer) {
    console.error('Case or lawyer not found')
    return false
  }
  
  const lawyer = caseData.lawyer
  const documents = caseData.documents
  
  // Créer le ZIP en base64
  const zipBase64 = await createZipFromDocuments(documents)
  
  // Calculer la commission (20% de 149€ = 29.80€)
  const commissionAmount = caseData.commissionAmount || 2980 // centimes
  const commissionEuros = (commissionAmount / 100).toFixed(2)
  
  // Générer le lien Stripe pour la commission
  const stripeLink = await generateStripeCommissionLink(lawyer, caseData)
  
  // Générer le contenu de l'email
  const htmlContent = generateLawyerEmailHTML({
    ...caseData,
    lawyer,
    documents,
    commissionAmount,
  } as CaseData, zipBase64, stripeLink, commissionEuros)
  
  // En production, utiliser Resend avec pièce jointe
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FlashJuris <documents@flashjuris.com>',
          to: lawyer.email,
          subject: `📦 Dossier ${caseData.reference} - Documents reçus`,
          html: htmlContent,
          attachments: [{
            filename: `dossier-${caseData.reference}.zip`,
            content: zipBase64,
          }],
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Resend error: ${response.statusText}`)
      }
      
      // Marquer l'email comme envoyé
      await prisma.case.update({
        where: { id: caseId },
        data: {
          emailSentAt: new Date(),
          status: 'sent',
        },
      })
      
      // Logger l'événement
      await prisma.event.create({
        data: {
          type: 'email_sent',
          lawyerId: lawyer.id,
          caseId,
          metadata: JSON.stringify({ documentCount: documents.length }),
        },
      })
      
      console.log(`Email sent successfully to ${lawyer.email}`)
      return true
      
    } catch (error) {
      console.error('Failed to send email via Resend:', error)
      return false
    }
  }
  
  // Mode développement
  console.log('=== EMAIL TO LAWYER (DEV MODE) ===')
  console.log(`To: ${lawyer.email}`)
  console.log(`Subject: Dossier ${caseData.reference} - Documents reçus`)
  console.log(`Documents: ${documents.length} fichiers`)
  console.log(`Commission: ${commissionEuros}€`)
  console.log(`Stripe Link: ${stripeLink}`)
  console.log('================================')
  
  return true
}

/**
 * Crée un ZIP en base64 à partir des documents
 */
async function createZipFromDocuments(documents: any[]): Promise<string> {
  // En production, utiliser JSZip ou Archiver
  // Pour l'instant, on retourne une simulation
  if (documents.length === 0) {
    return ''
  }
  
  // Simuler un ZIP (en production, utiliser la librairie JSZip)
  const fileInfos = documents.map(d => d.originalName).join(', ')
  console.log(`Creating ZIP with: ${fileInfos}`)
  
  // TODO: Implémenter avec JSZip
  // const JSZip = require('jszip')
  // const zip = new JSZip()
  // for (const doc of documents) {
  //   zip.file(doc.originalName, doc.fileData, { base64: true })
  // }
  // return await zip.generateAsync({ type: 'base64' })
  
  return Buffer.from(`ZIP_FILES:${documents.length}`).toString('base64')
}

/**
 * Génère le lien Stripe pour la commission de l'avocat
 */
async function generateStripeCommissionLink(lawyer: any, caseData: any): Promise<string> {
  // Si l'avocat a un compte Stripe Connect
  if (lawyer.stripeAccountId && lawyer.stripeOnboarded) {
    // Créer un paiement vers l'avocat
    try {
      const response = await fetch('https://api.stripe.com/v1/payment_links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'line_items[0][price_data][currency]': 'eur',
          'line_items[0][price_data][unit_amount]': caseData.commissionAmount.toString(),
          'line_items[0][price_data][product_data][name]': `Commission - Dossier ${caseData.reference}`,
          'line_items[0][quantity]': '1',
          'transfer_data[destination]': lawyer.stripeAccountId,
        }).toString(),
      })
      
      const data = await response.json()
      return data.url || '#'
    } catch (error) {
      console.error('Stripe error:', error)
    }
  }
  
  // Lien générique pour configurer Stripe Connect
  return `${process.env.NEXT_PUBLIC_APP_URL}/setup-stripe/${lawyer.id}`
}

/**
 * Génère le HTML de l'email pour l'avocat
 */
function generateLawyerEmailHTML(
  caseData: CaseData,
  zipBase64: string,
  stripeLink: string,
  commissionEuros: string
): string {
  const documentList = caseData.documents.map(d => 
    `<li>${d.originalName} (${formatSize(d.size)})</li>`
  ).join('')
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Dossier ${caseData.reference}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">
                📦 Nouveau dossier reçu
              </h1>
              <p style="margin: 15px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Référence: ${caseData.reference}
              </p>
            </td>
          </tr>
          
          <!-- Client Info -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 18px;">
                Informations client
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Nom</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500; text-align: right;">
                    ${caseData.clientName || 'Non renseigné'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500; text-align: right;">
                    ${caseData.clientEmail || '-'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Téléphone</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500; text-align: right;">
                    ${caseData.clientPhone || '-'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Type d'affaire</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500; text-align: right;">
                    ${caseData.caseType || 'Non spécifié'}
                  </td>
                </tr>
              </table>
              ${caseData.caseDescription ? `
              <div style="margin-top: 20px; padding: 15px; background-color: #f1f5f9; border-radius: 8px;">
                <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Description</p>
                <p style="margin: 8px 0 0; color: #1e293b; font-size: 14px;">${caseData.caseDescription}</p>
              </div>
              ` : ''}
            </td>
          </tr>
          
          <!-- Documents -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 15px; color: #1e293b; font-size: 18px;">
                📎 Documents (${caseData.documents.length})
              </h2>
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px;">
                <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px;">
                  ${documentList}
                </ul>
              </div>
              <p style="margin: 15px 0 0; color: #64748b; font-size: 13px;">
                ⬇️ Les documents sont joints à cet email au format ZIP
              </p>
            </td>
          </tr>
          
          <!-- Commission -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 25px; text-align: center;">
                <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                  Votre commission (20%)
                </p>
                <p style="margin: 8px 0 20px; color: #ffffff; font-size: 36px; font-weight: 700;">
                  ${commissionEuros}€
                </p>
                <a href="${stripeLink}" style="display: inline-block; background-color: #ffffff; color: #059669; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  💰 Récupérer ma commission
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Sécurité -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  ⚠️ <strong>Sécurité :</strong> Les données de ce dossier seront automatiquement supprimées dans 7 jours par mesure de confidentialité.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 12px;">
                FlashJuris - Transfert sécurisé de documents juridiques
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                Les documents sont chiffrés et supprimés automatiquement après 7 jours.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Formate la taille d'un fichier
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Envoie l'email de bienvenue avec le QR code
 */
export async function sendWelcomeEmail(lawyer: {
  id: string
  email: string
  name: string
  qrCodeImage: string
}): Promise<boolean> {
  console.log(`Sending welcome email to ${lawyer.email}`)
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bienvenue sur FlashJuris</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">
                ⚡ Bienvenue sur FlashJuris
              </h1>
              <p style="margin: 15px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Bonjour ${lawyer.name}, votre QR Code est prêt !
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px; text-align: center;">
              <p style="margin: 0 0 20px; color: #1e293b; font-size: 18px; font-weight: 600;">
                Votre QR Code personnel
              </p>
              <img src="${lawyer.qrCodeImage}" alt="QR Code" style="max-width: 250px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" />
              <p style="margin: 25px 0 0; color: #64748b; font-size: 14px;">
                Imprimez ce QR code et posez-le sur votre bureau.<br>
                Vos clients pourront scanner pour vous envoyer leurs documents.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 25px;">
                <h3 style="margin: 0 0 15px; color: #1e293b; font-size: 16px;">
                  Comment ça marche ?
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 2;">
                  <li>Le client scanne votre QR code</li>
                  <li>Il paie 149€ et upload ses documents</li>
                  <li>Vous recevez tout par email (ZIP)</li>
                  <li>Vous touchez 20% de commission (29,80€)</li>
                </ol>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                FlashJuris - Service 100% gratuit pour les avocats
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
  
  // En production avec Resend
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FlashJuris <bienvenue@flashjuris.com>',
          to: lawyer.email,
          subject: '⚡ Votre QR Code FlashJuris est prêt !',
          html: htmlContent,
        }),
      })
      return true
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      return false
    }
  }
  
  console.log('=== WELCOME EMAIL (DEV MODE) ===')
  console.log(`To: ${lawyer.email}`)
  console.log('================================')
  
  return true
}

/**
 * Envoie le rapport d'analyse à l'avocat
 */
export async function sendAnalysisReport(
  caseId: string,
  data: {
    lawyer: { name: string; email: string; firm: string | null }
    caseReference: string
    clientName: string | null
    caseType: string | null
    analysis: {
      summary: string
      keyPoints: string[]
      risks: string[]
      recommendations: string[]
      nextSteps: string[]
    }
  }
): Promise<boolean> {
  console.log(`Sending analysis report to ${data.lawyer.email}`)
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Analyse du dossier ${data.caseReference}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">📊 Analyse IA terminée</h1>
              <p style="margin: 15px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Dossier ${data.caseReference}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="margin: 0 0 15px; color: #1e293b; font-size: 18px;">Résumé</h2>
              <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">${data.analysis.summary || 'Aucun résumé disponible'}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">FlashJuris - Analyse IA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
  
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FlashJuris <analyse@flashjuris.com>',
          to: data.lawyer.email,
          subject: `📊 Analyse IA - Dossier ${data.caseReference}`,
          html: htmlContent,
        }),
      })
      return true
    } catch (error) {
      console.error('Failed to send analysis report:', error)
      return false
    }
  }
  
  console.log('=== ANALYSIS REPORT (DEV MODE) ===')
  console.log(`To: ${data.lawyer.email}`)
  console.log('==================================')
  return true
}

/**
 * Marque l'email comme ouvert (tracking pixel)
 */
export async function trackEmailOpened(caseId: string): Promise<void> {
  await prisma.case.update({
    where: { id: caseId },
    data: {
      emailOpened: true,
      emailOpenedAt: new Date(),
    },
  })
  
  await prisma.event.create({
    data: {
      type: 'email_opened',
      caseId,
    },
  })
}
